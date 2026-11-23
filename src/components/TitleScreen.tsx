import { useEffect, useRef, useState } from 'react';
import {
  COMPETITIONS,
  DIFFICULTY_OPTIONS,
  GAME_VERSION,
  MATCH_LENGTH_OPTIONS,
} from '../game/data';
import { TOTAL_LEAGUE_ROUNDS } from '../game/rules';
import {
  getCompetitionLogoDataUrl,
  renderCompetitionPanel,
  subscribeCompetitionLogos,
} from '../game/tunnelLogos';
import type { CompetitionId, GameDifficulty, Team } from '../game/types';
import { ClubBadge } from './ClubBadge';
import type { TournamentModalTab } from './TournamentModal';

export type CupJumpTarget = 'GROUP' | 'R16' | 'QF' | 'SF' | 'FINAL';

interface TitleScreenProps {
  selectedCompetition: CompetitionId;
  onSelectCompetition: (id: CompetitionId) => void;
  currentLeagueRound?: number;
  isSingleplayerTour?: boolean;
  difficulty: GameDifficulty;
  onChangeDifficulty: (difficulty: GameDifficulty) => void;
  matchHalfSeconds: number;
  onChangeMatchHalfSeconds: (seconds: number) => void;
  userTeam: Team;
  opponentTeam: Team;
  rivalryTitle: string | null;
  stadiumName: string;
  matchDateLabel: string;
  matchTimeLabel: string;
  activeCupStageLabel?: string;
  onOpenTournament: (initialTab?: TournamentModalTab) => void;
  onJumpCupRound: (compId: 'king_cup' | 'anime_cup', target: CupJumpTarget) => void;
  onWatchIntro: () => void;
  onLaunchClasico: () => void;
  onOpenUltimateTeam?: () => void;
  utCoins?: number;
  unopenedPacksCount?: number;
  onStartMatch: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export function TitleScreen({
  selectedCompetition,
  onSelectCompetition,
  currentLeagueRound = 1,
  isSingleplayerTour = false,
  difficulty,
  onChangeDifficulty,
  matchHalfSeconds,
  onChangeMatchHalfSeconds,
  userTeam,
  opponentTeam,
  rivalryTitle,
  stadiumName,
  matchDateLabel,
  matchTimeLabel,
  activeCupStageLabel,
  onOpenTournament,
  onJumpCupRound,
  onWatchIntro,
  onLaunchClasico,
  onOpenUltimateTeam,
  utCoins = 0,
  unopenedPacksCount = 0,
  onStartMatch,
  muted,
  onToggleMute,
}: TitleScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedRef = useRef(selectedCompetition);
  selectedRef.current = selectedCompetition;

  const isFinale38 = currentLeagueRound === TOTAL_LEAGUE_ROUNDS;
  const isRoadTo38Window = currentLeagueRound >= 30 && currentLeagueRound < TOTAL_LEAGUE_ROUNDS;

  const [logoUrls, setLogoUrls] = useState<
    Partial<Record<CompetitionId | 'league_rainbow' | 'league_yellow_glow', string>>
  >(() => ({
    league: getCompetitionLogoDataUrl('league') ?? undefined,
    league_rainbow: getCompetitionLogoDataUrl('league_rainbow') ?? undefined,
    league_yellow_glow: getCompetitionLogoDataUrl('league_yellow_glow') ?? undefined,
    king_cup: getCompetitionLogoDataUrl('king_cup') ?? undefined,
    super_cup: getCompetitionLogoDataUrl('super_cup') ?? undefined,
    anime_cup: getCompetitionLogoDataUrl('anime_cup') ?? undefined,
  }));

  useEffect(() => {
    const sync = () => {
      setLogoUrls({
        league: getCompetitionLogoDataUrl('league') ?? undefined,
        league_rainbow: getCompetitionLogoDataUrl('league_rainbow') ?? undefined,
        league_yellow_glow: getCompetitionLogoDataUrl('league_yellow_glow') ?? undefined,
        king_cup: getCompetitionLogoDataUrl('king_cup') ?? undefined,
        super_cup: getCompetitionLogoDataUrl('super_cup') ?? undefined,
        anime_cup: getCompetitionLogoDataUrl('anime_cup') ?? undefined,
      });
    };
    sync();
    return subscribeCompetitionLogos(sync);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId = 0;
    const startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const w = canvas.width;
        const h = canvas.height;
        const hw = Math.floor(w / 2);
        const hh = Math.floor(h / 2);
        const sel = selectedRef.current;

        renderCompetitionPanel(ctx, 0, 0, hw, hh, 'league', elapsed, sel === 'league');
        renderCompetitionPanel(ctx, hw, 0, w - hw, hh, 'king_cup', elapsed, sel === 'king_cup');
        renderCompetitionPanel(ctx, 0, hh, hw, h - hh, 'super_cup', elapsed, sel === 'super_cup');
        renderCompetitionPanel(ctx, hw, hh, w - hw, h - hh, 'anime_cup', elapsed, sel === 'anime_cup');
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const activeComp = COMPETITIONS.find((c) => c.id === selectedCompetition) ?? COMPETITIONS[0];
  const cupStageTargets: { id: CupJumpTarget; label: string }[] =
    selectedCompetition === 'king_cup'
      ? [
          { id: 'GROUP', label: 'GROUP STAGES' },
          { id: 'R16', label: 'ROUND OF 16' },
          { id: 'QF', label: 'QUARTERFINAL' },
          { id: 'SF', label: 'SEMIFINAL' },
          { id: 'FINAL', label: 'FINAL' },
        ]
      : [
          { id: 'GROUP', label: 'GROUP STAGES' },
          { id: 'QF', label: 'QUARTERFINAL' },
          { id: 'SF', label: 'SEMIFINAL' },
          { id: 'FINAL', label: 'FINAL' },
        ];

  return (
    <div className="w-full h-full bg-black overflow-hidden flex flex-col">
      {/* 4-Split Rotating Tunnel Showcase + Real Transparent Non-Pixelated Logos */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          data-testid="title-tunnel-canvas"
          className="w-full h-full object-fill block"
        />

        {/* Interactive Quadrant Hit Targets for selecting each of the 4 competitions */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {COMPETITIONS.map((comp) => {
            const isSelected = selectedCompetition === comp.id;
            const logoSrc =
              comp.id === 'league'
                ? isFinale38
                  ? logoUrls.league_rainbow ?? logoUrls.league
                  : isRoadTo38Window
                  ? logoUrls.league_yellow_glow ?? logoUrls.league
                  : logoUrls.league
                : logoUrls[comp.id];
            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => onSelectCompetition(comp.id)}
                aria-label={`Select ${comp.title} ${comp.season}`}
                aria-pressed={isSelected}
                className={`relative flex items-start justify-start p-2.5 sm:p-3 focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 transition-colors ${
                  isSelected ? 'ring-4 ring-inset ring-white bg-white/5' : 'hover:bg-white/5'
                }`}
              >
                <div className="inline-flex flex-wrap items-center gap-1 sm:gap-2 bg-black/85 border-2 border-white/80 px-1.5 sm:px-2 py-1 z-10 max-w-full text-left">
                  <span
                    className="font-pixel text-[7px] sm:text-[10px] tracking-tight"
                    style={{ color: comp.badgeTextColor }}
                  >
                    {comp.id === 'league'
                      ? `R${currentLeagueRound}/${TOTAL_LEAGUE_ROUNDS} · ${comp.formatLabel}`
                      : comp.id === 'king_cup' || comp.id === 'anime_cup'
                      ? `${comp.formatLabel} · GROUPS + KO`
                      : comp.formatLabel}
                  </span>
                  {comp.id === 'league' && isRoadTo38Window && (
                    <span className="font-pixel text-[6px] sm:text-[8px] bg-yellow-300 text-black px-1 py-0.5 whitespace-nowrap">
                      ROAD TO THE ROUND 38!
                    </span>
                  )}
                  {comp.id === 'league' && isFinale38 && (
                    <span className="font-pixel text-[6px] sm:text-[8px] bg-gradient-to-r from-red-500 via-yellow-300 to-sky-400 text-black px-1 py-0.5 whitespace-nowrap">
                      THE GRAND FINALE 38!
                    </span>
                  )}
                  {isSelected && (
                    <span className="font-pixel text-[6px] sm:text-[8px] bg-yellow-400 text-black px-1 py-0.5">
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Real, realistic, unpixelated transparent-background competition logo */}
                {logoSrc && (
                  <img
                    src={logoSrc}
                    alt={`${comp.title} ${comp.season} logo`}
                    style={{ imageRendering: 'auto' }}
                    className={`pointer-events-none select-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 h-[28%] sm:h-[32%] w-auto max-w-[36%] object-contain ${
                      comp.id === 'anime_cup' ||
                      comp.id === 'king_cup' ||
                      (comp.id === 'league' && (isRoadTo38Window || isFinale38))
                        ? 'drop-shadow-[0_0_14px_rgba(250,204,21,0.95)]'
                        : 'drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cup Quick Round-Jump Bar (for King Champion Cup & Anime King Champion Cup) */}
      {(selectedCompetition === 'king_cup' || selectedCompetition === 'anime_cup') && !isSingleplayerTour && (
        <div
          data-testid="cup-stage-jump-bar"
          className="shrink-0 bg-[#080d22] border-t-2 border-slate-700 px-3 py-1.5 flex flex-wrap items-center justify-center gap-1.5"
        >
          <span className="font-pixel text-[8px] sm:text-[9px] text-yellow-300 mr-1">
            {activeComp.title} STAGE JUMP:
          </span>
          {cupStageTargets.map((stg) => {
            const isCurrentStage =
              (stg.id === 'GROUP' && activeCupStageLabel === 'GROUP STAGES') ||
              (stg.id === 'R16' && activeCupStageLabel === 'ROUND OF 16') ||
              (stg.id === 'QF' && activeCupStageLabel === 'QUARTERFINAL') ||
              (stg.id === 'SF' && activeCupStageLabel === 'SEMIFINAL') ||
              (stg.id === 'FINAL' && activeCupStageLabel === 'GRAND FINALE');
            return (
              <button
                key={stg.id}
                type="button"
                data-testid={`cup-jump-${stg.id.toLowerCase()}`}
                onClick={() => onJumpCupRound(selectedCompetition, stg.id)}
                className={`pixel-btn font-pixel text-[7px] sm:text-[8px] px-2 py-1 whitespace-nowrap ${
                  isCurrentStage
                    ? 'bg-yellow-400 text-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {stg.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom 8-bit Match Control Bar */}
      <div className="shrink-0 bg-[#060919] border-t-4 border-yellow-400 px-3 py-2 sm:px-5">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          {/* Row 1: Matchup + Selected Mode + Version/Changelog + Stadium + Date/Time + SFX */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 shrink-0">
                <ClubBadge team={userTeam} size={32} />
                <span className="font-pixel text-[8px] text-slate-400">VS</span>
                <ClubBadge team={opponentTeam} size={26} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-pixel text-[10px] sm:text-xs text-yellow-300">
                    {activeComp.title} {activeComp.season}
                    {selectedCompetition === 'league' && !isSingleplayerTour
                      ? ` · ROUND ${currentLeagueRound}/${TOTAL_LEAGUE_ROUNDS}`
                      : activeCupStageLabel && !isSingleplayerTour
                      ? ` · ${activeCupStageLabel}`
                      : ''}
                  </span>
                  <span
                    data-testid="game-version-badge"
                    className="font-pixel text-[8px] bg-indigo-950 border border-indigo-400 text-indigo-200 px-1.5 py-0.5 whitespace-nowrap"
                  >
                    {GAME_VERSION}
                  </span>
                  <button
                    type="button"
                    data-testid="open-changelog-btn"
                    onClick={() => onOpenTournament('changelog')}
                    className="font-pixel text-[8px] bg-amber-950 hover:bg-amber-400 hover:text-black border border-amber-400 text-amber-200 px-1.5 py-0.5 whitespace-nowrap transition-colors"
                  >
                    CHANGELOG
                  </button>
                  <span className="font-pixel text-[8px] bg-slate-800 border border-sky-400/70 text-sky-300 px-1.5 py-0.5 whitespace-nowrap">
                    {matchDateLabel} · {matchTimeLabel}
                  </span>
                  {selectedCompetition === 'league' && !isSingleplayerTour && isRoadTo38Window && (
                    <span className="font-pixel text-[8px] bg-yellow-300 text-black px-1.5 py-0.5 whitespace-nowrap">
                      ROAD TO THE ROUND 38!
                    </span>
                  )}
                  {selectedCompetition === 'league' && !isSingleplayerTour && isFinale38 && (
                    <span className="font-pixel text-[8px] bg-gradient-to-r from-red-500 via-yellow-300 to-emerald-400 text-black px-1.5 py-0.5 whitespace-nowrap">
                      THE GRAND FINALE 38!
                    </span>
                  )}
                  {rivalryTitle && (
                    <span className="font-pixel text-[9px] bg-yellow-400 text-black px-1.5 py-0.5 whitespace-nowrap">
                      {rivalryTitle}
                    </span>
                  )}
                </div>
                <div className="font-pixel-body text-base sm:text-lg text-slate-200 leading-tight truncate mt-0.5" dir="auto">
                  {userTeam.name} ({userTeam.shortCode}) vs {opponentTeam.name} ({opponentTeam.shortCode}) · {stadiumName}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-white font-pixel text-[9px] sm:text-[10px] px-2.5 py-1.5 whitespace-nowrap shrink-0"
            >
              {muted ? 'SFX OFF' : 'SFX ON'}
            </button>
          </div>

          {/* Row 2: Primary Mode & Kick-Off Actions */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
            <button
              type="button"
              data-testid="watch-intro-btn"
              onClick={onWatchIntro}
              className="pixel-btn bg-purple-600 hover:bg-purple-500 text-white font-pixel text-[9px] sm:text-[10px] px-3 py-2 whitespace-nowrap"
            >
              20S 3D INTRO
            </button>
            <button
              type="button"
              onClick={onLaunchClasico}
              className="pixel-btn bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[9px] sm:text-[10px] px-3 py-2 whitespace-nowrap"
            >
              THE CLÁSICO
            </button>
            {selectedCompetition === 'league' && !isSingleplayerTour ? (
              <button
                type="button"
                data-testid="open-fixtures-btn"
                onClick={() => onOpenTournament('fixtures')}
                className="pixel-btn bg-sky-500 hover:bg-sky-400 text-black font-pixel text-[9px] sm:text-[10px] px-3 py-2 whitespace-nowrap"
              >
                FIXTURES R{currentLeagueRound}/38
              </button>
            ) : (
              <button
                type="button"
                data-testid="open-cups-btn"
                onClick={() => onOpenTournament('bracket')}
                className="pixel-btn bg-sky-500 hover:bg-sky-400 text-black font-pixel text-[9px] sm:text-[10px] px-3 py-2 whitespace-nowrap"
              >
                CUPS &amp; GROUPS
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenTournament('teams')}
              className="pixel-btn bg-indigo-700 hover:bg-indigo-600 text-white font-pixel text-[9px] sm:text-[10px] px-3 py-2 whitespace-nowrap"
            >
              42 CLUBS · HUB
            </button>
            {onOpenUltimateTeam && (
              <button
                type="button"
                data-testid="open-ultimate-team-btn"
                onClick={onOpenUltimateTeam}
                className="pixel-btn bg-amber-400 hover:bg-amber-300 text-black font-pixel text-[9px] sm:text-[10px] px-3 py-2 whitespace-nowrap tabular-nums"
              >
                ULTIMATE TEAM · {utCoins.toLocaleString()}
                {unopenedPacksCount > 0 ? ` (${unopenedPacksCount}P)` : ''}
              </button>
            )}
            <button
              type="button"
              data-start="true"
              onClick={onStartMatch}
              className="pixel-btn bg-emerald-500 hover:bg-emerald-400 text-black font-pixel text-xs px-4 py-2 whitespace-nowrap"
            >
              KICK OFF
            </button>
          </div>
        </div>

        {/* Difficulty + Match Half Length Quick Controls + Hint */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Game difficulty">
            <span className="font-pixel text-[8px] text-amber-300 mr-1">DIFFICULTY:</span>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-testid={`title-difficulty-${opt.id}`}
                onClick={() => onChangeDifficulty(opt.id)}
                className={`px-2 py-1 font-pixel text-[7px] sm:text-[8px] border transition-colors ${
                  difficulty === opt.id
                    ? 'border-amber-300 bg-amber-400 text-black'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Half length">
            <span className="font-pixel text-[8px] text-emerald-300 mr-1">HALF LENGTH:</span>
            {MATCH_LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt.halfSeconds}
                type="button"
                data-testid={`title-length-${opt.halfSeconds}`}
                onClick={() => onChangeMatchHalfSeconds(opt.halfSeconds)}
                title={opt.label}
                className={`px-2 py-1 font-pixel text-[7px] sm:text-[8px] border transition-colors tabular-nums ${
                  matchHalfSeconds === opt.halfSeconds
                    ? 'border-emerald-300 bg-emerald-400 text-black'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                }`}
              >
                {opt.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Single flat control hint line */}
        <p className="mt-1 text-center font-pixel-body text-sm text-slate-300 tracking-wide">
          WASD / Arrows Move & Dribble · J Pass / Switch · E / L Loft Pass · K / Space Shoot / Tackle · Shift Sprint · Enter Start
        </p>
      </div>
    </div>
  );
}
