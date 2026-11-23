export type CompetitionId = 'league' | 'king_cup' | 'super_cup' | 'anime_cup';

export type GameScreenState = 'title' | 'playing' | 'paused' | 'gameover';

export type TeamSide = 'home' | 'away';

export type PlayerRole = 'GK' | 'DEF' | 'MID' | 'FWD';

export type CrestPattern =
  | 'diamond'
  | 'star'
  | 'crown'
  | 'bolt'
  | 'shield'
  | 'stripes'
  | 'flame'
  | 'crystal'
  | 'wings'
  | 'target'
  | 'crescent'
  | 'orbit';

export type LightingPresetId =
  | 'night_flood'
  | 'golden_sunset'
  | 'daylight'
  | 'neon_cosmic'
  | 'storm_dusk';

export interface StadiumTheme {
  id: string;
  name: string;
  city: string;
  cityDisplay: string;
  skyColor: string;
  roofColor: string;
  standColor: string;
  standStripeColor: string;
  turfA: string;
  turfB: string;
  surroundColor: string;
  floodlightColor: string;
  turfPattern: 'vertical' | 'horizontal' | 'checker';
  imageUrl?: string;
  trackColor?: string;
  archRoofStyle?: 'white_canopy' | 'lattice_arch' | 'track_dome' | 'gold_bowl' | 'efootball_blocks';
}

export type FormationId =
  | '4-3-3'
  | '4-4-2'
  | '3-5-2'
  | '4-2-3-1'
  | '2-2-2'
  | '3-2-1'
  | '1-3-2'
  | '2-1-3';
export type TacticId = 'balanced' | 'all_out_attack' | 'high_press' | 'counter_attack' | 'park_the_bus';
export type PenaltyDirection = 'left' | 'middle' | 'right';
export type GameDifficulty = 'easy' | 'normal' | 'hard' | 'legendary';
export type CameraAngleId =
  | 'tele_broadcast'
  | 'tactical_wide'
  | 'pro_dynamic'
  | 'end_to_end'
  | 'pitchside_low';

export interface BenchSlotSpec {
  slotIndex: number;
  number: number;
  positionLabel: string;
  name: string;
  role: PlayerRole;
  aiPolicy: 'GK' | 'SWEEPER' | 'PLAYMAKER' | 'STRIKER';
}

export interface LightingPreset {
  id: LightingPresetId;
  name: string;
  ambientTint: string;
  floodBeamAlpha: number;
  skyTint: string;
}

export interface SquadSlotSpec {
  slotIndex: number;
  number: number;
  positionLabel: string;
  name: string;
  role: PlayerRole;
  aiPolicy: 'GK' | 'SWEEPER' | 'PLAYMAKER' | 'STRIKER';
  isCaptain: boolean;
  rx: number;
  ry: number;
}

export interface Team {
  id: string;
  name: string;
  shortCode: string;
  division: 'premier' | 'expansion';
  primaryColor: string;
  secondaryColor: string;
  trimColor: string;
  crest: CrestPattern;
  attack: number;
  defense: number;
  speed: number;
  homeStadiumId?: string;
}

export interface RivalryDefinition {
  id: string;
  title: string;
  teamAId: string;
  teamBId: string;
  stadiumId: string;
}

export interface CompetitionInfo {
  id: CompetitionId;
  title: string;
  season: string;
  subtitle: string;
  formatLabel: string;
  teamCount: number;
  accentColor: string;
  badgeTextColor: string;
  isKnockout: boolean;
}

export interface LeagueStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface LeagueFixtureNode {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  dateLabel?: string;
  timeLabel?: string;
}

export interface LeagueRoundSchedule {
  round: number;
  dateLabel?: string;
  timeLabel?: string;
  matches: LeagueFixtureNode[];
}

export interface CupMatchNode {
  id: string;
  roundIndex: number;
  roundName: string;
  groupName?: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
  played: boolean;
  dateLabel?: string;
  timeLabel?: string;
}

