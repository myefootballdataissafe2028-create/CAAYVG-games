import { useState } from 'react';
import { COMPETITIONS, FORMATIONS, TACTICS } from '../game/data';
import type {
  FormationId,
  MatchHudSnapshot,
  MatchResultSummary,
  TacticId,
} from '../game/types';
import { ClubBadge } from './ClubBadge';

interface MatchModalProps {
  mode: 'paused' | 'gameover' | null;
  result: MatchResultSummary | null;
  hud?: MatchHudSnapshot | null;
  onChangeFormationTactic?: (formation: FormationId, tactic: TacticId) => void;
  onSubstitutePlayer?: (outStarterIdx: number, inBenchIdx: number) => void;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}

export function MatchModal({
  mode,
  result,
  hud,
  onChangeFormationTactic,
  onSubstitutePlayer,
  onResume,
  onRestart,
  onReturnTitle,
}: MatchModalProps) {
  const [selectedSubOutIdx, setSelectedSubOutIdx] = useState<number | null>(null);

  if (!mode) return null;

  if (mode === 'paused') {
    const formation = hud?.homeFormation ?? '4-3-3';
    const tactic = hud?.homeTactic ?? 'balanced';
    const starters = hud?.homeLineupPlayers ?? [];
    const bench = hud?.homeBench ?? [];

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Match paused"
        className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-3 sm:p-4"
      >
        <div className="pixel-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="text-center">
            <h2 className="font-pixel text-base sm:text-lg text-yellow-300">
              MATCH PAUSED · TACTICS & SUBS
            </h2>
            <p className="font-pixel-body text-lg text-slate-300 mt-1">
              WASD/Arrows Dribble · J Pass/Switch · E/L Loft Pass · K/Space Shoot/Tackle
            </p>
          </div>

          {hud && onChangeFormationTactic && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-2.5 border border-slate-700 bg-slate-900/80 space-y-1.5">
                <div className="font-pixel text-[9px] text-emerald-300">FORMATION ({formation})</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {FORMATIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onChangeFormationTactic(f.id, tactic)}
                      className={`px-2 py-1 font-pixel text-[8px] border ${
                        formation === f.id
                          ? 'border-yellow-400 bg-yellow-400 text-black'
                          : 'border-slate-700 bg-slate-950 text-slate-200'
                      }`}
                    >
                      {f.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 border border-slate-700 bg-slate-900/80 space-y-1.5">
                <div className="font-pixel text-[9px] text-sky-300">TACTIC</div>
                <div className="flex flex-wrap gap-1.5">
                  {TACTICS.map((tc) => (
                    <button
                      key={tc.id}
                      type="button"
                      onClick={() => onChangeFormationTactic(formation, tc.id)}
                      className={`px-2 py-1 font-pixel text-[7px] border ${
                        tactic === tc.id
                          ? 'border-sky-400 bg-sky-400 text-black'
                          : 'border-slate-700 bg-slate-950 text-slate-200'
                      }`}
                    >
                      {tc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hud && onSubstitutePlayer && starters.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-2.5 border border-emerald-500/60 bg-slate-950 space-y-1">
                <div className="font-pixel text-[9px] text-emerald-300">ON PITCH (CLICK SUB OFF)</div>
                {starters.map((pl, idx) => (
                  <div
                    key={pl.id}
                    className={`flex items-center justify-between gap-2 px-2 py-1 border text-sm font-pixel-body ${
                      selectedSubOutIdx === idx
                        ? 'border-yellow-400 bg-yellow-400/15'
                        : 'border-slate-800 bg-slate-900'
                    }`}
                  >
                    <span className="truncate text-white" dir="auto">
                      #{pl.number} {pl.name} ({pl.positionLabel})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSubOutIdx(selectedSubOutIdx === idx ? null : idx)}
                      className={`px-1.5 py-0.5 font-pixel text-[7px] shrink-0 ${
                        selectedSubOutIdx === idx ? 'bg-yellow-400 text-black' : 'bg-slate-700 text-white'
                      }`}
                    >
                      {selectedSubOutIdx === idx ? 'PICKED' : 'OUT'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-2.5 border border-sky-500/60 bg-slate-950 space-y-1">
                <div className="font-pixel text-[9px] text-sky-300">BENCH (SUB ON)</div>
                {bench.map((b, idx) => (
                  <div
                    key={`${b.slotIndex}-${b.number}`}
                    className="flex items-center justify-between gap-2 px-2 py-1 border border-slate-800 bg-slate-900 text-sm font-pixel-body"
                  >
                    <span className="truncate text-white" dir="auto">
                      #{b.number} {b.name} ({b.positionLabel})
                    </span>
                    <button
                      type="button"
                      disabled={selectedSubOutIdx === null}
                      onClick={() => {
                        if (selectedSubOutIdx === null) return;
                        onSubstitutePlayer(selectedSubOutIdx, idx);
                        setSelectedSubOutIdx(null);
                      }}
                      className="px-1.5 py-0.5 font-pixel text-[7px] shrink-0 bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-black"
                    >
                      IN
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="flex-1 pixel-btn bg-emerald-500 hover:bg-emerald-400 text-black font-pixel text-xs py-3"
            >
              RESUME MATCH
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="flex-1 pixel-btn bg-sky-500 hover:bg-sky-400 text-black font-pixel text-xs py-3"
            >
              RESTART MATCH
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="flex-1 pixel-btn bg-slate-700 hover:bg-slate-600 text-white font-pixel text-xs py-3"
            >
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const comp = COMPETITIONS.find((c) => c.id === result.competitionId) ?? COMPETITIONS[0];
  const homeWon =
    result.homeScore > result.awayScore ||
    (result.homeScore === result.awayScore && result.shootoutWinner === 'home');
  const awayWon =
    result.awayScore > result.homeScore ||
    (result.homeScore === result.awayScore && result.shootoutWinner === 'away');

  const headline = homeWon
    ? `${result.homeTeam.name} WINS!`
    : awayWon
    ? `${result.awayTeam.name} WINS!`
    : 'FULL TIME DRAW!';

  const totalPoss = Math.max(1, result.stats.homePossessionTicks + result.stats.awayPossessionTicks);
  const homePoss = Math.round((result.stats.homePossessionTicks / totalPoss) * 100);
  const awayPoss = 100 - homePoss;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full time match summary"
      className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-4"
    >
      <div className="pixel-panel w-full max-w-lg p-6 space-y-4">
        <div className="text-center">
          <div className="font-pixel text-[10px] text-slate-400">
            {result.isUltimateTeam
              ? `ULTIMATE TEAM · ${(result.utContext?.subMode ?? 'squad').toUpperCase()}`
              : result.isRivalry
              ? result.rivalryTitle ?? 'THE CLÁSICO'
              : result.isSingleplayerTour
              ? 'SINGLEPLAYER TOURNAMENT'
              : result.leagueRound && result.competitionId === 'league'
              ? `${comp.title} ${comp.season} · ROUND ${result.leagueRound}/38`
              : `${comp.title} ${comp.season}`}
          </div>
          {(result.dateLabel || result.timeLabel || result.stadiumName) && (
            <div className="font-pixel-body text-base text-sky-300 mt-0.5">
              {result.stadiumName ? `${result.stadiumName} · ` : ''}
              {result.dateLabel} · {result.timeLabel}
              {result.difficulty ? ` · ${result.difficulty.toUpperCase()}` : ''}
            </div>
          )}
          <h2 className="font-pixel text-base sm:text-lg text-yellow-300 mt-1" dir="auto">
            {headline}
          </h2>
          <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
            {result.extraTimePlayed && (
              <span className="inline-block px-2 py-0.5 bg-sky-400 text-black font-pixel text-[8px] border border-white">
                AFTER EXTRA TIME (120&apos;)
              </span>
            )}
            {result.wonTrophy && (
              <span className="inline-block px-3 py-1 bg-yellow-400 text-black font-pixel text-[10px] border-2 border-white">
                CHAMPIONS TROPHY LIFTED!
              </span>
            )}
          </div>
        </div>

        {/* Final Score Box */}
        <div className="bg-black border-2 border-slate-700 p-4 flex items-center justify-around font-pixel">
          <div className="flex flex-col items-center">
            <ClubBadge team={result.homeTeam} size={32} />
            <div className="text-xs text-white mt-1.5">{result.homeTeam.shortCode}</div>
            <div className="text-2xl text-emerald-400 mt-1 tabular-nums">{result.homeScore}</div>
          </div>
          <div className="text-xs text-slate-500">VS</div>
          <div className="flex flex-col items-center">
            <ClubBadge team={result.awayTeam} size={32} />
            <div className="text-xs text-white mt-1.5">{result.awayTeam.shortCode}</div>
            <div className="text-2xl text-rose-400 mt-1 tabular-nums">{result.awayScore}</div>
          </div>
        </div>

        {result.shootoutWinner && (
          <div className="text-center font-pixel text-[10px] text-yellow-300 tabular-nums">
            PENALTIES: {result.homeTeam.shortCode} {result.shootoutHomeGoals} - {result.shootoutAwayGoals} {result.awayTeam.shortCode}
          </div>
        )}

        {result.isUltimateTeam && result.utContext && (
          <div
            data-testid="ut-match-rewards-banner"
            className="p-3 border-2 border-amber-400 bg-amber-950/30 text-center space-y-1 tabular-nums"
          >
            <div className="font-pixel text-[9px] text-amber-300">
              ULTIMATE TEAM REWARDS
            </div>
            <div className="font-pixel text-xs text-yellow-200">
              +{result.utContext.coinsEarned ?? 0} COINS
              {result.utContext.pointsEarned ? ` · +${result.utContext.pointsEarned} RIVALS PTS` : ''}
            </div>
            {result.utContext.promotedToDivision !== null &&
              result.utContext.promotedToDivision !== undefined && (
                <div className="font-pixel text-[9px] text-emerald-300">
                  PROMOTED TO{' '}
                  {result.utContext.promotedToDivision === 0
                    ? 'ELITE DIVISION!'
                    : `DIVISION ${result.utContext.promotedToDivision}!`}
                </div>
              )}
            {result.utContext.packEarnedName && (
              <div className="font-pixel text-[8px] text-sky-300">
                PACK EARNED: {result.utContext.packEarnedName}!
              </div>
            )}
          </div>
        )}

        {/* Goal Scorers Log */}
        {result.goalLog.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-700 px-3 py-2 font-pixel-body text-base text-slate-200 max-h-24 overflow-y-auto tabular-nums">
            {result.goalLog.map((g, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {g.team === 'home' ? result.homeTeam.shortCode : result.awayTeam.shortCode} · {g.playerName}
                </span>
                <span className="text-yellow-300">{g.minute}&apos;</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabular Stats */}
        <div className="grid grid-cols-3 gap-y-1.5 text-center font-pixel-body text-lg border-t border-b border-slate-800 py-2.5 tabular-nums">
          <div className="text-emerald-300">{result.stats.homeShots}</div>
          <div className="text-slate-400">SHOTS</div>
          <div className="text-rose-300">{result.stats.awayShots}</div>

          <div className="text-emerald-300">{result.stats.homePasses}</div>
          <div className="text-slate-400">PASSES</div>
          <div className="text-rose-300">{result.stats.awayPasses}</div>

          <div className="text-emerald-300">{result.stats.homeTackles}</div>
          <div className="text-slate-400">TACKLES</div>
          <div className="text-rose-300">{result.stats.awayTackles}</div>

          <div className="text-emerald-300">{homePoss}%</div>
          <div className="text-slate-400">POSSESSION</div>
          <div className="text-rose-300">{awayPoss}%</div>

          <div className="text-emerald-300">
            {result.stats.homeFouls} ({result.stats.homeYellows}Y/{result.stats.homeReds}R)
          </div>
          <div className="text-slate-400">FOULS &amp; CARDS</div>
          <div className="text-rose-300">
            {result.stats.awayFouls} ({result.stats.awayYellows}Y/{result.stats.awayReds}R)
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="flex-1 pixel-btn bg-emerald-500 hover:bg-emerald-400 text-black font-pixel text-xs py-3"
          >
            PLAY NEXT MATCH
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="flex-1 pixel-btn bg-indigo-700 hover:bg-indigo-600 text-white font-pixel text-xs py-3"
          >
            TOURNAMENT HUB
          </button>
        </div>
      </div>
    </div>
  );
}
