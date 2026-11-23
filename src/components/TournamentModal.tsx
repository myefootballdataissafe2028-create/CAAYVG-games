import { useEffect, useState } from 'react';
import {
  ALL_TEAMS,
  CHANGELOG_ENTRIES,
  COMPETITIONS,
  DIFFICULTY_OPTIONS,
  EXPANSION_TEAMS,
  FORMATIONS,
  GAME_VERSION,
  LEAGUE_TEAMS,
  LIGHTING_PRESETS,
  MATCH_LENGTH_OPTIONS,
  RIVALRIES,
  STADIUMS,
  TACTICS,
  getTeamLineup,
} from '../game/data';
import {
  TOTAL_LEAGUE_ROUNDS,
  TOURNAMENT_FINAL_STADIUM_ID,
  getLeagueRoundDateTime,
  getPromotedTeamIds,
  getVisibleHubTabs,
  isLeagueGrandFinale38,
  isRoadToRound38,
  sortStandings,
} from '../game/rules';
import type {
  BenchSlotSpec,
  CompetitionId,
  CupBracketState,
  FormationId,
  GameDifficulty,
  GlobalClubRanking,
  LeagueRoundSchedule,
  LeagueStanding,
  LightingPresetId,
  PlayerCareerStats,
  SquadSlotSpec,
  TacticId,
  Team,
} from '../game/types';
import { ClubBadge } from './ClubBadge';
import type { CupJumpTarget } from './TitleScreen';

export type TournamentModalTab =
  | 'teams'
  | 'tactics'
  | 'fixtures'
  | 'standings'
  | 'bracket'
  | 'leaderboard'
  | 'stadiums'
  | 'changelog';

interface TournamentModalProps {
  isOpen: boolean;
  initialTab?: TournamentModalTab;
  onClose: () => void;
  selectedCompetition: CompetitionId;
  onSelectCompetition: (id: CompetitionId) => void;
  isSingleplayerTour: boolean;
  onToggleSingleplayerTour: (enabled: boolean) => void;
  difficulty: GameDifficulty;
  onChangeDifficulty: (difficulty: GameDifficulty) => void;
  matchHalfSeconds: number;
  onChangeMatchHalfSeconds: (seconds: number) => void;
  isFinalStage?: boolean;
  userTeamId: string;
  opponentTeamId: string;
  onSelectUserTeam: (id: string) => void;
  onSelectOpponentTeam: (id: string) => void;
  onSelectRivalryMatch: (teamAId: string, teamBId: string) => void;
  selectedStadiumId: string;
  onSelectStadium: (id: string) => void;
  selectedLightingId: LightingPresetId;
  onSelectLighting: (id: LightingPresetId) => void;
  selectedFormation: FormationId;
  selectedTactic: TacticId;
  homeLineup: SquadSlotSpec[];
  homeBench: BenchSlotSpec[];
  onChangeFormation: (formation: FormationId) => void;
  onChangeTactic: (tactic: TacticId) => void;
  onSubstitutePlayer: (outStarterIdx: number, inBenchIdx: number) => void;
  standings: LeagueStanding[];
  expansionStandings: LeagueStanding[];
  premierFixtures: LeagueRoundSchedule[];
  expansionFixtures: LeagueRoundSchedule[];
  currentLeagueRound: number;
  onSelectLeagueRound: (round: number) => void;
  onSimulateLeagueRound: (round: number) => void;
  onSimulateToLeagueRound: (targetRound: number) => void;
  onJumpCupRound: (compId: 'king_cup' | 'anime_cup', target: CupJumpTarget) => void;
  brackets: Record<'king_cup' | 'super_cup' | 'anime_cup' | 'singleplayer', CupBracketState>;
  globalRankings: GlobalClubRanking[];
  playerCareerStats: PlayerCareerStats[];
  onResetSeason: () => void;
  onStartMatch: () => void;
}