export interface GroupTableRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface CupGroupState {
  groupName: string;
  teamIds: string[];
  standings: GroupTableRow[];
  matches: CupMatchNode[];
}

export interface CupBracketState {
  competitionId: Exclude<CompetitionId, 'league'> | 'singleplayer';
  stageMode?: 'group' | 'knockout';
  groups?: CupGroupState[];
  matches: CupMatchNode[];
  championId: string | null;
}

export interface PlayerCareerStats {
  playerId: string;
  teamId: string;
  playerName: string;
  number: number;
  positionLabel: string;
  role: PlayerRole;
  isCaptain?: boolean;
  matches: number;
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  tackles: number;
  yellowCards: number;
  redCards: number;
}

export interface GlobalClubRanking {
  teamId: string;
  elo: number;
  wins: number;
  goalsFor: number;
  trophies: number;
}

export type CutscenePhase =
  | 'PRE_KICKOFF'
  | 'HALFTIME'
  | 'FULLTIME'
  | 'GOAL_CELEBRATION_3D'
  | 'TROPHY_CELEBRATION';

export type SetPieceType =
  | 'NONE'
  | 'PRE_KICKOFF'
  | 'KICKOFF'
  | 'THROW_IN'
  | 'GOAL_KICK'
  | 'CORNER_KICK'
  | 'FREE_KICK'
  | 'PENALTY'
  | 'PENALTY_SHOOTOUT'
  | 'GOAL'
  | 'GOAL_CELEBRATION_3D'
  | 'REPLAY'
  | 'HALFTIME'
  | 'FULLTIME'
  | 'TROPHY_CELEBRATION';

export type CardType = 'YELLOW' | 'RED';

export interface CardEvent {
  team: TeamSide;
  playerNumber: number;
  card: CardType;
  minute: number;
}

export interface GoalEvent {
  team: TeamSide;
  playerNumber: number;
  playerName: string;
  minute: number;
}

export interface LiveTickerFixture {
  homeCode: string;
  awayCode: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  isRivalry?: boolean;
}

export interface MatchStats {
  homeShots: number;
  awayShots: number;
  homePasses: number;
  awayPasses: number;
  homeTackles: number;
  awayTackles: number;
  homeFouls: number;
  awayFouls: number;
  homeYellows: number;
  awayYellows: number;
  homeReds: number;
  awayReds: number;
  homePossessionTicks: number;
  awayPossessionTicks: number;
}

export type TeamPlayerSlot = SquadSlotSpec;

export interface ShootoutPromptState {
  awaitingInput: boolean;
  phase: 'kick' | 'save';
  round: number;
  chosenDirection?: PenaltyDirection;
  lastResult?: string;
}

export interface HudPlayerSlotSummary {
  id: string;
  number: number;
  name: string;
  positionLabel: string;
  role: PlayerRole;
  isCaptain: boolean;
}

export interface MatchHudSnapshot {
  competitionId: CompetitionId;
  cupRoundLabel?: string;
  leagueRound?: number;
  isRoadTo38: boolean;
  isFinale38: boolean;
  isGroupStage: boolean;
  matchDateLabel: string;
  matchTimeLabel: string;
  isSingleplayerTour: boolean;
  isUltimateTeam?: boolean;
  utSubMode?: 'squad' | 'draft' | 'rivals';
  utDivision?: number;
  isRivalry: boolean;
  rivalryId?: string | null;
  rivalryTitle: string | null;
  stadiumName: string;
  difficulty?: GameDifficulty;
  matchHalfSeconds?: number;
  cameraAngle?: CameraAngleId;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  clockSeconds: number;
  half: 1 | 2 | 3 | 4 | 5;
  extraTimeActive: boolean;
  setPiece: SetPieceType;
  setPieceTeam: TeamSide;
  cutscenePhase: CutscenePhase | null;
  cutsceneProgress: number;
  cutsceneRemainingSec: number;
  championTeam: Team | null;
  trophyTitle: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerTone: 'neutral' | 'goal' | 'yellow' | 'red' | 'setpiece';
  goalAnimationActive: boolean;
  goalAnimationTimer: number;
  goalScoringTeam: TeamSide | null;
  goalScorerName: string;
  replayActive: boolean;
  replayProgress: number;
  shotCharge: number;
  playerHasBall: boolean;
  intensity: number;
  chantText: string;
  shootoutHome: ('G' | 'M' | 'P')[];
  shootoutAway: ('G' | 'M' | 'P')[];
  shootoutPrompt: ShootoutPromptState | null;
  homeFormation: FormationId;
  homeTactic: TacticId;
  homeLineupPlayers: HudPlayerSlotSummary[];
  homeBench: BenchSlotSpec[];
  stats: MatchStats;
  cards: CardEvent[];
  goalLog: GoalEvent[];
  liveTicker: LiveTickerFixture[];
}

