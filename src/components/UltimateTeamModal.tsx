import { useEffect, useState } from 'react';
import { FORMATIONS } from '../game/data';
import {
  RIVALS_DIVISIONS,
  UT_CARD_CATALOG,
  UT_FORMATIONS,
  UT_PACKS,
  autoPickRemainingDraft,
  buildAutoBestUtSquad,
  calculateUtSquadStats,
  createNewDraftSession,
  getRivalsDivisionInfo,
  getRivalsRankTier,
  getUtCardById,
  openUtPack,
  pickDraftCard,
  type UltimateTeamState,
  type UtCardRarity,
  type UtPackDefinition,
  type UtPackId,
  type UtPackOpenResult,
  type UtPlayerCard,
} from '../game/ultimateTeam';
import { soundEngine } from '../game/audio';

export type UltimateTeamTab = 'squad' | 'packs' | 'cards' | 'draft' | 'rivals';

interface UltimateTeamModalProps {
  isOpen: boolean;
  utState: UltimateTeamState;
  onUpdateUtState: (updater: (prev: UltimateTeamState) => UltimateTeamState) => void;
  onLaunchUtMatch: (subMode: 'squad' | 'draft' | 'rivals') => void;
  onClose: () => void;
}

const RARITY_STYLES: Record<
  UtCardRarity,
  { border: string; bg: string; badgeBg: string; label: string; glow: string }
> = {
  icon: {
    border: 'border-yellow-200',
    bg: 'linear-gradient(155deg, #422006 0%, #713f12 45%, #fef08a 140%)',
    badgeBg: 'bg-yellow-200 text-black',
    label: 'ICON',
    glow: 'shadow-[0_0_16px_rgba(254,240,138,0.65)]',
  },
  hero: {
    border: 'border-fuchsia-400',
    bg: 'linear-gradient(155deg, #3b0764 0%, #6b21a8 55%, #0284c7 130%)',
    badgeBg: 'bg-fuchsia-400 text-black',
    label: 'HERO',
    glow: 'shadow-[0_0_14px_rgba(232,121,249,0.55)]',
  },
  totw: {
    border: 'border-amber-400',
    bg: 'linear-gradient(155deg, #09090b 0%, #18181b 60%, #a16207 140%)',
    badgeBg: 'bg-amber-400 text-black',
    label: 'TOTW',
    glow: 'shadow-[0_0_12px_rgba(250,204,21,0.5)]',
  },
  gold: {
    border: 'border-yellow-400',
    bg: 'linear-gradient(155deg, #451a03 0%, #a16207 65%, #eab308 140%)',
    badgeBg: 'bg-yellow-400 text-black',
    label: 'GOLD',
    glow: '',
  },
  silver: {
    border: 'border-slate-300',
    bg: 'linear-gradient(155deg, #0f172a 0%, #334155 65%, #94a3b8 140%)',
    badgeBg: 'bg-slate-200 text-black',
    label: 'SILVER',
    glow: '',
  },
  bronze: {
    border: 'border-amber-700',
    bg: 'linear-gradient(155deg, #271204 0%, #78350f 70%, #b45309 140%)',
    badgeBg: 'bg-amber-600 text-black',
    label: 'BRONZE',
    glow: '',
  },
};