export function TournamentModal({
  isOpen,
  initialTab = 'teams',
  onClose,
  selectedCompetition,
  onSelectCompetition,
  isSingleplayerTour,
  onToggleSingleplayerTour,
  difficulty,
  onChangeDifficulty,
  matchHalfSeconds,
  onChangeMatchHalfSeconds,
  isFinalStage = false,
  userTeamId,
  opponentTeamId,
  onSelectUserTeam,
  onSelectOpponentTeam,
  onSelectRivalryMatch,
  selectedStadiumId,
  onSelectStadium,
  selectedLightingId,
  onSelectLighting,
  selectedFormation,
  selectedTactic,
  homeLineup,
  homeBench,
  onChangeFormation,
  onChangeTactic,
  onSubstitutePlayer,
  standings,
  expansionStandings,
  premierFixtures,
  expansionFixtures,
  currentLeagueRound,
  onSelectLeagueRound,
  onSimulateLeagueRound,
  onSimulateToLeagueRound,
  onJumpCupRound,
  brackets,
  globalRankings,
  playerCareerStats,
  onResetSeason,
  onStartMatch,
}: TournamentModalProps) {
  const visibleTabIds = getVisibleHubTabs(selectedCompetition, isSingleplayerTour);
  const clampTabForMode = (candidate: TournamentModalTab): TournamentModalTab => {
    if (visibleTabIds.includes(candidate)) return candidate;
    if ((candidate === 'fixtures' || candidate === 'standings') && visibleTabIds.includes('bracket')) {
      return 'bracket';
    }
    if (candidate === 'bracket' && visibleTabIds.includes('fixtures')) {
      return 'fixtures';
    }
    return 'teams';
  };

  const [tab, setTab] = useState<TournamentModalTab>(() => clampTabForMode(initialTab));
  const [clubFilter, setClubFilter] = useState<'all' | 'premier' | 'expansion'>('all');
  const [standingsDiv, setStandingsDiv] = useState<'premier' | 'expansion'>('premier');
  const [fixturesDiv, setFixturesDiv] = useState<'premier' | 'expansion'>(() => {
    const u = ALL_TEAMS.find((t) => t.id === userTeamId);
    return u?.division === 'expansion' ? 'expansion' : 'premier';
  });
  const [viewFixtureRound, setViewFixtureRound] = useState<number>(currentLeagueRound);
  const [statsMode, setStatsMode] = useState<'global_clubs' | 'scorers' | 'playmakers'>('global_clubs');
  const [inspectedClubId, setInspectedClubId] = useState<string>('brazil-fc');
  const [selectedSubOutIdx, setSelectedSubOutIdx] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(clampTabForMode(initialTab));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!visibleTabIds.includes(tab)) {
      setTab(clampTabForMode(tab));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompetition, isSingleplayerTour]);

  if (!isOpen) return null;

  const teamMap = new Map<string, Team>(ALL_TEAMS.map((t) => [t.id, t]));
  const visibleClubs =
    clubFilter === 'premier'
      ? LEAGUE_TEAMS
      : clubFilter === 'expansion'
      ? EXPANSION_TEAMS
      : ALL_TEAMS;

  const activeStandings = sortStandings(
    standingsDiv === 'premier' ? standings : expansionStandings
  );

  const activeBracket = isSingleplayerTour
    ? brackets.singleplayer
    : selectedCompetition === 'league'
    ? brackets.king_cup
    : brackets[selectedCompetition];

  const roundsMap = new Map<number, typeof activeBracket.matches>();
  for (const m of activeBracket.matches) {
    const arr = roundsMap.get(m.roundIndex) ?? [];
    arr.push(m);
    roundsMap.set(m.roundIndex, arr);
  }
  const rounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);

  const topScorers = [...playerCareerStats]
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || b.shots - a.shots)
    .slice(0, 25);

  const topPlaymakers = [...playerCareerStats]
    .sort((a, b) => b.assists - a.assists || b.passes - a.passes || b.goals - a.goals)
    .slice(0, 25);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="CAAYVG 26/27 Clubs, Tournaments, Leaderboards and Stadiums"
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-5"
    >
      <div className="pixel-panel w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0f172a] border-b-2 border-yellow-400">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-pixel text-xs sm:text-sm text-yellow-300">
                CAAYVG 26/27 GLOBAL HUB · 42 CLUBS
              </h2>
              <span
                data-testid="hub-version-badge"
                className="font-pixel text-[8px] bg-indigo-950 border border-indigo-400 text-indigo-200 px-1.5 py-0.5"
              >
                {GAME_VERSION}
              </span>
            </div>
            <p className="font-pixel-body text-base text-slate-300">
              21 League Clubs + 21 Expansion Clubs · Singleplayer Tournament · Global Leaderboards · {STADIUMS.length} Stadiums
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetSeason}
              className="pixel-btn bg-rose-700 hover:bg-rose-600 text-white font-pixel text-[10px] px-3 py-2"
            >
              RESET SEASON
            </button>
            <button
              type="button"
              onClick={onClose}
              className="pixel-btn bg-slate-700 hover:bg-slate-600 text-white font-pixel text-[10px] px-3 py-2"
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-[#090d1f] border-b border-slate-800">
          {COMPETITIONS.map((c) => {
            const active = !isSingleplayerTour && selectedCompetition === c.id;
            return (
              <button
                key={c.id}
                type="button"
                data-testid={`hub-mode-${c.id}`}
                onClick={() => {
                  onToggleSingleplayerTour(false);
                  onSelectCompetition(c.id);
                }}
                className={`px-2.5 py-1.5 font-pixel text-[9px] border-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-yellow-400 bg-yellow-400 text-black'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                }`}
              >
                {c.title}
              </button>
            );
          })}
          <button
            type="button"
            data-testid="hub-mode-singleplayer"
            onClick={() => {
              onToggleSingleplayerTour(true);
              setTab('bracket');
            }}
            className={`px-2.5 py-1.5 font-pixel text-[9px] border-2 transition-colors whitespace-nowrap ${
              isSingleplayerTour
                ? 'border-emerald-400 bg-emerald-400 text-black'
                : 'border-emerald-800 bg-emerald-950/50 text-emerald-300 hover:border-emerald-500'
            }`}
          >
            SINGLEPLAYER TOURNAMENT (16)
          </button>
        </div>

        {/* Hub Match Settings Bar (Difficulty & Half Length) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#0b1024] border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Hub game difficulty">
            <span className="font-pixel text-[8px] text-amber-300 mr-1">DIFFICULTY:</span>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-testid={`hub-difficulty-${opt.id}`}
                onClick={() => onChangeDifficulty(opt.id)}
                className={`px-2 py-1 font-pixel text-[8px] border transition-colors ${
                  difficulty === opt.id
                    ? 'border-amber-300 bg-amber-400 text-black'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Hub match length">
            <span className="font-pixel text-[8px] text-emerald-300 mr-1">MATCH HALF LENGTH:</span>
            {MATCH_LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt.halfSeconds}
                type="button"
                data-testid={`hub-length-${opt.halfSeconds}`}
                onClick={() => onChangeMatchHalfSeconds(opt.halfSeconds)}
                title={opt.label}
                className={`px-2 py-1 font-pixel text-[8px] border transition-colors tabular-nums ${
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

        {/* Primary Hub Tabs (filtered by League vs Tournament mode) */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-[#070a17] border-b border-slate-800">
          {(
            [
              { id: 'teams', label: `CLUBS (${ALL_TEAMS.length})` },
              { id: 'tactics', label: `LINE-UP & SUBS (${selectedFormation})` },
              { id: 'fixtures', label: `FIXTURES (R${currentLeagueRound}/38)` },
              { id: 'standings', label: 'LEAGUE TABLES (21+21)' },
              { id: 'bracket', label: isSingleplayerTour ? 'SP TOURNAMENT' : 'CUPS & GROUPS' },
              { id: 'leaderboard', label: 'GLOBAL LEADERBOARDS' },
              { id: 'stadiums', label: `STADIUMS (${STADIUMS.length}) & RIVALRIES` },
              { id: 'changelog', label: 'CHANGELOG' },
            ] as const
          )
            .filter((item) => visibleTabIds.includes(item.id))
            .map((item) => (
              <button
                key={item.id}
                type="button"
                data-testid={`hub-tab-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`px-3 py-1.5 font-pixel text-[9px] sm:text-[10px] whitespace-nowrap ${
                  tab === item.id
                    ? 'bg-emerald-500 text-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'teams' && (() => {
            const inspectedTeam = teamMap.get(inspectedClubId) ?? ALL_TEAMS[0];
            const lineup = getTeamLineup(inspectedTeam);
            return (
            <div className="space-y-4">
              {/* Featured Club Lineup Panel */}
              <div className="p-3 border-2 border-yellow-400 bg-[#080d22]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <ClubBadge team={inspectedTeam} size={28} />
                    <div>
                      <div className="font-pixel text-[10px] text-yellow-300" dir="auto">
                        {inspectedTeam.name} LINE-UP
                      </div>
                      <div className="font-pixel-body text-sm text-slate-400">
                        Click SQUAD on any of the 42 clubs below to inspect its roster
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['brazil-fc', 'glitter-force', 'gamer-rage-fc', 'teen-titans-go', 'barcewiiparty', 'real-poofesurerid'].map((cid) => {
                      const ct = teamMap.get(cid);
                      if (!ct) return null;
                      return (
                        <button
                          key={cid}
                          type="button"
                          onClick={() => setInspectedClubId(cid)}
                          className={`px-2 py-1 font-pixel text-[8px] border ${
                            inspectedClubId === cid
                              ? 'border-yellow-400 bg-yellow-400 text-black'
                              : 'border-slate-700 bg-slate-900 text-slate-300'
                          }`}
                        >
                          {ct.shortCode}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {lineup.map((pl) => (
                    <div
                      key={pl.slotIndex}
                      className="p-2 border border-slate-700 bg-slate-900/90 text-center"
                    >
                      <div className="font-pixel text-[9px] text-yellow-300">
                        #{pl.number} · {pl.positionLabel}
                      </div>
                      <div className="font-pixel-body text-base text-white truncate mt-0.5" dir="auto">
                        {pl.name}
                      </div>
                      {pl.isCaptain && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-yellow-400 text-black font-pixel text-[7px]">
                          CAPTAIN
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-pixel-body text-lg text-slate-300">
                  Pick from all 42 clubs (21 CAAYVG Premier + 21 Expansion Clubs):
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setClubFilter('all')}
                    className={`px-2.5 py-1 font-pixel text-[9px] ${
                      clubFilter === 'all' ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    ALL 42
                  </button>
                  <button
                    type="button"
                    onClick={() => setClubFilter('premier')}
                    className={`px-2.5 py-1 font-pixel text-[9px] ${
                      clubFilter === 'premier' ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    PREMIER 21
                  </button>
                  <button
                    type="button"
                    onClick={() => setClubFilter('expansion')}
                    className={`px-2.5 py-1 font-pixel text-[9px] ${
                      clubFilter === 'expansion' ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    NEW 21 CLUBS
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {visibleClubs.map((team, idx) => {
                  const isUser = team.id === userTeamId;
                  const isOpp = team.id === opponentTeamId;
                  return (
                    <div
                      key={team.id}
                      className={`p-2.5 border-2 flex items-center justify-between gap-2 ${
                        isUser
                          ? 'border-emerald-400 bg-emerald-950/40'
                          : isOpp
                          ? 'border-rose-400 bg-rose-950/30'
                          : 'border-slate-700 bg-slate-900/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-pixel text-[9px] text-slate-400 tabular-nums w-6">
                          {idx + 1}.
                        </span>
                        <ClubBadge team={team} size={26} />
                        <div className="min-w-0">
                          <div className="font-pixel text-[10px] text-white truncate" dir="auto">
                            {team.name}
                          </div>
                          <div className="font-pixel-body text-base text-slate-400 tabular-nums">
                            {team.shortCode} · ATK {team.attack} · DEF {team.defense}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectUserTeam(team.id)}
                            className={`px-2 py-1 font-pixel text-[8px] ${
                              isUser ? 'bg-emerald-400 text-black' : 'bg-slate-700 text-white hover:bg-slate-600'
                            }`}
                          >
                            {isUser ? 'YOU' : 'PICK'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectOpponentTeam(team.id)}
                            disabled={isUser}
                            className={`px-2 py-1 font-pixel text-[8px] ${
                              isOpp
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40'
                            }`}
                          >
                            {isOpp ? 'CPU' : 'VS'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInspectedClubId(team.id)}
                          className={`px-2 py-0.5 font-pixel text-[7px] ${
                            inspectedClubId === team.id
                              ? 'bg-yellow-400 text-black'
                              : 'bg-slate-800 text-yellow-300 hover:bg-slate-700'
                          }`}
                        >
                          SQUAD
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })()}

          {tab === 'tactics' && (() => {
            const userClub = teamMap.get(userTeamId) ?? ALL_TEAMS[0];
            return (
              <div className="space-y-4">
                <div className="p-3 border-2 border-yellow-400 bg-[#080d22] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <ClubBadge team={userClub} size={30} />
                    <div>
                      <div className="font-pixel text-[10px] sm:text-xs text-yellow-300" dir="auto">
                        {userClub.name} · FORMATIONS, TACTICS & SUBSTITUTIONS
                      </div>
                      <div className="font-pixel-body text-base text-slate-300">
                        Switch formation, game plan, and swap any of your 11 starters with your 7 substitutes
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formation & Tactic Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border-2 border-slate-700 bg-slate-900/70 space-y-2">
                    <div className="font-pixel text-[10px] text-emerald-300">FORMATION</div>
                    <div className="grid grid-cols-2 gap-2">
                      {FORMATIONS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          data-testid={`formation-${f.id}`}
                          onClick={() => onChangeFormation(f.id)}
                          className={`p-2 border-2 text-left transition-colors ${
                            selectedFormation === f.id
                              ? 'border-yellow-400 bg-yellow-400 text-black'
                              : 'border-slate-700 bg-slate-950 text-white hover:border-slate-500'
                          }`}
                        >
                          <div className="font-pixel text-[9px]">{f.label}</div>
                          <div className="font-pixel-body text-sm opacity-80">{f.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 border-2 border-slate-700 bg-slate-900/70 space-y-2">
                    <div className="font-pixel text-[10px] text-sky-300">TEAM TACTIC</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TACTICS.map((tc) => (
                        <button
                          key={tc.id}
                          type="button"
                          data-testid={`tactic-${tc.id}`}
                          onClick={() => onChangeTactic(tc.id)}
                          className={`p-2 border-2 text-left transition-colors ${
                            selectedTactic === tc.id
                              ? 'border-sky-400 bg-sky-400 text-black'
                              : 'border-slate-700 bg-slate-950 text-white hover:border-slate-500'
                          }`}
                        >
                          <div className="font-pixel text-[8px]">{tc.label}</div>
                          <div className="font-pixel-body text-sm opacity-80 leading-tight mt-0.5">
                            {tc.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Starting 7 + Bench 5 Interactive Swap */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-3 border-2 border-emerald-500/70 bg-slate-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-[10px] text-emerald-300">
                        STARTING XI ({selectedFormation})
                      </span>
                      <span className="font-pixel-body text-sm text-slate-400">
                        Click SUB OFF on a starter first
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {homeLineup.map((pl, idx) => {
                        const isPicked = selectedSubOutIdx === idx;
                        return (
                          <div
                            key={`${pl.slotIndex}-${pl.number}`}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 border ${
                              isPicked
                                ? 'border-yellow-400 bg-yellow-400/15'
                                : 'border-slate-800 bg-slate-900/90'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-pixel text-[9px] text-yellow-300 w-7">
                                #{pl.number}
                              </span>
                              <span className="font-pixel text-[8px] bg-slate-800 text-sky-300 px-1.5 py-0.5">
                                {pl.positionLabel}
                              </span>
                              <span className="font-pixel-body text-lg text-white truncate" dir="auto">
                                {pl.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              data-testid={`sub-out-${idx}`}
                              onClick={() => setSelectedSubOutIdx(isPicked ? null : idx)}
                              className={`px-2 py-1 font-pixel text-[8px] shrink-0 ${
                                isPicked
                                  ? 'bg-yellow-400 text-black'
                                  : 'bg-slate-700 hover:bg-slate-600 text-white'
                              }`}
                            >
                              {isPicked ? 'SELECTED' : 'SUB OFF'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 border-2 border-sky-500/70 bg-slate-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-[10px] text-sky-300">
                        SUBSTITUTES BENCH (7)
                      </span>
                      <span className="font-pixel-body text-sm text-slate-400">
                        {selectedSubOutIdx !== null
                          ? `Swapping for #${homeLineup[selectedSubOutIdx]?.number ?? ''} ${homeLineup[selectedSubOutIdx]?.name ?? ''}`
                          : 'Pick starter to enable SUB ON'}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {homeBench.map((b, idx) => (
                        <div
                          key={`${b.slotIndex}-${b.number}`}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 border border-slate-800 bg-slate-900/90"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-pixel text-[9px] text-sky-300 w-7">
                              #{b.number}
                            </span>
                            <span className="font-pixel text-[8px] bg-slate-800 text-emerald-300 px-1.5 py-0.5">
                              {b.positionLabel}
                            </span>
                            <span className="font-pixel-body text-lg text-white truncate" dir="auto">
                              {b.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={selectedSubOutIdx === null}
                            data-testid={`sub-in-${idx}`}
                            onClick={() => {
                              if (selectedSubOutIdx === null) return;
                              onSubstitutePlayer(selectedSubOutIdx, idx);
                              setSelectedSubOutIdx(null);
                            }}
                            className="px-2 py-1 font-pixel text-[8px] shrink-0 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-black"
                          >
                            SUB ON
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {tab === 'fixtures' && (() => {
            const activeSchedule = fixturesDiv === 'premier' ? premierFixtures : expansionFixtures;
            const roundObj = activeSchedule.find((r) => r.round === viewFixtureRound) ?? activeSchedule[0];
            const isRoad38 = isRoadToRound38('league', viewFixtureRound, false);
            const isFinale = isLeagueGrandFinale38('league', viewFixtureRound, false);
            const roundDt = roundObj?.dateLabel
              ? { dateLabel: roundObj.dateLabel, timeLabel: roundObj.timeLabel ?? '20:00' }
              : getLeagueRoundDateTime(viewFixtureRound);

            return (
              <div className="space-y-4">
                {/* Round Control Header & Road to Round 38 / Grand Finale 38 Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-2 border-slate-700 bg-[#080d22]">
                  <div>
                    <div className="font-pixel text-xs text-yellow-300">
                      CAAYVG LEAGUE 26/27 · ROUND {viewFixtureRound} OF {TOTAL_LEAGUE_ROUNDS}
                    </div>
                    <div className="font-pixel-body text-base text-slate-300">
                      Schedule: <span className="text-sky-300">{roundDt.dateLabel} · {roundDt.timeLabel}</span> · Active Round:{' '}
                      <span className="text-emerald-300">Round {currentLeagueRound} / {TOTAL_LEAGUE_ROUNDS}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFixturesDiv('premier')}
                      className={`px-2.5 py-1.5 font-pixel text-[9px] ${
                        fixturesDiv === 'premier' ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      PREMIER (21)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFixturesDiv('expansion')}
                      className={`px-2.5 py-1.5 font-pixel text-[9px] ${
                        fixturesDiv === 'expansion' ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      EXPANSION (21)
                    </button>
                    <button
                      type="button"
                      data-testid="sim-to-r30-btn"
                      onClick={() => {
                        onSimulateToLeagueRound(30);
                        setViewFixtureRound(30);
                      }}
                      className="pixel-btn bg-gradient-to-r from-rose-500 via-yellow-400 to-sky-400 text-black font-pixel text-[9px] px-2.5 py-1.5"
                    >
                      SIM TO R30 (ROAD TO 38)
                    </button>
                    <button
                      type="button"
                      data-testid="sim-to-r38-btn"
                      onClick={() => {
                        onSimulateToLeagueRound(38);
                        setViewFixtureRound(38);
                      }}
                      className="pixel-btn bg-amber-400 text-black font-pixel text-[9px] px-2.5 py-1.5"
                    >
                      SIM TO R38 FINALE
                    </button>
                  </div>
                </div>

                {(isRoad38 || isFinale) && (
                  <div
                    data-testid="road-to-38-banner"
                    className={`p-3 border-2 ${
                      isFinale ? 'border-pink-400 bg-[#0d0420]' : 'border-yellow-300 bg-[#050618]'
                    } flex flex-wrap items-center justify-between gap-2`}
                  >
                    <div>
                      <div className="font-pixel text-[10px] sm:text-xs bg-gradient-to-r from-red-400 via-yellow-300 via-emerald-300 to-purple-400 bg-clip-text text-transparent">
                        {isFinale
                          ? 'THE GRAND FINALE 38! · ROUND 38 OF 38 · BRAZIL FC VS GLITTER FORCE!'
                          : 'ROAD TO THE ROUND 38! · ROUNDS 30-37 OF 38 SPECIAL!'}
                      </div>
                      <div className="font-pixel-body text-base text-slate-200">
                        {isFinale
                          ? 'Flickering Every-Color Tunnel · Championship Title Trophy Decider!'
                          : 'Space + Rainbow Sunburnt Tunnel LEDs · Glowing Yellow CAAYVG League Logo active!'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectLeagueRound(viewFixtureRound);
                        onClose();
                        onStartMatch();
                      }}
                      className="pixel-btn bg-emerald-500 hover:bg-emerald-400 text-black font-pixel text-[10px] px-3 py-2"
                    >
                      PLAY ROUND {viewFixtureRound}
                    </button>
                  </div>
                )}

                {/* 38-Round Grid Selector */}
                <div className="grid grid-cols-10 sm:grid-cols-19 gap-1">
                  {Array.from({ length: TOTAL_LEAGUE_ROUNDS }, (_, idx) => {
                    const r = idx + 1;
                    const isCurrent = r === currentLeagueRound;
                    const isViewing = r === viewFixtureRound;
                    const isFinalStretch = r >= 30;
                    return (
                      <button
                        key={r}
                        type="button"
                        data-testid={`fixture-round-${r}`}
                        onClick={() => setViewFixtureRound(r)}
                        className={`py-1 font-pixel text-[8px] border transition-colors tabular-nums ${
                          isViewing
                            ? 'bg-yellow-400 text-black border-white'
                            : isCurrent
                            ? 'bg-emerald-600 text-black border-emerald-300'
                            : isFinalStretch
                            ? 'bg-indigo-950 text-pink-300 border-pink-500/70 hover:border-yellow-300'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>

                {/* Round Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewFixtureRound((r) => Math.max(1, r - 1))}
                      className="pixel-btn bg-slate-800 text-white font-pixel text-[9px] px-2.5 py-1.5"
                    >
                      PREV ROUND
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewFixtureRound((r) => Math.min(TOTAL_LEAGUE_ROUNDS, r + 1))}
                      className="pixel-btn bg-slate-800 text-white font-pixel text-[9px] px-2.5 py-1.5"
                    >
                      NEXT ROUND
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSimulateLeagueRound(viewFixtureRound)}
                      className="pixel-btn bg-sky-500 hover:bg-sky-400 text-black font-pixel text-[9px] px-3 py-1.5"
                    >
                      SIMULATE ROUND {viewFixtureRound}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectLeagueRound(viewFixtureRound);
                        onClose();
                        onStartMatch();
                      }}
                      className="pixel-btn bg-emerald-500 hover:bg-emerald-400 text-black font-pixel text-[9px] px-3 py-1.5"
                    >
                      PLAY ROUND {viewFixtureRound} NOW
                    </button>
                  </div>
                </div>

                {/* Matchday List with Dates & Times */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {roundObj?.matches.map((fix) => {
                    const hTeam = teamMap.get(fix.homeTeamId);
                    const aTeam = teamMap.get(fix.awayTeamId);
                    if (!hTeam || !aTeam) return null;
                    const involvesUser = fix.homeTeamId === userTeamId || fix.awayTeamId === userTeamId;
                    const dt = fix.dateLabel ?? roundDt.dateLabel;
                    const tm = fix.timeLabel ?? roundDt.timeLabel;
                    return (
                      <div
                        key={fix.id}
                        className={`p-2.5 border-2 flex flex-col gap-1 tabular-nums ${
                          involvesUser
                            ? 'border-yellow-400 bg-emerald-950/40'
                            : 'border-slate-700 bg-slate-900/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <ClubBadge team={hTeam} size={20} />
                            <span className="font-pixel text-[9px] text-white truncate" dir="auto">
                              {hTeam.shortCode} {hTeam.name}
                            </span>
                          </div>
                          <div className="px-2 py-1 bg-black border border-slate-700 font-pixel text-[10px] text-yellow-300 shrink-0">
                            {fix.played ? `${fix.homeScore} - ${fix.awayScore}` : 'VS'}
                          </div>
                          <div className="flex items-center justify-end gap-1.5 min-w-0 flex-1">
                            <span className="font-pixel text-[9px] text-white truncate text-right" dir="auto">
                              {aTeam.name} {aTeam.shortCode}
                            </span>
                            <ClubBadge team={aTeam} size={20} />
                          </div>
                        </div>
                        <div className="text-center font-pixel-body text-sm text-sky-300/90">
                          {dt} · {tm}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {tab === 'standings' && (() => {
            const promotedSet = new Set(
              standingsDiv === 'expansion' ? getPromotedTeamIds(expansionStandings) : []
            );
            return (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStandingsDiv('premier')}
                    className={`px-3 py-1.5 font-pixel text-[9px] ${
                      standingsDiv === 'premier' ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    CAAYVG PREMIER (21)
                  </button>
                  <button
                    type="button"
                    data-testid="standings-expansion-btn"
                    onClick={() => setStandingsDiv('expansion')}
                    className={`px-3 py-1.5 font-pixel text-[9px] ${
                      standingsDiv === 'expansion' ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    EXPANSION DIVISION (21)
                  </button>
                </div>
                {standingsDiv === 'expansion' && (
                  <span className="font-pixel text-[8px] sm:text-[9px] bg-emerald-500/20 border border-emerald-400 text-emerald-300 px-2 py-1">
                    TOP 4 GAIN PROMOTION TO CAAYVG PREMIER!
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-pixel-body text-lg tabular-nums">
                  <thead>
                    <tr className="border-b-2 border-yellow-400 text-yellow-300 font-pixel text-[10px]">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">CLUB</th>
                      <th className="py-2 px-2 text-right">P</th>
                      <th className="py-2 px-2 text-right">W</th>
                      <th className="py-2 px-2 text-right">D</th>
                      <th className="py-2 px-2 text-right">L</th>
                      <th className="py-2 px-2 text-right">GF</th>
                      <th className="py-2 px-2 text-right">GA</th>
                      <th className="py-2 px-2 text-right">GD</th>
                      <th className="py-2 px-2 text-right">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeStandings.map((row, idx) => {
                      const team = teamMap.get(row.teamId);
                      if (!team) return null;
                      const gd = row.goalsFor - row.goalsAgainst;
                      const isUser = row.teamId === userTeamId;
                      const isPromoted = standingsDiv === 'expansion' && promotedSet.has(row.teamId);
                      return (
                        <tr
                          key={row.teamId}
                          className={`border-b border-slate-800 ${
                            isPromoted
                              ? 'bg-emerald-950/65 text-emerald-200 border-l-4 border-l-emerald-400'
                              : isUser
                              ? 'bg-sky-950/60 text-sky-200'
                              : 'text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <td className="py-1.5 px-2">{idx + 1}</td>
                          <td className="py-1.5 px-2 flex items-center gap-2 flex-wrap">
                            <ClubBadge team={team} size={18} />
                            <span className="truncate" dir="auto">{team.name}</span>
                            {isUser && <span className="font-pixel text-[8px] text-yellow-300">(YOU)</span>}
                            {isPromoted && (
                              <span className="font-pixel text-[7px] bg-emerald-400 text-black px-1.5 py-0.5">
                                PROMOTED TO PREMIER
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-right">{row.played}</td>
                          <td className="py-1.5 px-2 text-right">{row.won}</td>
                          <td className="py-1.5 px-2 text-right">{row.drawn}</td>
                          <td className="py-1.5 px-2 text-right">{row.lost}</td>
                          <td className="py-1.5 px-2 text-right">{row.goalsFor}</td>
                          <td className="py-1.5 px-2 text-right">{row.goalsAgainst}</td>
                          <td className="py-1.5 px-2 text-right">{gd >= 0 ? `+${gd}` : gd}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-yellow-300">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            );
          })()}

          {tab === 'bracket' && (
            <div className="space-y-4">
              {/* Quick Cup Stage Jump inside Bracket Hub */}
              {!isSingleplayerTour &&
                (selectedCompetition === 'king_cup' || selectedCompetition === 'anime_cup') && (
                  <div className="p-2.5 border-2 border-slate-700 bg-[#080d22] flex flex-wrap items-center gap-2">
                    <span className="font-pixel text-[9px] text-yellow-300">
                      JUMP TO STAGE:
                    </span>
                    {(selectedCompetition === 'king_cup'
                      ? (['GROUP', 'R16', 'QF', 'SF', 'FINAL'] as const)
                      : (['GROUP', 'QF', 'SF', 'FINAL'] as const)
                    ).map((stg) => (
                      <button
                        key={stg}
                        type="button"
                        onClick={() => onJumpCupRound(selectedCompetition, stg)}
                        className="pixel-btn bg-slate-800 hover:bg-yellow-400 hover:text-black text-white font-pixel text-[8px] px-2.5 py-1"
                      >
                        {stg === 'GROUP'
                          ? 'GROUP STAGES'
                          : stg === 'R16'
                          ? 'ROUND OF 16'
                          : stg === 'QF'
                          ? 'QUARTERFINAL'
                          : stg === 'SF'
                          ? 'SEMIFINAL'
                          : 'FINAL'}
                      </button>
                    ))}
                  </div>
                )}

              {activeBracket.championId && (
                <div className="p-3 bg-yellow-400/15 border-2 border-yellow-400 text-yellow-300 font-pixel text-xs">
                  CHAMPION: {teamMap.get(activeBracket.championId)?.name}
                </div>
              )}

              {/* Group Stages Tables & Matches */}
              {activeBracket.groups && activeBracket.groups.length > 0 && (
                <div className="space-y-3">
                  <div className="font-pixel text-[10px] text-emerald-300 border-b border-slate-700 pb-1">
                    GROUP STAGES (TOP 2 PER GROUP ADVANCE TO KNOCKOUT)
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {activeBracket.groups.map((grp) => (
                      <div key={grp.groupName} className="border-2 border-slate-700 bg-slate-900/80 p-3 space-y-2">
                        <div className="font-pixel text-[10px] text-yellow-300">{grp.groupName}</div>
                        <table className="w-full text-left font-pixel-body text-base tabular-nums">
                          <thead>
                            <tr className="border-b border-slate-700 text-slate-400 font-pixel text-[8px]">
                              <th className="py-1">CLUB</th>
                              <th className="py-1 text-right">P</th>
                              <th className="py-1 text-right">GD</th>
                              <th className="py-1 text-right">PTS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grp.standings.map((r, ri) => {
                              const t = teamMap.get(r.teamId);
                              if (!t) return null;
                              const isQual = ri < 2;
                              return (
                                <tr
                                  key={r.teamId}
                                  className={`border-b border-slate-800/70 ${
                                    isQual ? 'text-emerald-300' : 'text-slate-300'
                                  }`}
                                >
                                  <td className="py-1 flex items-center gap-1.5">
                                    <ClubBadge team={t} size={14} />
                                    <span className="truncate" dir="auto">{t.name}</span>
                                    {t.id === userTeamId && (
                                      <span className="font-pixel text-[7px] text-yellow-300">(YOU)</span>
                                    )}
                                  </td>
                                  <td className="py-1 text-right">{r.played}</td>
                                  <td className="py-1 text-right">{r.goalsFor - r.goalsAgainst}</td>
                                  <td className="py-1 text-right font-bold text-yellow-300">{r.points}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {grp.matches.map((gm) => {
                            const ht = gm.homeTeamId ? teamMap.get(gm.homeTeamId) : null;
                            const at = gm.awayTeamId ? teamMap.get(gm.awayTeamId) : null;
                            return (
                              <div
                                key={gm.id}
                                className="bg-black/70 border border-slate-800 px-2 py-1 font-pixel-body text-sm flex items-center justify-between gap-1 tabular-nums"
                              >
                                <span className="truncate">{ht?.shortCode} vs {at?.shortCode}</span>
                                <span className="text-yellow-300 shrink-0">
                                  {gm.played ? `${gm.homeScore}-${gm.awayScore}` : gm.dateLabel ?? 'TBD'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Knockout Bracket */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {rounds.map(([roundIdx, nodes]) => (
                  <div key={roundIdx} className="space-y-2.5">
                    <h3 className="font-pixel text-[10px] text-yellow-300 border-b border-slate-700 pb-1">
                      {nodes[0]?.roundName}
                    </h3>
                    {nodes.map((node) => {
                      const hTeam = node.homeTeamId ? teamMap.get(node.homeTeamId) : null;
                      const aTeam = node.awayTeamId ? teamMap.get(node.awayTeamId) : null;
                      return (
                        <div
                          key={node.id}
                          className="border-2 border-slate-700 bg-slate-900/90 p-2 font-pixel-body text-base tabular-nums"
                        >
                          {node.dateLabel && (
                            <div className="font-pixel-body text-xs text-sky-300 mb-1">
                              {node.dateLabel} · {node.timeLabel ?? '20:30'}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className={node.winnerId === node.homeTeamId ? 'text-yellow-300' : 'text-slate-200'} dir="auto">
                              {hTeam ? `${hTeam.shortCode} ${hTeam.name}` : 'TBD'}
                            </span>
                            <span className="text-yellow-300">{node.homeScore ?? '-'}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-800 mt-1 pt-1">
                            <span className={node.winnerId === node.awayTeamId ? 'text-yellow-300' : 'text-slate-200'} dir="auto">
                              {aTeam ? `${aTeam.shortCode} ${aTeam.name}` : 'TBD'}
                            </span>
                            <span className="text-yellow-300">{node.awayScore ?? '-'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatsMode('global_clubs')}
                  className={`px-3 py-1.5 font-pixel text-[9px] ${
                    statsMode === 'global_clubs' ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  GLOBAL CLUB RANKING (42)
                </button>
                <button
                  type="button"
                  onClick={() => setStatsMode('scorers')}
                  className={`px-3 py-1.5 font-pixel text-[9px] ${
                    statsMode === 'scorers' ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  GOLDEN BOOT · PLAYER STATS
                </button>
                <button
                  type="button"
                  onClick={() => setStatsMode('playmakers')}
                  className={`px-3 py-1.5 font-pixel text-[9px] ${
                    statsMode === 'playmakers' ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  ASSISTS & PASSING LEADERS
                </button>
              </div>

              {statsMode === 'global_clubs' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-pixel-body text-lg tabular-nums">
                    <thead>
                      <tr className="border-b-2 border-yellow-400 text-yellow-300 font-pixel text-[10px]">
                        <th className="py-2 px-2">RANK</th>
                        <th className="py-2 px-2">CLUB</th>
                        <th className="py-2 px-2 text-right">ELO RATING</th>
                        <th className="py-2 px-2 text-right">WINS</th>
                        <th className="py-2 px-2 text-right">GOALS</th>
                        <th className="py-2 px-2 text-right">TROPHIES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalRankings.map((row, idx) => {
                        const team = teamMap.get(row.teamId);
                        if (!team) return null;
                        return (
                          <tr key={row.teamId} className="border-b border-slate-800 text-slate-200 hover:bg-slate-900">
                            <td className="py-1.5 px-2 text-yellow-300">#{idx + 1}</td>
                            <td className="py-1.5 px-2 flex items-center gap-2">
                              <ClubBadge team={team} size={18} />
                              <span dir="auto">{team.name}</span>
                              <span className="text-slate-400 text-sm">({team.shortCode})</span>
                            </td>
                            <td className="py-1.5 px-2 text-right text-emerald-300 font-bold">{row.elo}</td>
                            <td className="py-1.5 px-2 text-right">{row.wins}</td>
                            <td className="py-1.5 px-2 text-right">{row.goalsFor}</td>
                            <td className="py-1.5 px-2 text-right text-yellow-300">{row.trophies}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-pixel-body text-lg tabular-nums">
                    <thead>
                      <tr className="border-b-2 border-yellow-400 text-yellow-300 font-pixel text-[10px]">
                        <th className="py-2 px-2">#</th>
                        <th className="py-2 px-2">PLAYER</th>
                        <th className="py-2 px-2">CLUB</th>
                        <th className="py-2 px-2 text-right">G</th>
                        <th className="py-2 px-2 text-right">A</th>
                        <th className="py-2 px-2 text-right">SHOTS</th>
                        <th className="py-2 px-2 text-right">PASSES</th>
                        <th className="py-2 px-2 text-right">TACKLES</th>
                        <th className="py-2 px-2 text-right">YC/RC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(statsMode === 'scorers' ? topScorers : topPlaymakers).map((pl, idx) => {
                        const team = teamMap.get(pl.teamId);
                        return (
                          <tr key={pl.playerId} className="border-b border-slate-800 text-slate-200 hover:bg-slate-900">
                            <td className="py-1.5 px-2 text-yellow-300">{idx + 1}</td>
                            <td className="py-1.5 px-2" dir="auto">
                              <span className="text-yellow-300 mr-1">#{pl.number}</span>
                              {pl.playerName}{' '}
                              <span className="text-slate-400 text-sm">({pl.positionLabel ?? pl.role})</span>
                              {pl.isCaptain && <span className="ml-1 text-yellow-400 font-pixel text-[8px]">(C)</span>}
                            </td>
                            <td className="py-1.5 px-2 text-slate-300">{team?.shortCode}</td>
                            <td className="py-1.5 px-2 text-right text-emerald-300 font-bold">{pl.goals}</td>
                            <td className="py-1.5 px-2 text-right text-sky-300">{pl.assists}</td>
                            <td className="py-1.5 px-2 text-right">{pl.shots}</td>
                            <td className="py-1.5 px-2 text-right">{pl.passes}</td>
                            <td className="py-1.5 px-2 text-right">{pl.tackles}</td>
                            <td className="py-1.5 px-2 text-right text-amber-300">
                              {pl.yellowCards}/{pl.redCards}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'stadiums' && (
            <div className="space-y-5">
              {/* Featured Rivalry Matches */}
              <div>
                <h3 className="font-pixel text-[10px] text-yellow-300 mb-2">
                  RIVALRY MATCHES (&quot;THE CLÁSICO&quot; SPACE &amp; PLANETS · RANDOM DERBY LED ANIMATIONS ON OTHER 4 RIVALRIES)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {RIVALRIES.map((riv) => {
                    const tA = teamMap.get(riv.teamAId);
                    const tB = teamMap.get(riv.teamBId);
                    if (!tA || !tB) return null;
                    const isClasico = riv.id === 'the-clasico';
                    return (
                      <button
                        key={riv.id}
                        type="button"
                        data-testid={`rivalry-card-${riv.id}`}
                        onClick={() => {
                          onSelectRivalryMatch(riv.teamAId, riv.teamBId);
                          onClose();
                        }}
                        className="p-3 border-2 border-yellow-400 bg-black hover:bg-slate-900 text-left transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-pixel text-[10px] text-[#ffff00]">{riv.title}</span>
                          <span className="font-pixel text-[7px] px-1.5 py-0.5 bg-slate-800 text-sky-300">
                            {isClasico ? 'SPACE LED' : 'RANDOM LED FX'}
                          </span>
                        </div>
                        <div className="font-pixel-body text-lg text-white mt-0.5" dir="auto">
                          {tA.name} vs {tB.name}
                        </div>
                        <div className="font-pixel-body text-sm text-slate-400">
                          {isClasico
                            ? 'Iconic Space & Planets Clásico Broadcast'
                            : 'Unique Derby Name · Procedural Rivalry LED Boards'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lighting Presets */}
              <div>
                <h3 className="font-pixel text-[10px] text-yellow-300 mb-2">
                  STADIUM LIGHTING CUSTOMIZATION
                </h3>
                <div className="flex flex-wrap gap-2">
                  {LIGHTING_PRESETS.map((lp) => (
                    <button
                      key={lp.id}
                      type="button"
                      onClick={() => onSelectLighting(lp.id)}
                      className={`px-3 py-2 border-2 font-pixel text-[9px] ${
                        selectedLightingId === lp.id
                          ? 'border-yellow-400 bg-yellow-400 text-black'
                          : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      {lp.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stadiums Selector */}
              <div>
                <h3 className="font-pixel text-[10px] text-yellow-300 mb-2">
                  STADIUMS ({STADIUMS.length} ARENAS · RANDOMLY ROTATED EACH MATCH · TOURNAMENT FINALS AT KING ABDULLAH SPORTS CITY)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {STADIUMS.map((st) => {
                    const active = selectedStadiumId === st.id;
                    const isCupFinalArena = st.id === TOURNAMENT_FINAL_STADIUM_ID;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onSelectStadium(st.id)}
                        className={`p-3 border-2 text-left transition-colors ${
                          active
                            ? 'border-emerald-400 bg-emerald-950/50'
                            : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                        }`}
                      >
                        {st.imageUrl && (
                          <img
                            src={st.imageUrl}
                            alt={st.name}
                            className="w-full h-24 object-cover border border-slate-700 mb-2"
                          />
                        )}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-pixel text-[10px] text-white">{st.name}</span>
                          <div className="flex items-center gap-1">
                            {isCupFinalArena && (
                              <span
                                className={`font-pixel text-[7px] px-1.5 py-0.5 ${
                                  isFinalStage
                                    ? 'bg-yellow-400 text-black'
                                    : 'bg-amber-900/80 text-yellow-300 border border-yellow-400/60'
                                }`}
                              >
                                CUP FINALS ARENA
                              </span>
                            )}
                            {active && (
                              <span className="font-pixel text-[8px] bg-emerald-400 text-black px-1.5 py-0.5">
                                SELECTED
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 font-pixel-body text-base text-slate-300">
                          <span
                            className="w-4 h-4 border border-white/70 inline-block"
                            style={{ background: `linear-gradient(135deg, ${st.turfA} 50%, ${st.turfB} 50%)` }}
                          />
                          <span dir="auto">{st.cityDisplay} · {st.turfPattern.toUpperCase()} TURF</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'changelog' && (
            <div data-testid="changelog-panel" className="space-y-4">
              <div className="p-3 border-2 border-amber-400 bg-[#080d22] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-pixel text-xs text-yellow-300">
                    CAAYVG SOCCER 26/27 · CHANGELOG
                  </h3>
                  <p className="font-pixel-body text-base text-slate-300">
                    Full update history covering 360° perimeter LED showcases, new soda flavors, rivalries, stadiums, difficulty &amp; match rules.
                  </p>
                </div>
                <span className="font-pixel text-[9px] bg-indigo-950 border border-indigo-400 text-indigo-200 px-2 py-1">
                  CURRENT: {GAME_VERSION}
                </span>
              </div>

              <div className="space-y-3">
                {CHANGELOG_ENTRIES.map((entry, idx) => (
                  <article
                    key={entry.version}
                    className={`p-4 border-2 ${
                      idx === 0
                        ? 'border-emerald-400 bg-emerald-950/20'
                        : 'border-slate-700 bg-slate-900/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-700/80">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-pixel text-[10px] bg-yellow-400 text-black px-2 py-0.5">
                          {entry.version}
                        </span>
                        <h4 className="font-pixel text-[10px] sm:text-xs text-white">
                          {entry.title}
                        </h4>
                      </div>
                      <span className="font-pixel text-[8px] text-sky-300">{entry.date}</span>
                    </div>
                    <ul className="space-y-1.5 list-disc list-inside font-pixel-body text-lg text-slate-200">
                      {entry.highlights.map((item) => (
                        <li key={item} className="leading-snug">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-4 py-3 bg-[#0f172a] border-t-2 border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="font-pixel-body text-lg text-slate-300" dir="auto">
            Home: <span className="text-yellow-300">{teamMap.get(userTeamId)?.name}</span> · Stadium:{' '}
            <span className="text-emerald-300">{STADIUMS.find((s) => s.id === selectedStadiumId)?.name}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartMatch();
            }}
            className="pixel-btn bg-emerald-500 hover:bg-emerald-400 text-black font-pixel text-xs px-5 py-2.5"
          >
            PLAY THIS MATCH
          </button>
        </div>
      </div>
    </div>
  );
}
