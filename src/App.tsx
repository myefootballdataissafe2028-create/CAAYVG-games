import { useCallback, useEffect, useRef, useState } from 'react';
import { Cutscene3DStage } from './components/Cutscene3DStage';
import { MatchModal } from './components/MatchModal';
import { ScoreboardHUD } from './components/ScoreboardHUD';
import { TitleScreen, type CupJumpTarget } from './components/TitleScreen';
import { TournamentModal, type TournamentModalTab } from './components/TournamentModal';
import { UltimateTeamModal } from './components/UltimateTeamModal';
import { soundEngine } from './game/audio';
import {
  UT_PACKS,
  applyUtMatchResult,
  buildRivalsCpuTeam,
  buildUtHomeTeam,
  calculateUtSquadStats,
  createDefaultUltimateTeamState,
  utCardsToMatchLineup,
  type UltimateTeamState,
} from './game/ultimateTeam';
import {
  ALL_TEAMS,
  COMPETITIONS,
  EXPANSION_TEAMS,
  LEAGUE_TEAMS,
  LIGHTING_PRESETS,
  RIVALRIES,
  STADIUMS,
  getTeamBench,
} from './game/data';
import { MatchEngine } from './game/matchEngine';
import {
  TOTAL_LEAGUE_ROUNDS,
  TOURNAMENT_FINAL_STADIUM_ID,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
  applyMatchContributionsToCareerStats,
  clampMatchHalfSeconds,
  createCupBracket,
  createInitialGlobalRankings,
  createInitialPlayerCareerStats,
  createInitialStandings,
  createLeagueFixtures,
  findRivalry,
  getCupRoundDateTime,
  getCupRoundLedLabel,
  getFormationLineupWithTactics,
  getLeagueRoundDateTime,
  getNextPendingCupMatch,
  getUserFixtureForRound,
  isCupFinalRound,
  isLeagueGrandFinale38,
  isRoadToRound38,
  jumpCupBracketToRound,
  recordAndSimulateLeagueRound,
  recordCupMatchResult,
  resolveMatchStadium,
  swapLineupBenchSlot,
  updateGlobalRankingsFromMatch,
  wouldHomeWinLeagueAfterMatch,
} from './game/rules';
import type {
  BenchSlotSpec,
  CompetitionId,
  CupBracketState,
  FormationId,
  GameDifficulty,
  GameScreenState,
  GlobalClubRanking,
  LeagueRoundSchedule,
  LeagueStanding,
  LightingPresetId,
  MatchHudSnapshot,
  MatchResultSummary,
  PlayerCareerStats,
  SquadSlotSpec,
  StadiumTheme,
  TacticId,
  Team,
  TouchInputState,
} from './game/types';

const STORAGE_KEY = 'caayvg_soccer_2627_v4';
const UT_STORAGE_KEY = 'caayvg_ut_2627_v1';
const INTRO_3D_DURATION_SEC = 20;

function loadUtState(): UltimateTeamState {
  try {
    const raw = localStorage.getItem(UT_STORAGE_KEY);
    if (!raw) return createDefaultUltimateTeamState();
    const parsed = JSON.parse(raw) as Partial<UltimateTeamState>;
    const fallback = createDefaultUltimateTeamState();
    if (!Array.isArray(parsed.ownedCardIds) || !Array.isArray(parsed.activeSquadCardIds) || parsed.activeSquadCardIds.length !== 11) {
      return fallback;
    }
    return {
      ...fallback,
      ...parsed,
      rivals: {
        ...fallback.rivals,
        ...(parsed.rivals ?? {}),
      },
    };
  } catch {
    return createDefaultUltimateTeamState();
  }
}

type BracketKey = 'king_cup' | 'super_cup' | 'anime_cup' | 'singleplayer';

interface SavedTournamentState {
  standings: LeagueStanding[];
  expansionStandings: LeagueStanding[];
  premierFixtures: LeagueRoundSchedule[];
  expansionFixtures: LeagueRoundSchedule[];
  currentLeagueRound: number;
  brackets: Record<BracketKey, CupBracketState>;
  globalRankings: GlobalClubRanking[];
  playerCareerStats: PlayerCareerStats[];
  userTeamId: string;
  opponentTeamId: string;
  selectedCompetition: CompetitionId;
  isSingleplayerTour: boolean;
  selectedStadiumId: string;
  selectedLightingId: LightingPresetId;
  difficulty: GameDifficulty;
  matchHalfSeconds: number;
}

const VALID_DIFFICULTIES: GameDifficulty[] = ['easy', 'normal', 'hard', 'legendary'];

function createBracketsForUser(userTeamId: string): Record<BracketKey, CupBracketState> {
  return {
    king_cup: createCupBracket('king_cup', ALL_TEAMS, userTeamId),
    super_cup: createCupBracket('super_cup', ALL_TEAMS, userTeamId),
    anime_cup: createCupBracket('anime_cup', ALL_TEAMS, userTeamId),
    singleplayer: createCupBracket('singleplayer', ALL_TEAMS, userTeamId),
  };
}

function createDefaultSavedState(): SavedTournamentState {
  const userTeamId = LEAGUE_TEAMS[0].id;
  return {
    standings: createInitialStandings(LEAGUE_TEAMS),
    expansionStandings: createInitialStandings(EXPANSION_TEAMS),
    premierFixtures: createLeagueFixtures(LEAGUE_TEAMS, userTeamId, TOTAL_LEAGUE_ROUNDS),
    expansionFixtures: createLeagueFixtures(EXPANSION_TEAMS, userTeamId, TOTAL_LEAGUE_ROUNDS),
    currentLeagueRound: 1,
    brackets: createBracketsForUser(userTeamId),
    globalRankings: createInitialGlobalRankings(ALL_TEAMS),
    playerCareerStats: createInitialPlayerCareerStats(ALL_TEAMS),
    userTeamId,
    opponentTeamId: LEAGUE_TEAMS[2].id,
    selectedCompetition: 'league',
    isSingleplayerTour: false,
    selectedStadiumId: STADIUMS[0].id,
    selectedLightingId: 'night_flood',
    difficulty: 'normal',
    matchHalfSeconds: 45,
  };
}