export interface MatchResultSummary {
  competitionId: CompetitionId;
  leagueRound?: number;
  wonTrophy?: boolean;
  isSingleplayerTour: boolean;
  isUltimateTeam?: boolean;
  utContext?: {
    subMode: 'squad' | 'draft' | 'rivals';
    division?: number;
    coinsEarned?: number;
    pointsEarned?: number;
    promotedToDivision?: number | null;
    packEarnedName?: string | null;
  };
  isRivalry: boolean;
  rivalryId?: string | null;
  rivalryTitle: string | null;
  stadiumName?: string;
  difficulty?: GameDifficulty;
  matchHalfSeconds?: number;
  dateLabel?: string;
  timeLabel?: string;
  extraTimePlayed?: boolean;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  shootoutWinner: TeamSide | null;
  shootoutHomeGoals: number;
  shootoutAwayGoals: number;
  shootoutHome?: ('G' | 'M' | 'P')[];
  shootoutAway?: ('G' | 'M' | 'P')[];
  stats: MatchStats;
  cards: CardEvent[];
  goalLog: GoalEvent[];
  playerContributions: {
    team: TeamSide;
    number: number;
    goals: number;
    assists: number;
    shots: number;
    passes: number;
    tackles: number;
    yellows: number;
    reds: number;
  }[];
}

export interface PlayerEntity {
  id: string;
  team: TeamSide;
  number: number;
  name: string;
  positionLabel: string;
  isCaptain: boolean;
  role: PlayerRole;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  facingX: number;
  facingY: number;
  stamina: number;
  yellowCards: number;
  redCarded: boolean;
  tackleCooldown: number;
  tackleTimer: number;
  stunTimer: number;
  animDist: number;
  hitFlash: number;
  aiPolicy: 'GK' | 'SWEEPER' | 'PLAYMAKER' | 'STRIKER';
}

export interface BallEntity {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spin: number;
  ownerId: string | null;
  lastTouchTeam: TeamSide;
  lastTouchPlayerId: string | null;
  previousTouchPlayerId: string | null;
  pickupLockTimer: number;
  trail: { x: number; y: number; z: number }[];
}

export interface OutOfBoundsDecision {
  kind: 'GOAL' | 'GOAL_KICK' | 'CORNER_KICK' | 'THROW_IN';
  awardedTo: TeamSide;
  spotX: number;
  spotY: number;
}

export interface FoulDecision {
  foul: boolean;
  card: CardType | null;
  secondYellowRed: boolean;
  isPenalty: boolean;
  spotX: number;
  spotY: number;
}

export interface TouchInputState {
  moveX: number;
  moveY: number;
  sprint: boolean;
  passJustPressed: boolean;
  loftPassJustPressed: boolean;
  throughPassJustPressed: boolean;
  loftThroughPassJustPressed: boolean;
  shootHeld: boolean;
  shootJustPressed: boolean;
  shootJustReleased: boolean;
}