function UtCardTile({
  card,
  compact = false,
  selected = false,
  badgeText,
  onClick,
}: {
  card: UtPlayerCard;
  compact?: boolean;
  selected?: boolean;
  badgeText?: string;
  onClick?: () => void;
}) {
  const st = RARITY_STYLES[card.rarity];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{ background: st.bg }}
      className={`relative text-left border-2 transition-transform ${
        selected ? 'border-emerald-300 ring-2 ring-emerald-300 scale-[1.02]' : st.border
      } ${st.glow} ${compact ? 'p-2' : 'p-2.5'} ${
        onClick ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-default'
      }`}
    >
      {badgeText && (
        <span className="absolute -top-2 right-1.5 px-1.5 py-0.5 bg-emerald-400 text-black font-pixel text-[7px] border border-black z-10">
          {badgeText}
        </span>
      )}
      <div className="flex items-start justify-between gap-1.5">
        <div>
          <div className="font-pixel text-base sm:text-lg text-white leading-none tabular-nums">
            {card.ovr}
          </div>
          <div className="font-pixel text-[8px] text-yellow-200 mt-0.5">{card.positionLabel}</div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className={`px-1 py-0.5 font-pixel text-[6px] ${st.badgeBg}`}>{st.label}</span>
          <span className="font-pixel text-[7px] text-slate-200 tabular-nums">#{card.number}</span>
        </div>
      </div>

      <div className="mt-1.5 border-t border-white/25 pt-1">
        <div className="font-pixel text-[8px] sm:text-[9px] text-white truncate" dir="auto">
          {card.name}
        </div>
        <div className="font-pixel-body text-sm text-slate-200/90 truncate leading-tight" dir="auto">
          {card.clubName}
        </div>
      </div>

      {!compact && (
        <div className="mt-1.5 grid grid-cols-3 gap-x-1.5 gap-y-0.5 font-pixel-body text-xs sm:text-sm text-white/95 tabular-nums border-t border-white/20 pt-1">
          <div>PAC {card.pac}</div>
          <div>SHO {card.sho}</div>
          <div>PAS {card.pas}</div>
          <div>DRI {card.dri}</div>
          <div>DEF {card.def}</div>
          <div>PHY {card.phy}</div>
        </div>
      )}
    </button>
  );
}