function loadSavedState(): SavedTournamentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSavedState();
    const parsed = JSON.parse(raw) as Partial<SavedTournamentState>;
    const fallback = createDefaultSavedState();
    if (!Array.isArray(parsed.standings) || parsed.standings.length !== LEAGUE_TEAMS.length) {
      return fallback;
    }
    if (
      !Array.isArray(parsed.expansionStandings) ||
      parsed.expansionStandings.length !== EXPANSION_TEAMS.length
    ) {
      return fallback;
    }
    if (!parsed.brackets?.singleplayer || !parsed.brackets?.king_cup) {
      return fallback;
    }
    if (
      !Array.isArray(parsed.globalRankings) ||
      parsed.globalRankings.length !== ALL_TEAMS.length
    ) {
      return fallback;
    }
    if (!Array.isArray(parsed.playerCareerStats) || parsed.playerCareerStats.length === 0) {
      return fallback;
    }
    const uid = parsed.userTeamId ?? fallback.userTeamId;
    const validPremier =
      Array.isArray(parsed.premierFixtures) && parsed.premierFixtures.length === TOTAL_LEAGUE_ROUNDS
        ? parsed.premierFixtures
        : createLeagueFixtures(LEAGUE_TEAMS, uid, TOTAL_LEAGUE_ROUNDS);
    const validExpansion =
      Array.isArray(parsed.expansionFixtures) && parsed.expansionFixtures.length === TOTAL_LEAGUE_ROUNDS
        ? parsed.expansionFixtures
        : createLeagueFixtures(EXPANSION_TEAMS, uid, TOTAL_LEAGUE_ROUNDS);
    const validRound =
      typeof parsed.currentLeagueRound === 'number' &&
      parsed.currentLeagueRound >= 1 &&
      parsed.currentLeagueRound <= TOTAL_LEAGUE_ROUNDS
        ? parsed.currentLeagueRound
        : 1;
    const validDifficulty =
      parsed.difficulty && VALID_DIFFICULTIES.includes(parsed.difficulty)
        ? parsed.difficulty
        : fallback.difficulty;
    const validHalfSeconds = clampMatchHalfSeconds(parsed.matchHalfSeconds);
    return {
      ...fallback,
      ...parsed,
      premierFixtures: validPremier,
      expansionFixtures: validExpansion,
      currentLeagueRound: validRound,
      difficulty: validDifficulty,
      matchHalfSeconds: validHalfSeconds,
      brackets: parsed.brackets,
      standings: parsed.standings,
      expansionStandings: parsed.expansionStandings,
      globalRankings: parsed.globalRankings,
      playerCareerStats: parsed.playerCareerStats,
    };
  } catch {
    return createDefaultSavedState();
  }
}