export function UltimateTeamModal({
  isOpen,
  utState,
  onUpdateUtState,
  onLaunchUtMatch,
  onClose,
}: UltimateTeamModalProps) {
  const [tab, setTab] = useState<UltimateTeamTab>('squad');
  const [selectedSquadSlotIdx, setSelectedSquadSlotIdx] = useState<number | null>(null);
  const [cardFilter, setCardFilter] = useState<'all' | 'owned' | UtCardRarity>('all');
  const [cardSort, setCardSort] = useState<'ovr' | 'pac' | 'sho'>('ovr');

  // Pack Opening Animation State
  const [packReveal, setPackReveal] = useState<{
    packDef: UtPackDefinition;
    result: UtPackOpenResult;
    stage: 'shake' | 'burst' | 'walkout' | 'grid';
  } | null>(null);

  useEffect(() => {
    if (!packReveal || packReveal.stage === 'grid') return;
    const delayMs =
      packReveal.stage === 'shake' ? 700 : packReveal.stage === 'burst' ? 550 : 1050;
    const timer = window.setTimeout(() => {
      setPackReveal((prev) => {
        if (!prev) return null;
        if (prev.stage === 'shake') {
          soundEngine.playTackle();
          return { ...prev, stage: 'burst' };
        }
        if (prev.stage === 'burst') {
          soundEngine.playGoalFanfare();
          return { ...prev, stage: 'walkout' };
        }
        return { ...prev, stage: 'grid' };
      });
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [packReveal]);

  if (!isOpen) return null;

  const squadStats = calculateUtSquadStats(utState.activeSquadCardIds, utState.formation);
  const formDef = FORMATIONS.find((f) => f.id === utState.formation) ?? FORMATIONS[0];
  const ownedSet = new Set(utState.ownedCardIds);
  const activeXiSet = new Set(utState.activeSquadCardIds);
  const ownedCards = utState.ownedCardIds
    .map((id) => getUtCardById(id))
    .filter((c): c is UtPlayerCard => Boolean(c))
    .sort((a, b) => b.ovr - a.ovr);

  const handleOpenPack = (packDef: UtPackDefinition, useFreePackIndex: number | null) => {
    if (useFreePackIndex === null && utState.coins < packDef.costCoins) return;
    soundEngine.playMenuBlip();
    const seed = Date.now() + utState.packsOpenedCount * 137 + utState.coins;
    const result = openUtPack(packDef.id, utState.ownedCardIds, seed);

    onUpdateUtState((prev) => {
      const nextUnopened = [...prev.unopenedPacks];
      let nextCoins = prev.coins;
      if (useFreePackIndex !== null && useFreePackIndex >= 0 && useFreePackIndex < nextUnopened.length) {
        nextUnopened.splice(useFreePackIndex, 1);
      } else {
        nextCoins = Math.max(0, prev.coins - packDef.costCoins);
      }
      const owned = new Set(prev.ownedCardIds);
      for (const card of result.cards) {
        owned.add(card.id);
      }
      return {
        ...prev,
        coins: nextCoins + result.duplicateRefundCoins,
        ownedCardIds: Array.from(owned),
        unopenedPacks: nextUnopened,
        packsOpenedCount: prev.packsOpenedCount + 1,
      };
    });

    setPackReveal({
      packDef,
      result,
      stage: 'shake',
    });
  };

  const handleQuickSellCard = (card: UtPlayerCard) => {
    if (activeXiSet.has(card.id) || utState.ownedCardIds.length <= 11) return;
    soundEngine.playMenuBlip();
    onUpdateUtState((prev) => ({
      ...prev,
      coins: prev.coins + card.quickSellCoins,
      ownedCardIds: prev.ownedCardIds.filter((id) => id !== card.id),
    }));
  };

  const handleAssignOwnedToSlot = (cardId: string) => {
    if (selectedSquadSlotIdx === null) return;
    soundEngine.playMenuBlip();
    onUpdateUtState((prev) => {
      const next = [...prev.activeSquadCardIds];
      const existingSlot = next.indexOf(cardId);
      const displacedId = next[selectedSquadSlotIdx];
      if (existingSlot >= 0 && displacedId) {
        next[existingSlot] = displacedId;
      }
      next[selectedSquadSlotIdx] = cardId;
      return { ...prev, activeSquadCardIds: next };
    });
    setSelectedSquadSlotIdx(null);
  };

  const filteredCatalog = UT_CARD_CATALOG.filter((c) => {
    if (cardFilter === 'owned') return ownedSet.has(c.id);
    if (cardFilter !== 'all') return c.rarity === cardFilter;
    return true;
  }).sort((a, b) => {
    if (cardSort === 'pac') return b.pac - a.pac || b.ovr - a.ovr;
    if (cardSort === 'sho') return b.sho - a.sho || b.ovr - a.ovr;
    return b.ovr - a.ovr;
  });

  const draft = utState.draft;
  const draftStats =
    draft && draft.pickedCardIds.length > 0
      ? calculateUtSquadStats(draft.pickedCardIds, draft.formation)
      : null;

  const divInfo = getRivalsDivisionInfo(utState.rivals.division);
  const rankTier = getRivalsRankTier(utState.rivals.points);
  const rankLabel =
    rankTier === 3 ? 'RANK I' : rankTier === 2 ? 'RANK II' : rankTier === 1 ? 'RANK III' : 'UNRANKED';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="CAAYVG Ultimate Team Hub"
      data-testid="ultimate-team-modal"
      className="fixed inset-0 z-40 bg-black/90 flex items-center justify-center p-2 sm:p-4"
    >
      <div className="pixel-panel w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top UT Banner */}
        <div className="px-4 py-3 bg-[#0a1029] border-b-2 border-yellow-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-pixel text-xs sm:text-sm text-yellow-300">
              ULTIMATE TEAM · 11v11
            </h2>
            <span
              data-testid="ut-coins-badge"
              className="px-2 py-1 bg-amber-400 text-black font-pixel text-[9px] tabular-nums"
            >
              {utState.coins.toLocaleString()} COINS
            </span>
            <span className="px-2 py-1 bg-slate-800 border border-sky-400/70 text-sky-300 font-pixel text-[8px] tabular-nums">
              CLUB: {utState.ownedCardIds.length}/{UT_CARD_CATALOG.length} CARDS
            </span>
            {utState.unopenedPacks.length > 0 && (
              <span className="px-2 py-1 bg-emerald-400 text-black font-pixel text-[8px] tabular-nums">
                {utState.unopenedPacks.length} FREE PACK{utState.unopenedPacks.length > 1 ? 'S' : ''}
              </span>
            )}
          </div>
          <button
            type="button"
            data-testid="ut-close-btn"
            onClick={onClose}
            className="pixel-btn bg-rose-600 hover:bg-rose-500 text-white font-pixel text-[9px] px-3 py-1.5"
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 px-4 py-2 bg-[#060919] border-b border-slate-800">
          {(
            [
              { id: 'squad', label: 'YOUR TEAM (XI)' },
              {
                id: 'packs',
                label:
                  utState.unopenedPacks.length > 0
                    ? `PACKS (${utState.unopenedPacks.length})`
                    : 'PACKS & ANIMATION',
              },
              { id: 'cards', label: 'CARDS & RATINGS' },
              { id: 'draft', label: 'FUT DRAFT' },
              { id: 'rivals', label: `DIV RIVALS (D${utState.rivals.division === 0 ? 'ELITE' : utState.rivals.division})` },
            ] as { id: UltimateTeamTab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              data-testid={`ut-tab-${t.id}`}
              onClick={() => {
                soundEngine.playMenuBlip();
                setTab(t.id);
              }}
              className={`px-3 py-1.5 font-pixel text-[8px] sm:text-[9px] border transition-colors ${
                tab === t.id
                  ? 'border-yellow-400 bg-yellow-400 text-black'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-[#040713] space-y-4">
          {/* 1. YOUR TEAM (11v11 SQUAD BUILDER) */}
          {tab === 'squad' && (
            <div className="space-y-4">
              <div className="p-3 border-2 border-yellow-400 bg-[#080d22] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <div className="font-pixel text-[10px] text-yellow-300">
                      {utState.clubName}
                    </div>
                    <div className="font-pixel-body text-base text-slate-300">
                      11v11 Starting XI · Click any player slot to swap with owned club cards
                    </div>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="px-2.5 py-1 bg-emerald-400 text-black font-pixel text-[10px]">
                      OVR {squadStats.ovr}
                    </span>
                    <span className="px-2.5 py-1 bg-sky-400 text-black font-pixel text-[10px]">
                      CHEM {squadStats.chemistry}/33
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {UT_FORMATIONS.map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => {
                        soundEngine.playMenuBlip();
                        onUpdateUtState((prev) => ({ ...prev, formation: fmt }));
                      }}
                      className={`px-2 py-1 font-pixel text-[8px] border ${
                        utState.formation === fmt
                          ? 'border-yellow-400 bg-yellow-400 text-black'
                          : 'border-slate-700 bg-slate-900 text-slate-300'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                  <button
                    type="button"
                    data-testid="ut-autofill-best-btn"
                    onClick={() => {
                      soundEngine.playMenuBlip();
                      onUpdateUtState((prev) => ({
                        ...prev,
                        activeSquadCardIds: buildAutoBestUtSquad(prev.ownedCardIds, prev.formation),
                      }));
                    }}
                    className="pixel-btn bg-sky-500 hover:bg-sky-400 text-black font-pixel text-[8px] px-2.5 py-1.5"
                  >
                    AUTO-FILL BEST XI
                  </button>
                  <button
                    type="button"
                    data-testid="ut-play-squad-btn"
                    onClick={() => onLaunchUtMatch('squad')}
                    className="pixel-btn bg-emerald-500 hover:bg-emerald-400 text-black font-pixel text-[9px] px-3 py-1.5"
                  >
                    PLAY 11v11 SQUAD MATCH
                  </button>
                </div>
              </div>

              {/* Starting 11 Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {formDef.slotPositions.map((slotPos, idx) => {
                  const cardId = utState.activeSquadCardIds[idx];
                  const card = getUtCardById(cardId) ?? UT_CARD_CATALOG[idx];
                  const roleMatch = card.role === slotPos.role;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between px-1 font-pixel text-[7px]">
                        <span className="text-slate-400">
                          SLOT {idx + 1} · {slotPos.role}
                        </span>
                        <span className={roleMatch ? 'text-emerald-400' : 'text-amber-400'}>
                          {roleMatch ? 'FIT' : 'OOP'}
                        </span>
                      </div>
                      <UtCardTile
                        card={card}
                        compact
                        selected={selectedSquadSlotIdx === idx}
                        badgeText={selectedSquadSlotIdx === idx ? 'SWAPPING' : undefined}
                        onClick={() => {
                          soundEngine.playMenuBlip();
                          setSelectedSquadSlotIdx(selectedSquadSlotIdx === idx ? null : idx);
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Swap Club Cards Drawer */}
              {selectedSquadSlotIdx !== null && (
                <div className="p-3 border-2 border-emerald-400 bg-slate-950 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-pixel text-[9px] text-emerald-300">
                      PICK CLUB CARD FOR SLOT {selectedSquadSlotIdx + 1} (
                      {formDef.slotPositions[selectedSquadSlotIdx]?.role})
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSquadSlotIdx(null)}
                      className="px-2 py-1 bg-slate-800 text-white font-pixel text-[8px]"
                    >
                      CANCEL
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto pr-1">
                    {ownedCards.map((card) => (
                      <UtCardTile
                        key={card.id}
                        card={card}
                        compact
                        badgeText={activeXiSet.has(card.id) ? 'IN XI' : undefined}
                        onClick={() => handleAssignOwnedToSlot(card.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. PACKS & PACK ANIMATION */}
          {tab === 'packs' && (
            <div className="space-y-4">
              {utState.unopenedPacks.length > 0 && (
                <div className="p-3 border-2 border-emerald-400 bg-emerald-950/30 space-y-2">
                  <div className="font-pixel text-[10px] text-emerald-300">
                    UNOPENED REWARD PACKS ({utState.unopenedPacks.length})
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {utState.unopenedPacks.map((pId, idx) => {
                      const def = UT_PACKS.find((p) => p.id === pId) ?? UT_PACKS[2];
                      return (
                        <button
                          key={`${pId}-${idx}`}
                          type="button"
                          data-testid={`ut-open-free-pack-${idx}`}
                          onClick={() => handleOpenPack(def, idx)}
                          className="pixel-btn bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[9px] px-3 py-2"
                        >
                          OPEN {def.name} (FREE)
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {UT_PACKS.map((pack) => {
                  const canAfford = utState.coins >= pack.costCoins;
                  return (
                    <div
                      key={pack.id}
                      style={{ background: pack.bgGradient }}
                      className="p-3.5 border-2 border-white/80 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-pixel text-[9px] text-yellow-200">
                            {pack.cardCount} CARDS
                          </span>
                          <span className="font-pixel text-[8px] bg-black/70 text-white px-1.5 py-0.5 tabular-nums">
                            MIN {pack.minOvr}+
                          </span>
                        </div>
                        <div className="font-pixel text-xs text-white mt-2 leading-snug">
                          {pack.name}
                        </div>
                        <p className="font-pixel-body text-base text-slate-100/90 mt-1">
                          {pack.subtitle}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={!canAfford}
                        data-testid={`ut-buy-pack-${pack.id}`}
                        onClick={() => handleOpenPack(pack, null)}
                        className="pixel-btn w-full py-2.5 font-pixel text-[9px] bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-800 disabled:text-slate-500 text-black tabular-nums"
                      >
                        BUY &amp; OPEN · {pack.costCoins.toLocaleString()}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. CARDS & RATINGS */}
          {tab === 'cards' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'ALL CARDS' },
                      { id: 'owned', label: `OWNED (${utState.ownedCardIds.length})` },
                      { id: 'icon', label: 'ICON' },
                      { id: 'hero', label: 'HERO' },
                      { id: 'totw', label: 'TOTW' },
                      { id: 'gold', label: 'GOLD' },
                      { id: 'silver', label: 'SILVER' },
                      { id: 'bronze', label: 'BRONZE' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCardFilter(f.id)}
                      className={`px-2 py-1 font-pixel text-[8px] border ${
                        cardFilter === f.id
                          ? 'border-yellow-400 bg-yellow-400 text-black'
                          : 'border-slate-700 bg-slate-900 text-slate-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-pixel text-[8px] text-slate-400">SORT:</span>
                  {(['ovr', 'pac', 'sho'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCardSort(s)}
                      className={`px-2 py-1 font-pixel text-[8px] uppercase ${
                        cardSort === s ? 'bg-sky-400 text-black' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {filteredCatalog.map((card) => {
                  const isOwned = ownedSet.has(card.id);
                  const inXi = activeXiSet.has(card.id);
                  return (
                    <div key={card.id} className="space-y-1">
                      <div className={isOwned ? '' : 'opacity-65'}>
                        <UtCardTile
                          card={card}
                          badgeText={inXi ? 'IN XI' : isOwned ? 'OWNED' : undefined}
                        />
                      </div>
                      {isOwned && !inXi && utState.ownedCardIds.length > 11 && (
                        <button
                          type="button"
                          onClick={() => handleQuickSellCard(card)}
                          className="w-full py-1 bg-slate-800 hover:bg-amber-400 hover:text-black font-pixel text-[7px] text-amber-300 border border-slate-700 tabular-nums"
                        >
                          QUICK SELL +{card.quickSellCoins}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. FUT DRAFT (11 ROUNDS · 11v11) */}
          {tab === 'draft' && (
            <div className="space-y-4">
              {!draft ? (
                <div className="p-5 border-2 border-yellow-400 bg-[#080d22] text-center space-y-3">
                  <h3 className="font-pixel text-xs sm:text-sm text-yellow-300">
                    START A 11v11 FUT DRAFT CHALLENGE
                  </h3>
                  <p className="font-pixel-body text-lg text-slate-300 max-w-xl mx-auto">
                    Pick a formation, draft 11 star cards from random 4-card rounds (including ICONS &amp; HEROES), and win the Draft Cup for Gold Packs &amp; Coins!
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {UT_FORMATIONS.map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        data-testid={`ut-draft-start-${fmt}`}
                        onClick={() => {
                          soundEngine.playMenuBlip();
                          onUpdateUtState((prev) => ({
                            ...prev,
                            draft: createNewDraftSession(fmt, Date.now()),
                          }));
                        }}
                        className="pixel-btn bg-emerald-500 hover:bg-emerald-400 text-black font-pixel text-[9px] px-3 py-2"
                      >
                        DRAFT {fmt} (FREE ENTRY)
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 border-2 border-sky-400 bg-[#080d22] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-pixel text-[10px] text-sky-300">
                        DRAFT ({draft.formation}) · PICK {Math.min(draft.round + 1, 11)}/11
                      </span>
                      {draftStats && (
                        <span className="font-pixel text-[9px] text-yellow-300 tabular-nums">
                          OVR {draftStats.ovr} · CHEM {draftStats.chemistry}/33 · WINS {draft.wins}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {draft.round < 11 && (
                        <button
                          type="button"
                          data-testid="ut-draft-autopick-btn"
                          onClick={() => {
                            soundEngine.playMenuBlip();
                            onUpdateUtState((prev) => ({
                              ...prev,
                              draft: prev.draft
                                ? autoPickRemainingDraft(prev.draft, Date.now())
                                : null,
                            }));
                          }}
                          className="pixel-btn bg-sky-500 hover:bg-sky-400 text-black font-pixel text-[8px] px-2.5 py-1.5"
                        >
                          AUTO-PICK REMAINING
                        </button>
                      )}
                      {draft.round >= 11 && (
                        <button
                          type="button"
                          data-testid="ut-play-draft-btn"
                          onClick={() => onLaunchUtMatch('draft')}
                          className="pixel-btn bg-emerald-500 hover:bg-emerald-400 text-black font-pixel text-[9px] px-3 py-1.5"
                        >
                          PLAY 11v11 DRAFT MATCH
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playMenuBlip();
                          onUpdateUtState((prev) => ({ ...prev, draft: null }));
                        }}
                        className="pixel-btn bg-slate-700 hover:bg-slate-600 text-white font-pixel text-[8px] px-2.5 py-1.5"
                      >
                        NEW DRAFT
                      </button>
                    </div>
                  </div>

                  {draft.round < 11 ? (
                    <div className="space-y-2">
                      <div className="font-pixel text-[9px] text-yellow-300">
                        PICK 1 OF 4 FOR SLOT {draft.round + 1}:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {draft.currentChoices.map((card, cIdx) => (
                          <div key={card.id} data-testid={`ut-draft-choice-${cIdx}`}>
                            <UtCardTile
                              card={card}
                              onClick={() => {
                                soundEngine.playMenuBlip();
                                onUpdateUtState((prev) => ({
                                  ...prev,
                                  draft: prev.draft
                                    ? pickDraftCard(prev.draft, card.id, Date.now())
                                    : null,
                                }));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border border-emerald-500/70 bg-emerald-950/20 font-pixel text-[9px] text-emerald-300 text-center">
                      DRAFT XI COMPLETE! CLICK &quot;PLAY 11v11 DRAFT MATCH&quot; FOR GOLD PACKS &amp; +5,500 COINS!
                    </div>
                  )}

                  {draft.pickedCardIds.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {draft.pickedCardIds.map((id, idx) => {
                        const card = getUtCardById(id);
                        return card ? (
                          <UtCardTile key={`${id}-${idx}`} card={card} compact badgeText={`#${idx + 1}`} />
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. DIVISION RIVALS */}
          {tab === 'rivals' && (
            <div className="space-y-4">
              <div className="p-4 border-2 border-yellow-400 bg-[#080d22] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-pixel text-xs sm:text-sm text-yellow-300">
                    {divInfo.label} · {rankLabel}
                  </div>
                  <div className="font-pixel-body text-lg text-slate-200 mt-1 tabular-nums">
                    Record: {utState.rivals.wins}W - {utState.rivals.draws}D - {utState.rivals.losses}L · Streak: {utState.rivals.winStreak}
                  </div>
                  <div className="font-pixel-body text-base text-sky-300 tabular-nums">
                    Win Streak x2 or reach {divInfo.targetPoints} PTS to Promote + Silver Pack!
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="ut-play-rivals-btn"
                  onClick={() => onLaunchUtMatch('rivals')}
                  className="pixel-btn bg-emerald-500 hover:bg-emerald-400 text-black font-pixel text-xs px-4 py-3"
                >
                  PLAY 11v11 RIVALS MATCH (VS OVR {divInfo.opponentOvr})
                </button>
              </div>

              {/* Weekly Points Progress */}
              <div className="p-3 border border-slate-700 bg-slate-900/70 space-y-2">
                <div className="flex justify-between font-pixel text-[9px] tabular-nums">
                  <span className="text-slate-300">WEEKLY POINTS: {utState.rivals.points} / 1250</span>
                  <span className="text-yellow-300">RANK I REWARD: {divInfo.rank1RewardCoins.toLocaleString()} COINS</span>
                </div>
                <div className="w-full h-3 bg-black border border-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 via-emerald-400 to-yellow-400 transition-all"
                    style={{ width: `${Math.min(100, Math.round((utState.rivals.points / 1250) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Division Ladder */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {RIVALS_DIVISIONS.map((d) => {
                  const isCurrent = d.division === utState.rivals.division;
                  const unlocked = d.division >= utState.rivals.division;
                  return (
                    <div
                      key={d.division}
                      className={`p-2 border text-center tabular-nums ${
                        isCurrent
                          ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                          : unlocked
                          ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-500'
                      }`}
                    >
                      <div className="font-pixel text-[8px]">{d.label}</div>
                      <div className="font-pixel-body text-sm mt-0.5">CPU OVR {d.opponentOvr}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pack Opening & Walkout Star Animation Overlay */}
      {packReveal && (
        <div
          data-testid="ut-pack-animation-overlay"
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
        >
          <div className="pixel-panel w-full max-w-4xl p-5 sm:p-6 space-y-5 text-center border-4 border-yellow-400">
            <div className="flex items-center justify-between gap-2">
              <span className="font-pixel text-[10px] text-yellow-300">
                {packReveal.packDef.name}
              </span>
              {packReveal.stage !== 'grid' && (
                <button
                  type="button"
                  data-testid="ut-skip-pack-anim-btn"
                  onClick={() => setPackReveal((p) => (p ? { ...p, stage: 'grid' } : null))}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-pixel text-[8px] border border-slate-500"
                >
                  SKIP ANIMATION
                </button>
              )}
            </div>

            {packReveal.stage === 'shake' && (
              <div className="py-14 space-y-4">
                <div
                  style={{ background: packReveal.packDef.bgGradient }}
                  className="mx-auto w-44 h-60 border-4 border-yellow-300 flex flex-col items-center justify-center p-4 animate-bounce shadow-[0_0_32px_rgba(250,204,21,0.7)]"
                >
                  <div className="font-pixel text-xs text-yellow-200">CAAYVG UT</div>
                  <div className="font-pixel text-lg text-white mt-2">PACK</div>
                  <div className="font-pixel text-[8px] text-amber-200 mt-3">OPENING...</div>
                </div>
              </div>
            )}

            {packReveal.stage === 'burst' && (
              <div className="py-14 space-y-3">
                <div className="font-pixel text-sm sm:text-base text-sky-300 animate-pulse">
                  WALKOUT TUNNEL FLARE · {packReveal.result.walkoutCard.rarity.toUpperCase()}!
                </div>
                <div className="font-pixel text-2xl sm:text-4xl text-yellow-300 tabular-nums">
                  {packReveal.result.walkoutCard.nation} · {packReveal.result.walkoutCard.positionLabel} ·{' '}
                  {packReveal.result.walkoutCard.ovr} OVR
                </div>
                <div className="font-pixel-body text-2xl text-white" dir="auto">
                  {packReveal.result.walkoutCard.clubName}
                </div>
              </div>
            )}

            {packReveal.stage === 'walkout' && (
              <div className="py-4 space-y-3">
                <div className="font-pixel text-xs text-yellow-300">
                  WALKOUT STAR REVEAL!
                </div>
                <div className="max-w-xs mx-auto transform scale-105">
                  <UtCardTile card={packReveal.result.walkoutCard} badgeText="WALKOUT!" />
                </div>
              </div>
            )}

            {packReveal.stage === 'grid' && (
              <div className="space-y-4">
                <div className="font-pixel text-xs sm:text-sm text-emerald-300">
                  5 CARDS ADDED TO YOUR CLUB!
                  {packReveal.result.duplicateRefundCoins > 0 && (
                    <span className="text-yellow-300 ml-2 tabular-nums">
                      (+{packReveal.result.duplicateRefundCoins.toLocaleString()} DUPLICATE COINS)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-left">
                  {packReveal.result.cards.map((c) => {
                    const isWalkout = c.id === packReveal.result.walkoutCard.id;
                    const isDup = packReveal.result.duplicateIds.includes(c.id);
                    return (
                      <UtCardTile
                        key={c.id}
                        card={c}
                        badgeText={isDup ? 'DUP +$' : isWalkout ? 'WALKOUT' : 'NEW!'}
                      />
                    );
                  })}
                </div>
                <button
                  type="button"
                  data-testid="ut-claim-pack-btn"
                  onClick={() => {
                    soundEngine.playMenuBlip();
                    setPackReveal(null);
                  }}
                  className="pixel-btn bg-emerald-500 hover:bg-emerald-400 text-black font-pixel text-xs px-6 py-3"
                >
                  CLAIM INTO CLUB
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