export default function App() {
  const initialSaved = useRef<SavedTournamentState>(loadSavedState());
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [gameState, setGameState] = useState<GameScreenState>(autostart ? 'playing' : 'title');
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionId>(
    initialSaved.current.selectedCompetition
  );
  const [isSingleplayerTour, setIsSingleplayerTour] = useState<boolean>(
    initialSaved.current.isSingleplayerTour
  );
  const [userTeamId, setUserTeamId] = useState<string>(initialSaved.current.userTeamId);
  const [opponentTeamId, setOpponentTeamId] = useState<string>(
    initialSaved.current.opponentTeamId
  );
  const [selectedStadiumId, setSelectedStadiumId] = useState<string>(
    initialSaved.current.selectedStadiumId
  );
  const [selectedLightingId, setSelectedLightingId] = useState<LightingPresetId>(
    initialSaved.current.selectedLightingId
  );
  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialSaved.current.difficulty);
  const [matchHalfSeconds, setMatchHalfSeconds] = useState<number>(
    initialSaved.current.matchHalfSeconds
  );
  const [matchSeed, setMatchSeed] = useState<number>(() => Math.floor(Date.now() % 1000000) + 1);

  const [standings, setStandings] = useState<LeagueStanding[]>(initialSaved.current.standings);
  const [expansionStandings, setExpansionStandings] = useState<LeagueStanding[]>(
    initialSaved.current.expansionStandings
  );
  const [premierFixtures, setPremierFixtures] = useState<LeagueRoundSchedule[]>(
    initialSaved.current.premierFixtures
  );
  const [expansionFixtures, setExpansionFixtures] = useState<LeagueRoundSchedule[]>(
    initialSaved.current.expansionFixtures
  );
  const [currentLeagueRound, setCurrentLeagueRound] = useState<number>(
    initialSaved.current.currentLeagueRound
  );
  const [useCustomLeagueOpponent, setUseCustomLeagueOpponent] = useState<boolean>(false);

  const [brackets, setBrackets] = useState<Record<BracketKey, CupBracketState>>(
    initialSaved.current.brackets
  );
  const [globalRankings, setGlobalRankings] = useState<GlobalClubRanking[]>(
    initialSaved.current.globalRankings
  );
  const [playerCareerStats, setPlayerCareerStats] = useState<PlayerCareerStats[]>(
    initialSaved.current.playerCareerStats
  );

  // Formations, Tactics & Lineup / Bench (11v11 across every mode)
  const [selectedFormation, setSelectedFormation] = useState<FormationId>('4-3-3');
  const [selectedTactic, setSelectedTactic] = useState<TacticId>('balanced');
  const initialUserClub =
    ALL_TEAMS.find((t) => t.id === initialSaved.current.userTeamId) ?? ALL_TEAMS[0];
  const [homeLineup, setHomeLineup] = useState<SquadSlotSpec[]>(() =>
    getFormationLineupWithTactics(initialUserClub, '4-3-3', 'balanced')
  );
  const [homeBench, setHomeBench] = useState<BenchSlotSpec[]>(() => getTeamBench(initialUserClub));

  // Ultimate Team State
  const [utState, setUtState] = useState<UltimateTeamState>(() => loadUtState());
  const [utOpen, setUtOpen] = useState(false);

  // 20-second 3D Intro Cutscene Overlay (accessible from Title Screen)
  const [introActive, setIntroActive] = useState(false);
  const [introRemaining, setIntroRemaining] = useState(INTRO_3D_DURATION_SEC);

  const [tournamentOpen, setTournamentOpen] = useState(false);
  const [tournamentTab, setTournamentTab] = useState<TournamentModalTab>('teams');
  const [muted, setMuted] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 820;
  });

  const [matchKey, setMatchKey] = useState(1);
  const [hud, setHud] = useState<MatchHudSnapshot | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResultSummary | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MatchEngine | null>(null);
  const pendingLaunchRef = useRef<{
    stadium?: StadiumTheme;
    matchSeed?: number;
    utContext?: { subMode: 'squad' | 'draft' | 'rivals'; division?: number };
    homeTeamOverride?: Team;
    awayTeamOverride?: Team;
    lineupOverride?: SquadSlotSpec[];
    formationOverride?: FormationId;
  } | null>(null);
  const utStateRef = useRef<UltimateTeamState>(utState);
  utStateRef.current = utState;
  const gameStateRef = useRef<GameScreenState>(gameState);
  gameStateRef.current = gameState;

  const userTeam: Team = ALL_TEAMS.find((t) => t.id === userTeamId) ?? ALL_TEAMS[0];
  const opponentTeam: Team =
    ALL_TEAMS.find((t) => t.id === opponentTeamId && t.id !== userTeam.id) ??
    ALL_TEAMS.find((t) => t.id !== userTeam.id) ??
    ALL_TEAMS[1];

  const activeStadium = STADIUMS.find((s) => s.id === selectedStadiumId) ?? STADIUMS[0];
  const activeLighting =
    LIGHTING_PRESETS.find((l) => l.id === selectedLightingId) ?? LIGHTING_PRESETS[0];

  // Sync body[data-state]
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // 20s 3D Intro countdown timer
  useEffect(() => {
    if (!introActive) return;
    setIntroRemaining(INTRO_3D_DURATION_SEC);
    const id = window.setInterval(() => {
      setIntroRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setIntroActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [introActive]);

  // Persist tournament & global stats state
  useEffect(() => {
    try {
      const payload: SavedTournamentState = {
        standings,
        expansionStandings,
        premierFixtures,
        expansionFixtures,
        currentLeagueRound,
        brackets,
        globalRankings,
        playerCareerStats,
        userTeamId,
        opponentTeamId,
        selectedCompetition,
        isSingleplayerTour,
        selectedStadiumId,
        selectedLightingId,
        difficulty,
        matchHalfSeconds,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    standings,
    expansionStandings,
    premierFixtures,
    expansionFixtures,
    currentLeagueRound,
    brackets,
    globalRankings,
    playerCareerStats,
    userTeamId,
    opponentTeamId,
    selectedCompetition,
    isSingleplayerTour,
    selectedStadiumId,
    selectedLightingId,
    difficulty,
    matchHalfSeconds,
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(UT_STORAGE_KEY, JSON.stringify(utState));
    } catch {
      // Ignore storage quota errors
    }
  }, [utState]);

  const activeBracketKey: BracketKey = isSingleplayerTour
    ? 'singleplayer'
    : selectedCompetition === 'league'
    ? 'king_cup'
    : selectedCompetition;
  const activeCupNode =
    isSingleplayerTour || selectedCompetition !== 'league'
      ? getNextPendingCupMatch(brackets[activeBracketKey], userTeam.id)
      : null;
  const isCurrentlyInFinalStage = isCupFinalRound(
    selectedCompetition,
    isSingleplayerTour,
    activeCupNode?.roundName
  );

  // Lock arena preview/selection to King Abdullah Sports City Stadium whenever entering any Tournament Final
  useEffect(() => {
    if (isCurrentlyInFinalStage && selectedStadiumId !== TOURNAMENT_FINAL_STADIUM_ID) {
      setSelectedStadiumId(TOURNAMENT_FINAL_STADIUM_ID);
    }
  }, [isCurrentlyInFinalStage, selectedStadiumId]);

  // Determine current opponent & scheduled date/time
  const getActiveOpponent = useCallback((): Team => {
    if (!isSingleplayerTour && selectedCompetition === 'league') {
      if (!useCustomLeagueOpponent) {
        const divSchedules =
          userTeam.division === 'premier' ? premierFixtures : expansionFixtures;
        const fix = getUserFixtureForRound(divSchedules, currentLeagueRound, userTeam.id);
        if (fix) {
          const oppId = fix.homeTeamId === userTeam.id ? fix.awayTeamId : fix.homeTeamId;
          const found = ALL_TEAMS.find((t) => t.id === oppId);
          if (found) return found;
        }
      }
      return opponentTeam;
    }
    if (activeCupNode) {
      const oppId =
        activeCupNode.homeTeamId === userTeam.id
          ? activeCupNode.awayTeamId
          : activeCupNode.homeTeamId;
      const found = ALL_TEAMS.find((t) => t.id === oppId);
      if (found) return found;
    }
    return opponentTeam;
  }, [
    isSingleplayerTour,
    selectedCompetition,
    useCustomLeagueOpponent,
    userTeam.division,
    userTeam.id,
    premierFixtures,
    expansionFixtures,
    currentLeagueRound,
    activeCupNode,
    opponentTeam,
  ]);

  const activeOpponent = getActiveOpponent();
  const activeRivalry = findRivalry(userTeam.id, activeOpponent.id, RIVALRIES);

  const activeDateTime =
    !isSingleplayerTour && selectedCompetition === 'league'
      ? getLeagueRoundDateTime(currentLeagueRound)
      : activeCupNode?.dateLabel
      ? { dateLabel: activeCupNode.dateLabel, timeLabel: activeCupNode.timeLabel ?? '20:00' }
      : getCupRoundDateTime(
          isSingleplayerTour ? 'singleplayer' : selectedCompetition,
          activeCupNode?.roundIndex ?? 0,
          activeCupNode?.roundName === 'GROUP STAGES'
        );

  const activeCupStageLabel =
    isSingleplayerTour || selectedCompetition !== 'league'
      ? getCupRoundLedLabel(selectedCompetition, activeCupNode?.roundName)
      : undefined;

  const resetLineupForTeam = useCallback(
    (teamId: string, form: FormationId = selectedFormation, tac: TacticId = selectedTactic) => {
      const club = ALL_TEAMS.find((t) => t.id === teamId) ?? ALL_TEAMS[0];
      setHomeLineup(getFormationLineupWithTactics(club, form, tac));
      setHomeBench(getTeamBench(club));
    },
    [selectedFormation, selectedTactic]
  );

  const handleChangeFormation = useCallback(
    (formation: FormationId) => {
      soundEngine.playMenuBlip();
      setSelectedFormation(formation);
      const club = ALL_TEAMS.find((t) => t.id === userTeamId) ?? ALL_TEAMS[0];
      setHomeLineup((prev) =>
        getFormationLineupWithTactics(club, formation, selectedTactic, prev)
      );
      engineRef.current?.setFormationAndTactics(formation, selectedTactic);
    },
    [selectedTactic, userTeamId]
  );

  const handleChangeTactic = useCallback(
    (tactic: TacticId) => {
      soundEngine.playMenuBlip();
      setSelectedTactic(tactic);
      const club = ALL_TEAMS.find((t) => t.id === userTeamId) ?? ALL_TEAMS[0];
      setHomeLineup((prev) =>
        getFormationLineupWithTactics(club, selectedFormation, tactic, prev)
      );
      engineRef.current?.setFormationAndTactics(selectedFormation, tactic);
    },
    [selectedFormation, userTeamId]
  );

  const handleChangeFormationAndTactic = useCallback(
    (formation: FormationId, tactic: TacticId) => {
      soundEngine.playMenuBlip();
      setSelectedFormation(formation);
      setSelectedTactic(tactic);
      const club = ALL_TEAMS.find((t) => t.id === userTeamId) ?? ALL_TEAMS[0];
      setHomeLineup((prev) =>
        getFormationLineupWithTactics(club, formation, tactic, prev)
      );
      engineRef.current?.setFormationAndTactics(formation, tactic);
    },
    [userTeamId]
  );

  const handleSubstitutePlayer = useCallback(
    (outStarterIdx: number, inBenchIdx: number) => {
      soundEngine.playMenuBlip();
      setHomeLineup((prevLineup) => {
        const swapped = swapLineupBenchSlot(prevLineup, homeBench, outStarterIdx, inBenchIdx);
        setHomeBench(swapped.bench);
        return swapped.lineup;
      });
      engineRef.current?.substitutePlayer(outStarterIdx, inBenchIdx);
    },
    [homeBench]
  );

  const handleMatchFinished = useCallback(
    (summary: MatchResultSummary) => {
      if (summary.isUltimateTeam && summary.utContext) {
        const res = applyUtMatchResult(
          utStateRef.current,
          summary.utContext.subMode,
          summary.homeScore,
          summary.awayScore
        );
        setUtState(res.nextState);
        const packName = res.packEarned
          ? UT_PACKS.find((p) => p.id === res.packEarned)?.name
          : undefined;
        setMatchResult({
          ...summary,
          utContext: {
            ...summary.utContext,
            coinsEarned: res.coinsEarned,
            pointsEarned: res.pointsEarned,
            promotedToDivision: res.promotedToDivision,
            packEarnedName: packName,
          },
        });
        setGameState('gameover');
        document.body.dataset.state = 'gameover';
        return;
      }

      setMatchResult(summary);
      setGameState('gameover');
      document.body.dataset.state = 'gameover';

      const winnerId =
        summary.homeScore > summary.awayScore
          ? summary.homeTeam.id
          : summary.awayScore > summary.homeScore
          ? summary.awayTeam.id
          : summary.shootoutWinner === 'away'
          ? summary.awayTeam.id
          : summary.homeTeam.id;

      let wonTrophy = Boolean(summary.wonTrophy);

      if (summary.isSingleplayerTour || summary.competitionId !== 'league') {
        const bracketKey: BracketKey = summary.isSingleplayerTour
          ? 'singleplayer'
          : summary.competitionId === 'league'
          ? 'king_cup'
          : summary.competitionId;

        setBrackets((prev) => {
          const current = prev[bracketKey];
          const node = getNextPendingCupMatch(current, summary.homeTeam.id);
          if (!node) return prev;
          const updated = recordCupMatchResult(
            current,
            node.id,
            summary.homeScore,
            summary.awayScore,
            winnerId,
            ALL_TEAMS,
            Date.now(),
            summary.homeTeam.id
          );
          if (updated.championId === winnerId) {
            wonTrophy = true;
          }
          return {
            ...prev,
            [bracketKey]: updated,
          };
        });
      } else {
        const roundToRecord = summary.leagueRound ?? currentLeagueRound;
        const userDiv = summary.homeTeam.division;

        if (userDiv === 'premier') {
          const res = recordAndSimulateLeagueRound({
            schedules: premierFixtures,
            standings,
            teams: LEAGUE_TEAMS,
            round: roundToRecord,
            userMatch: {
              homeTeamId: summary.homeTeam.id,
              awayTeamId: summary.awayTeam.id,
              homeScore: summary.homeScore,
              awayScore: summary.awayScore,
            },
            seed: Date.now(),
          });
          setPremierFixtures(res.schedules);
          setStandings(res.standings);

          const expRes = recordAndSimulateLeagueRound({
            schedules: expansionFixtures,
            standings: expansionStandings,
            teams: EXPANSION_TEAMS,
            round: roundToRecord,
            seed: Date.now() + 99,
          });
          setExpansionFixtures(expRes.schedules);
          setExpansionStandings(expRes.standings);
        } else {
          const res = recordAndSimulateLeagueRound({
            schedules: expansionFixtures,
            standings: expansionStandings,
            teams: EXPANSION_TEAMS,
            round: roundToRecord,
            userMatch: {
              homeTeamId: summary.homeTeam.id,
              awayTeamId: summary.awayTeam.id,
              homeScore: summary.homeScore,
              awayScore: summary.awayScore,
            },
            seed: Date.now(),
          });
          setExpansionFixtures(res.schedules);
          setExpansionStandings(res.standings);

          const premRes = recordAndSimulateLeagueRound({
            schedules: premierFixtures,
            standings,
            teams: LEAGUE_TEAMS,
            round: roundToRecord,
            seed: Date.now() + 99,
          });
          setPremierFixtures(premRes.schedules);
          setStandings(premRes.standings);
        }

        if (roundToRecord < TOTAL_LEAGUE_ROUNDS) {
          setCurrentLeagueRound(roundToRecord + 1);
        }
      }

      setGlobalRankings((prev) => updateGlobalRankingsFromMatch(prev, summary, wonTrophy));
      setPlayerCareerStats((prev) => applyMatchContributionsToCareerStats(prev, summary));
    },
    [currentLeagueRound, premierFixtures, standings, expansionFixtures, expansionStandings]
  );

  const handleSimulateLeagueRound = useCallback(
    (roundToSim: number) => {
      soundEngine.playMenuBlip();
      const premRes = recordAndSimulateLeagueRound({
        schedules: premierFixtures,
        standings,
        teams: LEAGUE_TEAMS,
        round: roundToSim,
        seed: Date.now() + roundToSim * 17,
      });
      const expRes = recordAndSimulateLeagueRound({
        schedules: expansionFixtures,
        standings: expansionStandings,
        teams: EXPANSION_TEAMS,
        round: roundToSim,
        seed: Date.now() + roundToSim * 31,
      });
      setPremierFixtures(premRes.schedules);
      setStandings(premRes.standings);
      setExpansionFixtures(expRes.schedules);
      setExpansionStandings(expRes.standings);
      setCurrentLeagueRound((prev) =>
        Math.max(prev, Math.min(TOTAL_LEAGUE_ROUNDS, roundToSim + 1))
      );
    },
    [premierFixtures, standings, expansionFixtures, expansionStandings]
  );

  const handleSimulateToLeagueRound = useCallback(
    (targetRound: number) => {
      soundEngine.playMenuBlip();
      const clampedTarget = Math.max(1, Math.min(TOTAL_LEAGUE_ROUNDS, targetRound));
      let nextPremSch = premierFixtures;
      let nextPremStd = standings;
      let nextExpSch = expansionFixtures;
      let nextExpStd = expansionStandings;

      for (let r = 1; r < clampedTarget; r++) {
        const premRes = recordAndSimulateLeagueRound({
          schedules: nextPremSch,
          standings: nextPremStd,
          teams: LEAGUE_TEAMS,
          round: r,
          seed: Date.now() + r * 37,
        });
        nextPremSch = premRes.schedules;
        nextPremStd = premRes.standings;

        const expRes = recordAndSimulateLeagueRound({
          schedules: nextExpSch,
          standings: nextExpStd,
          teams: EXPANSION_TEAMS,
          round: r,
          seed: Date.now() + r * 53,
        });
        nextExpSch = expRes.schedules;
        nextExpStd = expRes.standings;
      }

      setPremierFixtures(nextPremSch);
      setStandings(nextPremStd);
      setExpansionFixtures(nextExpSch);
      setExpansionStandings(nextExpStd);
      setUseCustomLeagueOpponent(false);
      setCurrentLeagueRound(clampedTarget);
    },
    [premierFixtures, standings, expansionFixtures, expansionStandings]
  );

  const handleJumpCupRound = useCallback(
    (compId: 'king_cup' | 'anime_cup', target: CupJumpTarget) => {
      soundEngine.playMenuBlip();
      setSelectedCompetition(compId);
      setIsSingleplayerTour(false);
      setBrackets((prev) => ({
        ...prev,
        [compId]: jumpCupBracketToRound(compId, ALL_TEAMS, userTeam.id, target),
      }));
    },
    [userTeam.id]
  );

  const startMatch = useCallback(
    (forceNonFinal?: boolean) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      soundEngine.playMenuBlip();
      const seed = Math.floor(Date.now() % 1000000) + matchKey * 131 + 17;
      const isFinalMatch = forceNonFinal === true ? false : isCurrentlyInFinalStage;
      const nextStadium = resolveMatchStadium({
        stadiums: STADIUMS,
        isFinalMatch,
        previousStadiumId: selectedStadiumId,
        seed,
      });
      pendingLaunchRef.current = { stadium: nextStadium, matchSeed: seed };
      setSelectedStadiumId(nextStadium.id);
      setMatchSeed(seed);
      setIntroActive(false);
      setMatchResult(null);
      setMatchKey((k) => k + 1);
      setGameState('playing');
      document.body.dataset.state = 'playing';
    },
    [isCurrentlyInFinalStage, matchKey, selectedStadiumId]
  );

  const handleLaunchClasico = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundEngine.playMenuBlip();
    const seed = Math.floor(Date.now() % 1000000) + matchKey * 193 + 29;
    const nextStadium = resolveMatchStadium({
      stadiums: STADIUMS,
      isFinalMatch: false,
      previousStadiumId: selectedStadiumId,
      seed,
    });
    pendingLaunchRef.current = { stadium: nextStadium, matchSeed: seed };
    setIntroActive(false);
    setSelectedCompetition('league');
    setIsSingleplayerTour(false);
    setUseCustomLeagueOpponent(true);
    setUserTeamId('brazil-fc');
    setOpponentTeamId('glitter-force');
    setSelectedStadiumId(nextStadium.id);
    setMatchSeed(seed);
    resetLineupForTeam('brazil-fc');
    setMatchResult(null);
    setMatchKey((k) => k + 1);
    setGameState('playing');
    document.body.dataset.state = 'playing';
  }, [matchKey, resetLineupForTeam, selectedStadiumId]);

  const handleLaunchUtMatch = useCallback(
    (subMode: 'squad' | 'draft' | 'rivals') => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      soundEngine.playMenuBlip();
      const curUt = utStateRef.current;
      const isDraft = subMode === 'draft' && curUt.draft && curUt.draft.pickedCardIds.length === 11;
      const cardIds = isDraft ? curUt.draft!.pickedCardIds : curUt.activeSquadCardIds;
      const formation = isDraft ? curUt.draft!.formation : curUt.formation;
      const stats = calculateUtSquadStats(cardIds, formation);
      const homeUtTeam = buildUtHomeTeam(
        curUt.clubName,
        stats.ovr,
        stats.attack,
        stats.defense,
        stats.speed
      );
      const seed = Math.floor(Date.now() % 1000000) + matchKey * 211 + 37;
      const awayUtTeam =
        subMode === 'rivals'
          ? buildRivalsCpuTeam(curUt.rivals.division)
          : ALL_TEAMS[seed % ALL_TEAMS.length];
      const utLineup = utCardsToMatchLineup(cardIds, formation);
      const nextStadium = resolveMatchStadium({
        stadiums: STADIUMS,
        isFinalMatch: false,
        previousStadiumId: selectedStadiumId,
        seed,
      });

      pendingLaunchRef.current = {
        stadium: nextStadium,
        matchSeed: seed,
        utContext: {
          subMode,
          division: subMode === 'rivals' ? curUt.rivals.division : undefined,
        },
        homeTeamOverride: homeUtTeam,
        awayTeamOverride: awayUtTeam,
        lineupOverride: utLineup,
        formationOverride: formation,
      };
      setUtOpen(false);
      setIntroActive(false);
      setSelectedStadiumId(nextStadium.id);
      setMatchSeed(seed);
      setMatchResult(null);
      setMatchKey((k) => k + 1);
      setGameState('playing');
      document.body.dataset.state = 'playing';
    },
    [matchKey, selectedStadiumId]
  );

  const handleSelectRivalryMatch = useCallback(
    (teamAId: string, teamBId: string) => {
      soundEngine.playMenuBlip();
      setSelectedCompetition('league');
      setIsSingleplayerTour(false);
      setUseCustomLeagueOpponent(true);
      setUserTeamId(teamAId);
      setOpponentTeamId(teamBId);
      resetLineupForTeam(teamAId);
      startMatch(true);
    },
    [resetLineupForTeam, startMatch]
  );

  const handleToggleMute = useCallback(() => {
    const next = soundEngine.toggleMute();
    setMuted(next);
  }, []);

  const handlePause = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      engineRef.current?.setPaused(true);
      setGameState('paused');
      document.body.dataset.state = 'paused';
    } else if (gameStateRef.current === 'paused') {
      engineRef.current?.setPaused(false);
      setGameState('playing');
      document.body.dataset.state = 'playing';
    }
  }, []);

  const handleReturnTitle = useCallback(() => {
    engineRef.current?.setPaused(true);
    setGameState('title');
    document.body.dataset.state = 'title';
  }, []);

  const handleResetSeason = useCallback(() => {
    const fresh = createDefaultSavedState();
    setStandings(fresh.standings);
    setExpansionStandings(fresh.expansionStandings);
    setPremierFixtures(createLeagueFixtures(LEAGUE_TEAMS, userTeamId, TOTAL_LEAGUE_ROUNDS));
    setExpansionFixtures(createLeagueFixtures(EXPANSION_TEAMS, userTeamId, TOTAL_LEAGUE_ROUNDS));
    setCurrentLeagueRound(1);
    setUseCustomLeagueOpponent(false);
    setBrackets(createBracketsForUser(userTeamId));
    setGlobalRankings(fresh.globalRankings);
    setPlayerCareerStats(fresh.playerCareerStats);
    soundEngine.playMenuBlip();
  }, [userTeamId]);

  const handleSelectUserTeam = useCallback(
    (id: string) => {
      setUserTeamId(id);
      if (id === opponentTeamId) {
        const alt = ALL_TEAMS.find((t) => t.id !== id);
        if (alt) setOpponentTeamId(alt.id);
      }
      resetLineupForTeam(id);
      setPremierFixtures(createLeagueFixtures(LEAGUE_TEAMS, id, TOTAL_LEAGUE_ROUNDS));
      setExpansionFixtures(createLeagueFixtures(EXPANSION_TEAMS, id, TOTAL_LEAGUE_ROUNDS));
      setBrackets(createBracketsForUser(id));
      soundEngine.playMenuBlip();
    },
    [opponentTeamId, resetLineupForTeam]
  );

  // Mount & run isolated 60fps match loop whenever playing starts/restarts
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'paused' && gameState !== 'gameover') {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const compInfo = COMPETITIONS.find((c) => c.id === selectedCompetition) ?? COMPETITIONS[0];
    const opp = getActiveOpponent();
    const rivalry = findRivalry(userTeam.id, opp.id, RIVALRIES);

    const bracketKey: BracketKey = isSingleplayerTour
      ? 'singleplayer'
      : selectedCompetition === 'league'
      ? 'king_cup'
      : selectedCompetition;
    const bracketNode =
      isSingleplayerTour || selectedCompetition !== 'league'
        ? getNextPendingCupMatch(brackets[bracketKey], userTeam.id)
        : null;
    const cupRoundLabel = getCupRoundLedLabel(selectedCompetition, bracketNode?.roundName);
    const leagueRound =
      !isSingleplayerTour && selectedCompetition === 'league' ? currentLeagueRound : undefined;
    const roadTo38 = isRoadToRound38(selectedCompetition, leagueRound, isSingleplayerTour);
    const finale38 = isLeagueGrandFinale38(selectedCompetition, leagueRound, isSingleplayerTour);
    const finalMatch = isCupFinalRound(
      selectedCompetition,
      isSingleplayerTour,
      bracketNode?.roundName
    );
    const activeLeagueStandings = userTeam.division === 'premier' ? standings : expansionStandings;
    const dtInfo =
      leagueRound !== undefined
        ? getLeagueRoundDateTime(leagueRound)
        : bracketNode?.dateLabel
        ? { dateLabel: bracketNode.dateLabel, timeLabel: bracketNode.timeLabel ?? '20:00' }
        : getCupRoundDateTime(
            isSingleplayerTour ? 'singleplayer' : selectedCompetition,
            bracketNode?.roundIndex ?? 0,
            bracketNode?.roundName === 'GROUP STAGES'
          );

    const launchOverride = pendingLaunchRef.current;
    pendingLaunchRef.current = null;
    const matchStadium = launchOverride?.stadium ?? activeStadium;
    const launchSeed = launchOverride?.matchSeed ?? matchSeed;
    const isUtMatch = Boolean(launchOverride?.utContext);
    const activeHomeTeam = launchOverride?.homeTeamOverride ?? userTeam;
    const activeAwayTeam = launchOverride?.awayTeamOverride ?? opp;
    const activeFormation = launchOverride?.formationOverride ?? selectedFormation;
    const activeLineup = launchOverride?.lineupOverride ?? homeLineup;

    const engine = new MatchEngine({
      canvas,
      competitionId: selectedCompetition,
      cupRoundLabel: isUtMatch
        ? launchOverride?.utContext?.subMode === 'rivals'
          ? 'DIVISION RIVALS'
          : launchOverride?.utContext?.subMode === 'draft'
          ? 'FUT DRAFT CUP'
          : 'ULTIMATE TEAM'
        : cupRoundLabel,
      leagueRound: isUtMatch ? undefined : leagueRound,
      isRoadTo38: isUtMatch ? false : roadTo38,
      isFinale38: isUtMatch ? false : finale38,
      isFinalMatch: isUtMatch ? false : finalMatch,
      willHomeWinLeague: (homeGoals, awayGoals) =>
        isUtMatch
          ? false
          : wouldHomeWinLeagueAfterMatch({
              standings: activeLeagueStandings,
              homeTeamId: userTeam.id,
              awayTeamId: opp.id,
              homeScore: homeGoals,
              awayScore: awayGoals,
              leagueRound,
            }),
      isSingleplayerTour: isUtMatch ? false : isSingleplayerTour,
      isRivalry: isUtMatch ? false : Boolean(rivalry),
      rivalryId: isUtMatch ? null : rivalry?.id ?? null,
      rivalryTitle: isUtMatch ? null : rivalry?.title ?? null,
      difficulty,
      matchHalfSeconds,
      matchSeed: launchSeed,
      matchDateLabel: dtInfo.dateLabel,
      matchTimeLabel: dtInfo.timeLabel,
      initialFormation: activeFormation,
      initialTactic: selectedTactic,
      initialLineup: activeLineup,
      initialBench: homeBench,
      stadium: matchStadium,
      lighting: activeLighting,
      homeTeam: activeHomeTeam,
      awayTeam: activeAwayTeam,
      allTeams: ALL_TEAMS,
      isKnockout: isUtMatch ? false : isSingleplayerTour || compInfo.isKnockout,
      isUltimateTeam: isUtMatch,
      utSubMode: launchOverride?.utContext?.subMode,
      utDivision: launchOverride?.utContext?.division,
      onHudUpdate: (snapshot) => setHud(snapshot),
      onMatchEnd: handleMatchFinished,
    });
    engineRef.current = engine;

    let rafId = 0;
    let timeoutId = 0;
    let last = performance.now();
    let cancelled = false;

    const tick = (now: number) => {
      if (cancelled) return;
      const frameStart = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      engine.step(dt);
      const frameCost = performance.now() - frameStart;
      if (frameCost > 22) {
        // Software-rendered Canvas2D fallback: yield briefly so input & compositor frames stay responsive
        timeoutId = window.setTimeout(() => {
          if (!cancelled) rafId = requestAnimationFrame(tick);
        }, 16);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      engineRef.current = null;
    };
    // Only re-create match engine when matchKey changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchKey]);

  // Global keyboard shortcuts & focus-loss hygiene
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (utOpen) {
        if (e.code === 'Escape') setUtOpen(false);
        return;
      }

      if (tournamentOpen) {
        if (e.code === 'Escape') setTournamentOpen(false);
        return;
      }

      if (introActive) {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
          e.preventDefault();
          setIntroActive(false);
        }
        return;
      }

      if (gameStateRef.current === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startMatch();
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameStateRef.current === 'playing' || gameStateRef.current === 'paused') {
          e.preventDefault();
          handlePause();
          return;
        }
      }

      if (e.code === 'KeyM') {
        handleToggleMute();
        return;
      }

      if (gameStateRef.current === 'playing') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
        engineRef.current?.handleKeyDown(e.code);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      engineRef.current?.handleKeyUp(e.code);
    };

    const onBlur = () => {
      engineRef.current?.clearInputs();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onBlur);
    };
  }, [utOpen, tournamentOpen, introActive, startMatch, handlePause, handleToggleMute]);

  const handleTouchInput = useCallback((next: TouchInputState) => {
    engineRef.current?.updateTouchInput(next);
  }, []);

  const isInMatch = gameState === 'playing' || gameState === 'paused' || gameState === 'gameover';
  const cutscenePhase = hud?.cutscenePhase ?? null;

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden">
      {gameState === 'title' && (
        <TitleScreen
          selectedCompetition={selectedCompetition}
          onSelectCompetition={(id) => {
            soundEngine.playMenuBlip();
            setIsSingleplayerTour(false);
            setSelectedCompetition(id);
          }}
          currentLeagueRound={currentLeagueRound}
          isSingleplayerTour={isSingleplayerTour}
          difficulty={difficulty}
          onChangeDifficulty={(nextDiff) => {
            soundEngine.playMenuBlip();
            setDifficulty(nextDiff);
          }}
          matchHalfSeconds={matchHalfSeconds}
          onChangeMatchHalfSeconds={(nextSec) => {
            soundEngine.playMenuBlip();
            setMatchHalfSeconds(clampMatchHalfSeconds(nextSec));
          }}
          userTeam={userTeam}
          opponentTeam={activeOpponent}
          rivalryTitle={activeRivalry?.title ?? null}
          stadiumName={activeStadium.name}
          matchDateLabel={activeDateTime.dateLabel}
          matchTimeLabel={activeDateTime.timeLabel}
          activeCupStageLabel={activeCupStageLabel}
          onOpenTournament={(tab = 'teams') => {
            soundEngine.playMenuBlip();
            setTournamentTab(tab);
            setTournamentOpen(true);
          }}
          onJumpCupRound={handleJumpCupRound}
          onWatchIntro={() => {
            soundEngine.playMenuBlip();
            setIntroActive(true);
          }}
          onLaunchClasico={handleLaunchClasico}
          onOpenUltimateTeam={() => {
            soundEngine.playMenuBlip();
            setUtOpen(true);
          }}
          utCoins={utState.coins}
          unopenedPacksCount={utState.unopenedPacks.length}
          onStartMatch={() => startMatch()}
          muted={muted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Optional 20-Second 3D Tournament & Stadium Intro Cutscene from Title Screen */}
      {gameState === 'title' && introActive && (
        <div
          data-testid="intro-3d-overlay"
          className="fixed inset-0 z-30 bg-black flex items-center justify-center"
        >
          <Cutscene3DStage
            mode="intro"
            competitionId={selectedCompetition}
            homeTeam={userTeam}
            awayTeam={activeOpponent}
            progress={1 - introRemaining / INTRO_3D_DURATION_SEC}
          />
          <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-40 bg-[#060918]/95 border-4 border-yellow-400 shadow-[0_6px_0_#000] px-4 py-3 max-w-xl w-[92%] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="font-pixel text-[10px] text-yellow-300">
                20S 3D TOURNAMENT INTRO · {introRemaining}S
              </div>
              <div className="font-pixel-body text-lg text-white" dir="auto">
                {userTeam.name} vs {activeOpponent.name} · {activeStadium.name}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="skip-intro-btn"
                onClick={() => setIntroActive(false)}
                className="pixel-btn bg-slate-700 hover:bg-slate-600 text-white font-pixel text-[9px] px-3 py-2"
              >
                SKIP [SPACE]
              </button>
              <button
                type="button"
                onClick={() => startMatch()}
                className="pixel-btn bg-emerald-500 hover:bg-emerald-400 text-black font-pixel text-[9px] px-3 py-2"
              >
                KICK OFF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Viewport (3x high-DPI for crisp 8-bit pitch + smooth unpixelated LED competition logos & planets) */}
      {isInMatch && (
        <div className="relative w-full h-full flex items-center justify-center bg-[#040713]">
          <canvas
            ref={canvasRef}
            width={VIRTUAL_WIDTH * 3}
            height={VIRTUAL_HEIGHT * 3}
            data-testid="soccer-pitch-canvas"
            className="w-full h-full object-contain block"
          />

          {/* 3D Cutscene Overlay Stage (Tunnel, Goal 3D, or Trophy inside center-pitch between 2D LEDs) */}
          {cutscenePhase === 'TROPHY_CELEBRATION' && hud && (
            <div className="fixed inset-x-0 top-[23.5%] bottom-[12%] z-10 pointer-events-none">
              <Cutscene3DStage
                mode="trophy"
                phase={cutscenePhase}
                competitionId={hud.competitionId}
                homeTeam={hud.homeTeam}
                awayTeam={hud.awayTeam}
                championTeam={hud.championTeam}
                progress={hud.cutsceneProgress}
              />
            </div>
          )}

          {(cutscenePhase === 'PRE_KICKOFF' ||
            cutscenePhase === 'HALFTIME' ||
            cutscenePhase === 'FULLTIME') &&
            hud && (
              <div className="fixed inset-0 z-10 pointer-events-none">
                <Cutscene3DStage
                  mode="tunnel"
                  phase={cutscenePhase}
                  competitionId={hud.competitionId}
                  homeTeam={hud.homeTeam}
                  awayTeam={hud.awayTeam}
                  progress={hud.cutsceneProgress}
                />
              </div>
            )}

          {cutscenePhase === 'GOAL_CELEBRATION_3D' && hud && (
            <div className="fixed inset-0 z-10 pointer-events-none">
              <Cutscene3DStage
                mode="goal"
                phase={cutscenePhase}
                competitionId={hud.competitionId}
                homeTeam={hud.homeTeam}
                awayTeam={hud.awayTeam}
                goalScoringTeam={
                  hud.goalScoringTeam === 'away' ? hud.awayTeam : hud.homeTeam
                }
                progress={hud.cutsceneProgress}
              />
            </div>
          )}
        </div>
      )}

      {/* World-Matched Top Scoreboard & Mobile Controls */}
      {isInMatch && hud && (
        <ScoreboardHUD
          hud={hud}
          muted={muted}
          showTouchControls={showTouchControls}
          onToggleMute={handleToggleMute}
          onToggleTouchControls={() => setShowTouchControls((v) => !v)}
          onPause={handlePause}
          onOpenSubs={() => {
            if (gameStateRef.current === 'playing') {
              handlePause();
            }
          }}
          onSkipReplay={() => engineRef.current?.skipReplay()}
          onSkipCutscene={() => engineRef.current?.skipCutscene()}
          onSubmitPenaltyDirection={(dir) => engineRef.current?.submitPenaltyDirection(dir)}
          onTouchInputChange={handleTouchInput}
        />
      )}

      {/* Pause (with Live Tactics & Subs) / Full-Time Modal */}
      {(gameState === 'paused' || gameState === 'gameover') && (
        <MatchModal
          mode={gameState}
          result={matchResult}
          hud={hud}
          onChangeFormationTactic={handleChangeFormationAndTactic}
          onSubstitutePlayer={handleSubstitutePlayer}
          onResume={handlePause}
          onRestart={() => {
            if (matchResult?.isUltimateTeam && matchResult.utContext) {
              handleLaunchUtMatch(matchResult.utContext.subMode);
            } else {
              startMatch();
            }
          }}
          onReturnTitle={handleReturnTitle}
        />
      )}

      {utOpen && (
        <UltimateTeamModal
          isOpen={utOpen}
          utState={utState}
          onUpdateUtState={setUtState}
          onLaunchUtMatch={handleLaunchUtMatch}
          onClose={() => setUtOpen(false)}
        />
      )}

      {/* 42 Clubs, Tactics/Subs, Fixtures, Standings, Groups/Brackets, Leaderboards & 16 Stadiums Modal */}
      {tournamentOpen && (
        <TournamentModal
          isOpen={tournamentOpen}
          initialTab={tournamentTab}
          onClose={() => setTournamentOpen(false)}
          selectedCompetition={selectedCompetition}
          onSelectCompetition={(id) => {
            soundEngine.playMenuBlip();
            setSelectedCompetition(id);
          }}
          isSingleplayerTour={isSingleplayerTour}
          onToggleSingleplayerTour={(enabled) => {
            soundEngine.playMenuBlip();
            setIsSingleplayerTour(enabled);
          }}
          difficulty={difficulty}
          onChangeDifficulty={(nextDiff) => {
            soundEngine.playMenuBlip();
            setDifficulty(nextDiff);
          }}
          matchHalfSeconds={matchHalfSeconds}
          onChangeMatchHalfSeconds={(nextSec) => {
            soundEngine.playMenuBlip();
            setMatchHalfSeconds(clampMatchHalfSeconds(nextSec));
          }}
          isFinalStage={isCurrentlyInFinalStage}
          userTeamId={userTeam.id}
          opponentTeamId={opponentTeam.id}
          onSelectUserTeam={handleSelectUserTeam}
          onSelectOpponentTeam={(id) => {
            soundEngine.playMenuBlip();
            setUseCustomLeagueOpponent(true);
            setOpponentTeamId(id);
          }}
          onSelectRivalryMatch={handleSelectRivalryMatch}
          selectedStadiumId={selectedStadiumId}
          onSelectStadium={(id) => {
            soundEngine.playMenuBlip();
            setSelectedStadiumId(id);
          }}
          selectedLightingId={selectedLightingId}
          onSelectLighting={(id) => {
            soundEngine.playMenuBlip();
            setSelectedLightingId(id);
          }}
          selectedFormation={selectedFormation}
          selectedTactic={selectedTactic}
          homeLineup={homeLineup}
          homeBench={homeBench}
          onChangeFormation={handleChangeFormation}
          onChangeTactic={handleChangeTactic}
          onSubstitutePlayer={handleSubstitutePlayer}
          standings={standings}
          expansionStandings={expansionStandings}
          premierFixtures={premierFixtures}
          expansionFixtures={expansionFixtures}
          currentLeagueRound={currentLeagueRound}
          onSelectLeagueRound={(round) => {
            soundEngine.playMenuBlip();
            setSelectedCompetition('league');
            setIsSingleplayerTour(false);
            setUseCustomLeagueOpponent(false);
            setCurrentLeagueRound(round);
          }}
          onSimulateLeagueRound={handleSimulateLeagueRound}
          onSimulateToLeagueRound={handleSimulateToLeagueRound}
          onJumpCupRound={handleJumpCupRound}
          brackets={brackets}
          globalRankings={globalRankings}
          playerCareerStats={playerCareerStats}
          onResetSeason={handleResetSeason}
          onStartMatch={() => startMatch()}
        />
      )}
    </main>
  );
}
