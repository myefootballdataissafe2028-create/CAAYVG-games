import { soundEngine } from './audio';
import { getTeamBench, getTeamLineup } from './data';
import {
  BRAND_AD_CYCLE_SECONDS,
  PITCH,
  clampMatchHalfSeconds,
  classifyOutOfBounds,
  computeAiPressSpeed,
  computeMatchIntensity,
  computePassVelocity,
  evaluateTackle,
  getBrandAd12sPhase,
  getDifficultyConfig,
  getExtraTimeHalfSeconds,
  getFormationLineupWithTactics,
  getMiddleLedPhase,
  getTrophyTitle,
  isTackleHitPlayerFirst,
  resolveShootoutState,
  selectPassRecipient,
  steerPassBallTowardTarget,
  swapLineupBenchSlot,
} from './rules';
import { StadiumRenderer, type Particle } from './stadiumRenderer';
import type {
  BallEntity,
  BenchSlotSpec,
  CardEvent,
  CompetitionId,
  CutscenePhase,
  FormationId,
  GameDifficulty,
  GoalEvent,
  LightingPreset,
  LiveTickerFixture,
  MatchHudSnapshot,
  MatchResultSummary,
  MatchStats,
  PenaltyDirection,
  PlayerEntity,
  SetPieceType,
  ShootoutPromptState,
  StadiumTheme,
  TacticId,
  Team,
  TeamPlayerSlot,
  TeamSide,
  TouchInputState,
} from './types';

const MAX_REPLAY_FRAMES = 175;

interface ReplayFrame {
  ballX: number;
  ballY: number;
  ballZ: number;
  ballSpin: number;
  players: {
    id: string;
    x: number;
    y: number;
    facingX: number;
    facingY: number;
    animDist: number;
    tackleTimer: number;
    redCarded: boolean;
  }[];
  refX: number;
  refY: number;
}

export class MatchEngine {
  private renderer = new StadiumRenderer();
  private displayCanvas: HTMLCanvasElement;
  private competitionId: CompetitionId;
  private cupRoundLabel?: string;
  private leagueRound?: number;
  private isRoadTo38: boolean;
  private isFinale38: boolean;
  private isFinalMatch: boolean;
  private willHomeWinLeague?: (homeScore: number, awayScore: number) => boolean;
  private isSingleplayerTour: boolean;
  private isRivalry: boolean;
  private rivalryId: string | null;
  private rivalryTitle: string | null;
  private difficulty: GameDifficulty;
  private matchHalfSeconds: number;
  private extraTimeHalfSec: number;
  private matchSeed: number;
  private matchDateLabel?: string;
  private matchTimeLabel?: string;
  private stadium: StadiumTheme;
  private lighting: LightingPreset;
  private homeTeam: Team;
  private awayTeam: Team;
  private isKnockout: boolean;
  private isUltimateTeam: boolean;
  private utSubMode?: 'squad' | 'draft' | 'rivals';
  private utDivision?: number;

  private homeFormation: FormationId = '4-3-3';
  private homeTactic: TacticId = 'balanced';
  private homeLineupSlots: TeamPlayerSlot[] = [];
  private homeBench: BenchSlotSpec[] = [];

  private players: PlayerEntity[] = [];
  private activeHomePlayerId = 'home-s10-10';
  private ball: BallEntity;
  private referee = {
    x: PITCH.centerX,
    y: PITCH.centerY - 38,
    cardShown: null as 'YELLOW' | 'RED' | null,
    cardTimer: 0,
  };

  private homeScore = 0;
  private awayScore = 0;
  private half: 1 | 2 | 3 | 4 | 5 = 1;
  private halfElapsed = 0;
  private extraTimePlayed = false;
  private totalTime = 0;
  private paused = false;
  private finished = false;

  private setPiece: SetPieceType = 'KICKOFF';
  private setPieceTeam: TeamSide = 'home';
  private setPieceTimer = 0.9;
  private setPieceSpotX = PITCH.centerX;
  private setPieceSpotY = PITCH.centerY;
  private setPieceAimAngle = 0;
  private setPieceTakerId: string | null = null;

  private bannerTitle = 'KICK OFF!';
  private bannerSubtitle = 'PASS · DRIBBLE · SHOOT';
  private bannerTone: MatchHudSnapshot['bannerTone'] = 'setpiece';
  private bannerTimer = 1.8;

  private shotCharge = 0;
  private chargingShot = false;
  private passTargetPlayerId: string | null = null;
  private passTargetTimer = 0;
  private ballKickMode: 'loose' | 'pass' | 'shot' = 'loose';

  private shootoutHome: ('G' | 'M' | 'P')[] = [];
  private shootoutAway: ('G' | 'M' | 'P')[] = [];
  private shootoutTurn: TeamSide = 'home';
  private shootoutRound = 0;
  private shootoutKickInFlight = false;
  private shootoutResolveTimer = 0;
  private shootoutPrompt: ShootoutPromptState | null = null;
  private shootoutGkTargetY = PITCH.centerY;
  private shootoutShotTargetY = PITCH.centerY;

  private hitstop = 0;
  private trauma = 0;
  private goalNetRippleLeft = 0;
  private goalNetRippleRight = 0;
  private celebrationBoost = 0;
  private recentIntensityBurst = 0;
  private chantCooldown = 3.5;

  private particles: Particle[] = Array.from({ length: 128 }, () => ({
    active: false,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    maxLife: 1,
    color: '#ffffff',
    size: 2,
  }));
  private particleCursor = 0;

  private stats: MatchStats = {
    homeShots: 0,
    awayShots: 0,
    homePasses: 0,
    awayPasses: 0,
    homeTackles: 0,
    awayTackles: 0,
    homeFouls: 0,
    awayFouls: 0,
    homeYellows: 0,
    awayYellows: 0,
    homeReds: 0,
    awayReds: 0,
    homePossessionTicks: 0,
    awayPossessionTicks: 0,
  };
  private cards: CardEvent[] = [];
  private goalLog: GoalEvent[] = [];
  private playerStatMap = new Map<
    string,
    { team: TeamSide; number: number; goals: number; assists: number; shots: number; passes: number; tackles: number; yellows: number; reds: number }
  >();
  private liveTicker: LiveTickerFixture[] = [];
  private nextTickerUpdate = 4.5;

  // V3 Goal Scorebug & Instant Replay state
  private goalAnimationTimer = 0;
  private goalScoringTeam: TeamSide | null = null;
  private goalScorerName = '';
  private replayBuffer: ReplayFrame[] = [];
  private replayPlaybackFrames: ReplayFrame[] = [];
  private replayCursor = 0;
  private replayConcededTeam: TeamSide = 'away';
  private ledTime = 0;
  private lastDatasetLedPhase = '';
  private lastDatasetBrandAdPhase = '';
  private lastDatasetBrandAdIndex = -1;
  private lastDatasetCutscene = '';

  // Match Cutscenes & Trophy Celebration state
  private cutsceneDuration = 0;
  private championTeam: Team | null = null;
  private trophyTitle = '';
  private confettiCooldown = 0;
  private pendingShootoutResult: {
    winner: TeamSide | null;
    homeGoals: number;
    awayGoals: number;
  } | null = null;

  private keysHeld = new Set<string>();
  private passJustPressed = false;
  private loftPassJustPressed = false;
  private shootJustPressed = false;
  private shootJustReleased = false;
  private prevTouchPass = false;
  private prevTouchLoftPass = false;
  private prevTouchShoot = false;
  private touchInput: TouchInputState = {
    moveX: 0,
    moveY: 0,
    sprint: false,
    passJustPressed: false,
    loftPassJustPressed: false,
    shootHeld: false,
    shootJustPressed: false,
    shootJustReleased: false,
  };

  private lastHudPush = 0;
  private onHudUpdate: (hud: MatchHudSnapshot) => void;
  private onMatchEnd: (summary: MatchResultSummary) => void;

  constructor(params: {
    canvas: HTMLCanvasElement;
    competitionId: CompetitionId;
    cupRoundLabel?: string;
    leagueRound?: number;
    isRoadTo38?: boolean;
    isFinale38?: boolean;
    isFinalMatch?: boolean;
    willHomeWinLeague?: (homeScore: number, awayScore: number) => boolean;
    isSingleplayerTour: boolean;
    isRivalry: boolean;
    rivalryId?: string | null;
    rivalryTitle: string | null;
    difficulty?: GameDifficulty;
    matchHalfSeconds?: number;
    matchSeed?: number;
    matchDateLabel?: string;
    matchTimeLabel?: string;
    initialFormation?: FormationId;
    initialTactic?: TacticId;
    initialLineup?: TeamPlayerSlot[];
    initialBench?: BenchSlotSpec[];
    stadium: StadiumTheme;
    lighting: LightingPreset;
    homeTeam: Team;
    awayTeam: Team;
    allTeams: Team[];
    isKnockout: boolean;
    isUltimateTeam?: boolean;
    utSubMode?: 'squad' | 'draft' | 'rivals';
    utDivision?: number;
    onHudUpdate: (hud: MatchHudSnapshot) => void;
    onMatchEnd: (summary: MatchResultSummary) => void;
  }) {
    this.displayCanvas = params.canvas;
    this.competitionId = params.competitionId;
    this.cupRoundLabel = params.cupRoundLabel;
    this.leagueRound = params.leagueRound;
    this.isRoadTo38 = Boolean(params.isRoadTo38);
    this.isFinale38 = Boolean(params.isFinale38);
    this.isFinalMatch = Boolean(params.isFinalMatch);
    this.willHomeWinLeague = params.willHomeWinLeague;
    this.isSingleplayerTour = params.isSingleplayerTour;
    this.isRivalry = params.isRivalry;
    this.rivalryId = params.rivalryId ?? null;
    this.rivalryTitle = params.rivalryTitle;
    this.difficulty = params.difficulty ?? 'normal';
    this.matchHalfSeconds = clampMatchHalfSeconds(params.matchHalfSeconds);
    this.extraTimeHalfSec = getExtraTimeHalfSeconds(this.matchHalfSeconds);
    this.matchSeed = params.matchSeed ?? Math.floor(Date.now() % 1000000);
    this.matchDateLabel = params.matchDateLabel;
    this.matchTimeLabel = params.matchTimeLabel;
    this.stadium = params.stadium;
    this.lighting = params.lighting;
    this.homeTeam = params.homeTeam;
    this.awayTeam = params.awayTeam;
    this.isKnockout = params.isKnockout;
    this.isUltimateTeam = Boolean(params.isUltimateTeam);
    this.utSubMode = params.utSubMode;
    this.utDivision = params.utDivision;
    this.onHudUpdate = params.onHudUpdate;
    this.onMatchEnd = params.onMatchEnd;

    this.homeFormation = params.initialFormation ?? '4-3-3';
    this.homeTactic = params.initialTactic ?? 'balanced';
    this.homeLineupSlots = params.initialLineup
      ? params.initialLineup.map((s) => ({ ...s }))
      : getFormationLineupWithTactics(
          this.homeTeam,
          this.homeFormation,
          this.homeTactic
        );
    this.homeBench = params.initialBench
      ? params.initialBench.map((b) => ({ ...b }))
      : getTeamBench(this.homeTeam);

    this.displayCanvas.dataset.roadTo38 = String(this.isRoadTo38);
    this.displayCanvas.dataset.finale38 = String(this.isFinale38);
    this.displayCanvas.dataset.difficulty = this.difficulty;
    this.displayCanvas.dataset.halfSeconds = String(this.matchHalfSeconds);
    this.displayCanvas.dataset.stadiumId = this.stadium.id;
    this.displayCanvas.dataset.rivalryId = this.rivalryId ?? '';

    this.ball = {
      x: PITCH.centerX,
      y: PITCH.centerY,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      spin: 0,
      ownerId: null,
      lastTouchTeam: 'home',
      lastTouchPlayerId: null,
      previousTouchPlayerId: null,
      pickupLockTimer: 0,
      trail: [],
    };

    this.initLiveTicker(params.allTeams);
    this.spawnTeams();
    this.startPreKickoffCutscene();
    this.pushHud(true);
  }

  private initLiveTicker(allTeams: Team[]) {
    const others = allTeams.filter((t) => t.id !== this.homeTeam.id && t.id !== this.awayTeam.id);
    this.liveTicker = [];
    for (let i = 0; i + 1 < Math.min(others.length, 6); i += 2) {
      this.liveTicker.push({
        homeCode: others[i].shortCode,
        awayCode: others[i + 1].shortCode,
        homeScore: 0,
        awayScore: 0,
        minute: 1,
        isRivalry: false,
      });
    }
  }

  private advanceLiveTicker(currentMinute: number) {
    for (const fix of this.liveTicker) {
      fix.minute = Math.max(1, currentMinute);
      const roll = Math.random();
      if (roll < 0.24) fix.homeScore += 1;
      else if (roll < 0.45) fix.awayScore += 1;
    }
  }

  public setPaused(p: boolean) {
    this.paused = p;
    if (p) {
      this.keysHeld.clear();
      this.chargingShot = false;
      this.shotCharge = 0;
    }
  }

  public isInReplay(): boolean {
    return this.setPiece === 'REPLAY';
  }

  public setFormationAndTactics(formation: FormationId, tactic: TacticId) {
    this.homeFormation = formation;
    this.homeTactic = tactic;
    this.homeLineupSlots = getFormationLineupWithTactics(
      this.homeTeam,
      formation,
      tactic,
      this.homeLineupSlots
    );
    const pitchW = PITCH.right - PITCH.left;
    const pitchHalfH = (PITCH.bottom - PITCH.top) / 2;
    const homePlayers = this.players.filter((p) => p.team === 'home');
    homePlayers.forEach((p, idx) => {
      const slot = this.homeLineupSlots[idx];
      if (!slot) return;
      p.role = slot.role;
      p.positionLabel = slot.positionLabel;
      p.aiPolicy = slot.aiPolicy;
      p.homeX = PITCH.left + slot.rx * pitchW;
      p.homeY = PITCH.centerY + slot.ry * pitchHalfH * 0.88;
    });
    soundEngine.playMenuBlip();
    this.pushHud(true);
  }

  public substitutePlayer(outStarterIdx: number, inBenchIdx: number) {
    const swapped = swapLineupBenchSlot(this.homeLineupSlots, this.homeBench, outStarterIdx, inBenchIdx);
    this.homeLineupSlots = swapped.lineup;
    this.homeBench = swapped.bench;
    const homePlayers = this.players.filter((p) => p.team === 'home');
    const entity = homePlayers[outStarterIdx];
    const newSlot = this.homeLineupSlots[outStarterIdx];
    if (entity && newSlot) {
      entity.name = newSlot.name;
      entity.number = newSlot.number;
      entity.stamina = 100;
      entity.stunTimer = 0;
      entity.hitFlash = 0.25;
      this.getOrCreateContrib(entity);
    }
    soundEngine.playMenuBlip();
    this.pushHud(true);
  }

  public submitPenaltyDirection(dir: PenaltyDirection) {
    if (this.setPiece !== 'PENALTY_SHOOTOUT' || this.shootoutKickInFlight) return;
    if (!this.shootoutPrompt?.awaitingInput) return;

    this.shootoutPrompt = {
      ...this.shootoutPrompt,
      awaitingInput: false,
      chosenDirection: dir,
    };

    const dirToY = (d: PenaltyDirection) =>
      d === 'left'
        ? PITCH.centerY - (PITCH.goalHalfHeight - 5)
        : d === 'right'
        ? PITCH.centerY + (PITCH.goalHalfHeight - 5)
        : PITCH.centerY;
    const allDirs: PenaltyDirection[] = ['left', 'middle', 'right'];

    if (this.shootoutTurn === 'home') {
      this.shootoutShotTargetY = dirToY(dir);
      const diffCfg = getDifficultyConfig(this.difficulty);
      const guessedRight = Math.random() < diffCfg.shootoutAiGuessRate;
      const otherDirs = allDirs.filter((d) => d !== dir);
      const aiGkDir = guessedRight
        ? dir
        : otherDirs[Math.floor(Math.random() * otherDirs.length)];
      this.shootoutGkTargetY = dirToY(aiGkDir);
      this.setPieceAimAngle = Math.atan2(
        this.shootoutShotTargetY - this.ball.y,
        PITCH.right - this.ball.x
      );
      this.launchShootoutKick('home', 0.88);
    } else {
      const aiShotDir = allDirs[Math.floor(Math.random() * allDirs.length)];
      this.shootoutShotTargetY = dirToY(aiShotDir);
      this.shootoutGkTargetY = dirToY(dir);
      this.setPieceAimAngle = Math.atan2(
        this.shootoutShotTargetY - this.ball.y,
        PITCH.right - this.ball.x
      );
      this.launchShootoutKick('away', 0.84);
    }
    this.pushHud(true);
  }

  private getActiveCutscenePhase(): CutscenePhase | null {
    if (
      this.setPiece === 'PRE_KICKOFF' ||
      this.setPiece === 'HALFTIME' ||
      this.setPiece === 'FULLTIME' ||
      this.setPiece === 'GOAL_CELEBRATION_3D' ||
      this.setPiece === 'TROPHY_CELEBRATION'
    ) {
      return this.setPiece;
    }
    return null;
  }

  public skipReplay() {
    if (this.setPiece !== 'REPLAY') return;
    this.replayPlaybackFrames = [];
    this.replayCursor = 0;
    this.setupKickoff(this.replayConcededTeam);
    this.pushHud(true);
  }

  public skipCutscene() {
    if (this.finished) return;
    if (this.setPiece === 'PRE_KICKOFF') {
      this.bannerTitle =
        this.isFinale38
          ? 'THE GRAND FINALE 38!'
          : this.isRivalry && this.rivalryTitle
          ? this.rivalryTitle
          : this.isRoadTo38
          ? 'ROAD TO THE ROUND 38!'
          : 'KICK OFF!';
      this.bannerSubtitle =
        this.isRivalry && this.rivalryTitle
          ? `${this.homeTeam.shortCode} vs ${this.awayTeam.shortCode} · RIVALRY`
          : 'PASS · DRIBBLE · SHOOT';
      this.bannerTone = 'setpiece';
      this.bannerTimer = 1.6;
      soundEngine.playWhistle();
      this.setupKickoff('home');
      this.pushHud(true);
    } else if (this.setPiece === 'HALFTIME') {
      this.half = 2;
      this.halfElapsed = 0;
      this.bannerTitle = '2ND HALF';
      this.bannerSubtitle = 'PLAY ON!';
      this.bannerTone = 'setpiece';
      this.bannerTimer = 1.6;
      this.setupKickoff('away');
      this.pushHud(true);
    } else if (this.setPiece === 'GOAL_CELEBRATION_3D') {
      const concededTeam: TeamSide = this.setPieceTeam === 'home' ? 'away' : 'home';
      if (this.replayBuffer.length >= 24) {
        this.replayPlaybackFrames = [...this.replayBuffer];
        this.replayCursor = 0;
        this.replayConcededTeam = concededTeam;
        this.setPiece = 'REPLAY';
        this.bannerTitle = '';
        this.bannerSubtitle = '';
        this.bannerTimer = 0;
        this.pushHud(true);
      } else {
        this.setupKickoff(concededTeam);
      }
    } else if (this.setPiece === 'FULLTIME') {
      this.completeFulltimeCutscene();
    } else if (this.setPiece === 'TROPHY_CELEBRATION') {
      this.finalizeEndMatch(true);
    }
  }

  public handleKeyDown(code: string) {
    if (this.paused || this.finished) return;
    if (this.getActiveCutscenePhase() !== null) {
      if (code === 'Space' || code === 'Enter' || code === 'KeyK' || code === 'KeyJ') {
        this.skipCutscene();
      }
      return;
    }
    if (this.setPiece === 'PENALTY_SHOOTOUT' && this.shootoutPrompt?.awaitingInput) {
      if (code === 'ArrowLeft' || code === 'KeyA') {
        this.submitPenaltyDirection('left');
      } else if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space' || code === 'Enter' || code === 'KeyK') {
        this.submitPenaltyDirection('middle');
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        this.submitPenaltyDirection('right');
      }
      return;
    }
    if (this.setPiece === 'REPLAY') {
      if (code === 'Space' || code === 'Enter' || code === 'KeyK' || code === 'KeyJ') {
        this.skipReplay();
      }
      return;
    }
    if (!this.keysHeld.has(code)) {
      if (code === 'KeyJ' || code === 'KeyX' || code === 'KeyZ' || code === 'KeyQ') {
        this.passJustPressed = true;
      }
      if (code === 'KeyE' || code === 'KeyL' || code === 'KeyU') {
        this.loftPassJustPressed = true;
      }
      if (code === 'KeyK' || code === 'Space' || code === 'KeyC') {
        this.shootJustPressed = true;
      }
    }
    this.keysHeld.add(code);
  }

  public handleKeyUp(code: string) {
    if (code === 'KeyK' || code === 'Space' || code === 'KeyC') {
      if (this.keysHeld.has(code)) {
        this.shootJustReleased = true;
      }
    }
    this.keysHeld.delete(code);
  }

  public clearInputs() {
    this.keysHeld.clear();
    this.passJustPressed = false;
    this.loftPassJustPressed = false;
    this.shootJustPressed = false;
    this.shootJustReleased = false;
    this.chargingShot = false;
    this.shotCharge = 0;
  }

  public updateTouchInput(input: TouchInputState) {
    if (input.passJustPressed && !this.prevTouchPass) {
      this.passJustPressed = true;
    }
    if (input.loftPassJustPressed && !this.prevTouchLoftPass) {
      this.loftPassJustPressed = true;
    }
    if (input.shootHeld && !this.prevTouchShoot) {
      this.shootJustPressed = true;
    }
    if (!input.shootHeld && this.prevTouchShoot) {
      this.shootJustReleased = true;
    }
    this.prevTouchPass = input.passJustPressed;
    this.prevTouchLoftPass = input.loftPassJustPressed;
    this.prevTouchShoot = input.shootHeld;
    this.touchInput = input;
  }

  private getOrCreateContrib(player: PlayerEntity) {
    let entry = this.playerStatMap.get(player.id);
    if (!entry) {
      entry = {
        team: player.team,
        number: player.number,
        goals: 0,
        assists: 0,
        shots: 0,
        passes: 0,
        tackles: 0,
        yellows: 0,
        reds: 0,
      };
      this.playerStatMap.set(player.id, entry);
    }
    return entry;
  }

  private spawnTeams() {
    this.players = [];
    this.playerStatMap.clear();
    const pitchW = PITCH.right - PITCH.left;
    const pitchHalfH = (PITCH.bottom - PITCH.top) / 2;

    for (const side of ['home', 'away'] as TeamSide[]) {
      const teamObj = side === 'home' ? this.homeTeam : this.awayTeam;
      const lineup = side === 'home' ? this.homeLineupSlots : getTeamLineup(teamObj);
      for (const slot of lineup) {
        const homeX =
          side === 'home'
            ? PITCH.left + slot.rx * pitchW
            : PITCH.right - slot.rx * pitchW;
        const homeY = PITCH.centerY + slot.ry * pitchHalfH * 0.88;
        const entity: PlayerEntity = {
          id: `${side}-s${slot.slotIndex}-${slot.number}`,
          team: side,
          number: slot.number,
          name: slot.name,
          positionLabel: slot.positionLabel,
          isCaptain: slot.isCaptain,
          role: slot.role,
          x: homeX,
          y: homeY,
          vx: 0,
          vy: 0,
          homeX,
          homeY,
          facingX: side === 'home' ? 1 : -1,
          facingY: 0,
          stamina: 100,
          yellowCards: 0,
          redCarded: false,
          tackleCooldown: 0,
          tackleTimer: 0,
          stunTimer: 0,
          animDist: 0,
          hitFlash: 0,
          aiPolicy: slot.aiPolicy,
        };
        this.players.push(entity);
        this.getOrCreateContrib(entity);
      }
    }
    const homeLead =
      this.players.find((p) => p.team === 'home' && p.isCaptain && p.role !== 'GK') ??
      this.players.find((p) => p.team === 'home' && p.role === 'FWD') ??
      this.players[0];
    this.activeHomePlayerId = homeLead.id;
  }

  private resetPositionsToFormation(kickoffSide: TeamSide) {
    for (const p of this.players) {
      if (p.redCarded) continue;
      p.x = p.homeX;
      p.y = p.homeY;
      p.vx = 0;
      p.vy = 0;
      p.tackleTimer = 0;
      p.stunTimer = 0;
      p.facingX = p.team === 'home' ? 1 : -1;
      p.facingY = 0;
      if (p.team !== kickoffSide) {
        const dx = p.x - PITCH.centerX;
        const dy = p.y - PITCH.centerY;
        const dist = Math.hypot(dx, dy);
        if (dist < PITCH.centerCircleRadius + 8) {
          p.x = PITCH.centerX + (p.team === 'home' ? -44 : 44);
        }
      }
    }

    const striker =
      this.players.find((p) => p.team === kickoffSide && !p.redCarded && p.role === 'FWD') ??
      this.players.find((p) => p.team === kickoffSide && !p.redCarded && p.role !== 'GK');
    if (striker) {
      striker.x = PITCH.centerX + (kickoffSide === 'home' ? -6 : 6);
      striker.y = PITCH.centerY;
      if (kickoffSide === 'home') {
        this.activeHomePlayerId = striker.id;
      }
    }
  }

  private startPreKickoffCutscene() {
    this.setPiece = 'PRE_KICKOFF';
    this.setPieceTeam = 'home';
    this.setPieceTimer = 20.0;
    this.cutsceneDuration = 20.0;
    this.bannerTitle = '';
    this.bannerSubtitle = '';
    this.bannerTimer = 0;
    this.ball.x = PITCH.centerX;
    this.ball.y = PITCH.centerY;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.ownerId = null;
    this.ball.trail = [];

    const homePlayers = this.players.filter((p) => p.team === 'home');
    const awayPlayers = this.players.filter((p) => p.team === 'away');
    homePlayers.forEach((p, idx) => {
      p.x = PITCH.centerX - 24 - (idx % 2) * 7;
      p.y = PITCH.centerY - 50 + idx * 10;
      p.vx = 0;
      p.vy = 0;
      p.facingX = 1;
      p.facingY = 0;
    });
    awayPlayers.forEach((p, idx) => {
      p.x = PITCH.centerX + 24 + (idx % 2) * 7;
      p.y = PITCH.centerY - 50 + idx * 10;
      p.vx = 0;
      p.vy = 0;
      p.facingX = -1;
      p.facingY = 0;
    });
    this.referee.x = PITCH.centerX;
    this.referee.y = PITCH.centerY - 24;
  }

  private startHalftimeCutscene() {
    this.setPiece = 'HALFTIME';
    this.setPieceTimer = 20.0;
    this.cutsceneDuration = 20.0;
    this.ball.ownerId = null;
    this.chargingShot = false;
    this.shotCharge = 0;
    this.bannerTitle = '';
    this.bannerSubtitle = '';
    this.bannerTimer = 0;
    soundEngine.playWhistle();
    this.pushHud(true);
  }

  private startGoalCelebration3dCutscene() {
    this.setPiece = 'GOAL_CELEBRATION_3D';
    this.setPieceTimer = 15.0;
    this.cutsceneDuration = 15.0;
    this.ball.ownerId = null;
    this.chargingShot = false;
    this.shotCharge = 0;
    this.bannerTitle = '';
    this.bannerSubtitle = '';
    this.bannerTimer = 0;
    this.pushHud(true);
  }

  private startFulltimeCutscene(shootoutResult: { winner: TeamSide | null; homeGoals: number; awayGoals: number } | null) {
    this.pendingShootoutResult = shootoutResult;
    this.setPiece = 'FULLTIME';
    this.setPieceTimer = 20.0;
    this.cutsceneDuration = 20.0;
    this.shootoutPrompt = null;
    this.ball.ownerId = null;
    this.chargingShot = false;
    this.shotCharge = 0;
    this.bannerTitle = '';
    this.bannerSubtitle = '';
    this.bannerTimer = 0;
    soundEngine.playWhistle();
    this.pushHud(true);
  }

  private completeFulltimeCutscene() {
    const homeWon =
      this.homeScore > this.awayScore ||
      (this.homeScore === this.awayScore && this.pendingShootoutResult?.winner === 'home');
    const wonLeague =
      this.competitionId === 'league' &&
      !this.isSingleplayerTour &&
      Boolean(this.willHomeWinLeague?.(this.homeScore, this.awayScore));
    const wonTrophy = homeWon && (this.isFinalMatch || wonLeague);
    if (wonTrophy) {
      this.startTrophyCelebrationCutscene();
    } else {
      this.finalizeEndMatch(false);
    }
  }

  private startTrophyCelebrationCutscene() {
    this.setPiece = 'TROPHY_CELEBRATION';
    this.setPieceTimer = 30.0;
    this.cutsceneDuration = 30.0;
    this.championTeam = this.homeTeam;
    this.trophyTitle = getTrophyTitle(this.competitionId, this.isSingleplayerTour);
    this.celebrationBoost = 1;
    this.confettiCooldown = 0;
    this.bannerTitle = '';
    this.bannerSubtitle = '';
    this.bannerTimer = 0;
    this.ball.ownerId = null;

    const homePlayers = this.players.filter((p) => p.team === 'home' && !p.redCarded);
    const awayPlayers = this.players.filter((p) => p.team === 'away' && !p.redCarded);
    homePlayers.forEach((p, idx) => {
      const ang = (idx / Math.max(1, homePlayers.length)) * Math.PI * 1.4 - Math.PI * 0.2;
      p.x = PITCH.centerX + Math.cos(ang) * 44;
      p.y = PITCH.centerY + 18 + Math.sin(ang) * 24;
      p.vx = 0;
      p.vy = 0;
      p.facingX = 0;
      p.facingY = -1;
    });
    awayPlayers.forEach((p, idx) => {
      p.x = PITCH.right - 26;
      p.y = PITCH.centerY - 45 + idx * 9;
      p.vx = 0;
      p.vy = 0;
      p.facingX = -1;
      p.facingY = 0;
    });

    const colors = [this.homeTeam.primaryColor, '#facc15', '#38bdf8', '#f472b6', '#ffffff'];
    for (const c of colors) {
      this.emitParticles(PITCH.centerX, PITCH.centerY, 14, 14, c, 78);
    }
    soundEngine.playGoalFanfare();
    soundEngine.playCrowdChant(1, this.isRivalry);
    this.pushHud(true);
  }

  private setupKickoff(team: TeamSide) {
    this.setPiece = 'KICKOFF';
    this.setPieceTeam = team;
    this.setPieceTimer = 0.85;
    this.setPieceSpotX = PITCH.centerX;
    this.setPieceSpotY = PITCH.centerY;
    this.ball.x = PITCH.centerX;
    this.ball.y = PITCH.centerY;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.ownerId = null;
    this.ball.trail = [];
    this.passTargetPlayerId = null;
    this.passTargetTimer = 0;
    this.resetPositionsToFormation(team);
  }

  private setupSetPiece(
    kind: SetPieceType,
    team: TeamSide,
    spotX: number,
    spotY: number,
    title: string,
    subtitle: string,
    tone: MatchHudSnapshot['bannerTone'] = 'setpiece'
  ) {
    this.setPiece = kind;
    this.setPieceTeam = team;
    this.setPieceSpotX = spotX;
    this.setPieceSpotY = spotY;
    this.setPieceTimer = team === 'away' ? 0.95 : 1.1;

    this.ball.x = spotX;
    this.ball.y = spotY;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.ownerId = null;
    this.ball.trail = [];
    this.passTargetPlayerId = null;
    this.passTargetTimer = 0;
    this.chargingShot = false;
    this.shotCharge = 0;

    this.bannerTitle = title;
    this.bannerSubtitle = subtitle;
    this.bannerTone = tone;
    this.bannerTimer = 2.0;

    const candidates = this.players.filter((p) => p.team === team && !p.redCarded);
    let taker: PlayerEntity | undefined;

    if (kind === 'GOAL_KICK') {
      taker = candidates.find((p) => p.role === 'GK') ?? candidates[0];
    } else {
      const outfield = candidates.filter((p) => p.role !== 'GK');
      taker = outfield.sort(
        (a, b) => Math.hypot(a.x - spotX, a.y - spotY) - Math.hypot(b.x - spotX, b.y - spotY)
      )[0];
    }

    if (taker) {
      // Bug fix: clamp set-piece taker safely inside pitch apron so they don't get stuck outside touchlines
      taker.x = Math.max(PITCH.left + 2, Math.min(PITCH.right - 2, spotX + (team === 'home' ? -5 : 5)));
      taker.y = Math.max(PITCH.top + 2, Math.min(PITCH.bottom - 2, spotY));
      taker.vx = 0;
      taker.vy = 0;
      this.setPieceTakerId = taker.id;
      if (team === 'home') {
        this.activeHomePlayerId = taker.id;
      }
    }

    if (kind === 'PENALTY') {
      const gk = this.players.find((p) => p.team !== team && p.role === 'GK');
      const goalX = team === 'home' ? PITCH.right - 6 : PITCH.left + 6;
      if (gk) {
        gk.x = goalX;
        gk.y = PITCH.centerY;
      }
      for (const p of this.players) {
        if (p.id === taker?.id || p.id === gk?.id || p.redCarded) continue;
        p.x = team === 'home' ? PITCH.right - 84 : PITCH.left + 84;
        p.y = PITCH.centerY + (p.number % 2 === 0 ? -42 : 42);
      }
    } else if (kind === 'FREE_KICK') {
      const defenders = this.players.filter((p) => p.team !== team && !p.redCarded && p.role !== 'GK');
      const goalX = team === 'home' ? PITCH.right : PITCH.left;
      const angleToGoal = Math.atan2(PITCH.centerY - spotY, goalX - spotX);
      for (let i = 0; i < Math.min(2, defenders.length); i++) {
        defenders[i].x = Math.max(PITCH.left + 6, Math.min(PITCH.right - 6, spotX + Math.cos(angleToGoal) * 34 + (i - 0.5) * 4));
        defenders[i].y = Math.max(PITCH.top + 6, Math.min(PITCH.bottom - 6, spotY + Math.sin(angleToGoal) * 34 + (i - 0.5) * 10));
      }
    } else if (kind === 'CORNER_KICK') {
      // Position attackers and defenders cleanly inside the penalty area for corner kick crosses!
      const boxCenterX = team === 'home' ? PITCH.right - 36 : PITCH.left + 36;
      const boxSign = team === 'home' ? -1 : 1;
      let attIdx = 0;
      let defIdx = 0;
      for (const p of this.players) {
        if (p.id === taker?.id || p.redCarded) continue;
        if (p.role === 'GK') {
          p.x = p.team === 'home' ? PITCH.left + 8 : PITCH.right - 8;
          p.y = PITCH.centerY;
          continue;
        }
        if (p.team === team) {
          const offsets = [
            { dx: 0, dy: -16 },
            { dx: 8, dy: 4 },
            { dx: -10, dy: 18 },
            { dx: -22, dy: -6 },
            { dx: -38, dy: 0 },
            { dx: 4, dy: -26 },
            { dx: -6, dy: -32 },
            { dx: -14, dy: 30 },
            { dx: -48, dy: -20 },
            { dx: -54, dy: 18 },
          ];
          const off = offsets[attIdx % offsets.length];
          attIdx++;
          p.x = Math.max(PITCH.left + 12, Math.min(PITCH.right - 12, boxCenterX + off.dx * boxSign));
          p.y = Math.max(PITCH.top + 14, Math.min(PITCH.bottom - 14, PITCH.centerY + off.dy));
        } else {
          const defOffsets = [
            { dx: 14, dy: -12 },
            { dx: 16, dy: 10 },
            { dx: 4, dy: 0 },
            { dx: -14, dy: -16 },
            { dx: -18, dy: 14 },
            { dx: 10, dy: -24 },
            { dx: 8, dy: 22 },
            { dx: -4, dy: -30 },
            { dx: -28, dy: 0 },
            { dx: -36, dy: -18 },
          ];
          const off = defOffsets[defIdx % defOffsets.length];
          defIdx++;
          p.x = Math.max(PITCH.left + 10, Math.min(PITCH.right - 10, boxCenterX + off.dx * boxSign));
          p.y = Math.max(PITCH.top + 14, Math.min(PITCH.bottom - 14, PITCH.centerY + off.dy));
        }
      }
    }

    if (kind === 'CORNER_KICK') {
      const boxCenterX = team === 'home' ? PITCH.right - 36 : PITCH.left + 36;
      this.setPieceAimAngle = Math.atan2(PITCH.centerY - spotY, boxCenterX - spotX);
    } else {
      const targetX = team === 'home' ? PITCH.right : PITCH.left;
      this.setPieceAimAngle = Math.atan2(PITCH.centerY - spotY, targetX - spotX);
    }
    soundEngine.playWhistle();
    this.pushHud(true);
  }

  private startPenaltyShootout() {
    this.half = 3;
    this.shootoutHome = [];
    this.shootoutAway = [];
    this.shootoutTurn = 'home';
    this.shootoutRound = 0;
    this.shootoutKickInFlight = false;
    this.setupNextShootoutKick();
  }

  private setupNextShootoutKick() {
    const team = this.shootoutTurn;
    const spotX = PITCH.right - PITCH.penaltySpotOffset;
    const spotY = PITCH.centerY;
    this.setPiece = 'PENALTY_SHOOTOUT';
    this.setPieceTeam = team;
    this.setPieceSpotX = spotX;
    this.setPieceSpotY = spotY;
    this.setPieceTimer = 0.8;
    this.shootoutKickInFlight = false;
    this.shootoutResolveTimer = 0;

    this.ball.x = spotX;
    this.ball.y = spotY;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.ownerId = null;
    this.ball.trail = [];

    const kicker = this.players.find((p) => p.team === team && !p.redCarded && p.role !== 'GK') ??
      this.players.find((p) => p.team === team);
    const gk = this.players.find((p) => p.team !== team && p.role === 'GK');

    for (const p of this.players) {
      if (p.redCarded) continue;
      if (p.id === kicker?.id) {
        p.x = spotX - 10;
        p.y = spotY;
        this.setPieceTakerId = p.id;
        if (team === 'home') this.activeHomePlayerId = p.id;
      } else if (p.id === gk?.id) {
        p.x = PITCH.right - 5;
        p.y = PITCH.centerY;
      } else {
        p.x = PITCH.centerX - 16 + (p.number % 5) * 6;
        p.y = PITCH.centerY + (p.team === 'home' ? -24 : 24);
      }
      p.vx = 0;
      p.vy = 0;
    }

    this.setPieceAimAngle = 0;
    this.shootoutPrompt = {
      awaitingInput: true,
      phase: team === 'home' ? 'kick' : 'save',
      round: this.shootoutRound + 1,
    };
    this.bannerTitle = 'PENALTY SHOOTOUT!';
    this.bannerSubtitle =
      team === 'home'
        ? `${this.homeTeam.shortCode} KICK · PICK L / M / R (R${this.shootoutRound + 1})`
        : `${this.awayTeam.shortCode} KICK · GK DIVE L / M / R (R${this.shootoutRound + 1})`;
    this.bannerTone = 'setpiece';
    this.bannerTimer = 4;
    soundEngine.playWhistle();
    this.pushHud(true);
  }

  private emitParticles(x: number, y: number, z: number, count: number, color: string, speed = 45) {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % this.particles.length;
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.4 + Math.random() * 0.8);
      p.active = true;
      p.x = x;
      p.y = y;
      p.z = z;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp * 0.7;
      p.vz = 15 + Math.random() * 30;
      p.life = 0;
      p.maxLife = 0.25 + Math.random() * 0.35;
      p.color = color;
      p.size = Math.random() > 0.5 ? 2 : 1;
    }
  }

  private getCurrentMinute(): number {
    if (this.half === 3) return this.extraTimePlayed ? 120 : 90;
    if (this.half === 4) {
      return Math.min(105, Math.max(91, Math.floor(90 + (this.halfElapsed / this.extraTimeHalfSec) * 15)));
    }
    if (this.half === 5) {
      return Math.min(120, Math.max(106, Math.floor(105 + (this.halfElapsed / this.extraTimeHalfSec) * 15)));
    }
    return Math.min(
      90,
      Math.max(1, Math.floor((this.half === 1 ? 0 : 45) + (this.halfElapsed / this.matchHalfSeconds) * 45))
    );
  }

  private getIntensityState() {
    return computeMatchIntensity({
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      minute: this.getCurrentMinute(),
      isRivalry: this.isRivalry,
      rivalryTitle: this.rivalryTitle,
      recentBurst: this.recentIntensityBurst,
      redCards: this.stats.homeReds + this.stats.awayReds,
    });
  }

  public step(rawDt: number) {
    if (this.finished) return;

    const clampedFrameDt = Math.max(0, Math.min(rawDt, 0.75));
    const subSteps = Math.max(1, Math.ceil(clampedFrameDt / 0.04));
    const dt = clampedFrameDt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      if (this.finished) return;
      this.stepSimulation(dt);
    }

    this.passJustPressed = false;
    this.loftPassJustPressed = false;
    this.shootJustPressed = false;
    this.shootJustReleased = false;

    this.renderFrame();
    if (this.totalTime - this.lastHudPush >= 0.12) {
      this.pushHud(false);
    }
  }

  private stepSimulation(dt: number) {
    this.totalTime += dt;
    if (!this.paused) {
      this.ledTime += dt;
      const { phase } = getMiddleLedPhase(this.ledTime);
      if (phase !== this.lastDatasetLedPhase) {
        this.lastDatasetLedPhase = phase;
        this.displayCanvas.dataset.ledPhase = phase;
      }
      const { phase: brandPhase } = getBrandAd12sPhase(this.ledTime);
      if (brandPhase !== this.lastDatasetBrandAdPhase) {
        this.lastDatasetBrandAdPhase = brandPhase;
        this.displayCanvas.dataset.brandAdPhase = brandPhase;
      }
      const brandAdIndex = Math.max(0, Math.floor(this.ledTime / BRAND_AD_CYCLE_SECONDS));
      if (brandAdIndex !== this.lastDatasetBrandAdIndex) {
        this.lastDatasetBrandAdIndex = brandAdIndex;
        this.displayCanvas.dataset.brandAdIndex = String(brandAdIndex);
      }
      const activeCutscene = this.getActiveCutscenePhase() ?? '';
      if (activeCutscene !== this.lastDatasetCutscene) {
        this.lastDatasetCutscene = activeCutscene;
        this.displayCanvas.dataset.cutscene = activeCutscene;
      }
    }

    this.trauma = Math.max(0, this.trauma - dt * 2.4);
    this.goalNetRippleLeft = Math.max(0, this.goalNetRippleLeft - dt * 1.4);
    this.goalNetRippleRight = Math.max(0, this.goalNetRippleRight - dt * 1.4);
    this.celebrationBoost = Math.max(0, this.celebrationBoost - dt * 0.55);
    this.recentIntensityBurst = Math.max(0, this.recentIntensityBurst - dt * 0.14);

    for (const pt of this.particles) {
      if (!pt.active) continue;
      pt.life += dt;
      if (pt.life >= pt.maxLife) {
        pt.active = false;
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.z = Math.max(0, pt.z + pt.vz * dt);
      pt.vz -= 90 * dt;
    }

    if (this.paused) {
      return;
    }

    if (this.hitstop > 0) {
      this.hitstop = Math.max(0, this.hitstop - dt);
      return;
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    }
    if (this.goalAnimationTimer > 0) {
      this.goalAnimationTimer = Math.max(0, this.goalAnimationTimer - dt);
    }
    if (this.referee.cardTimer > 0) {
      this.referee.cardTimer = Math.max(0, this.referee.cardTimer - dt);
      if (this.referee.cardTimer === 0) this.referee.cardShown = null;
    }

    // Dynamic crowd chants when intensity is high
    this.chantCooldown -= dt;
    if (this.chantCooldown <= 0) {
      const { intensity } = this.getIntensityState();
      if (intensity > 0.52) {
        soundEngine.playCrowdChant(intensity, this.isRivalry);
      }
      this.chantCooldown = Math.max(4.5, 9.5 - intensity * 4.5);
    }

    // Real-time score ticker progression
    if (this.totalTime >= this.nextTickerUpdate) {
      this.advanceLiveTicker(this.getCurrentMinute());
      this.nextTickerUpdate = this.totalTime + 5.2;
    }

    if (this.setPiece !== 'NONE') {
      this.stepSetPiece(dt);
    } else {
      this.stepLiveMatch(dt);
    }

    const targetRefX = Math.max(PITCH.left + 20, Math.min(PITCH.right - 20, this.ball.x - 18));
    const targetRefY = Math.max(PITCH.top + 14, Math.min(PITCH.bottom - 14, this.ball.y - 34));
    this.referee.x += (targetRefX - this.referee.x) * Math.min(1, dt * 2.5);
    this.referee.y += (targetRefY - this.referee.y) * Math.min(1, dt * 2.5);
  }

  private getInputAxes(): { mx: number; my: number; sprint: boolean } {
    let mx = this.touchInput.moveX;
    let my = this.touchInput.moveY;
    if (this.keysHeld.has('ArrowLeft') || this.keysHeld.has('KeyA')) mx -= 1;
    if (this.keysHeld.has('ArrowRight') || this.keysHeld.has('KeyD')) mx += 1;
    if (this.keysHeld.has('ArrowUp') || this.keysHeld.has('KeyW')) my -= 1;
    if (this.keysHeld.has('ArrowDown') || this.keysHeld.has('KeyS')) my += 1;

    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }
    const sprint =
      this.touchInput.sprint ||
      this.keysHeld.has('ShiftLeft') ||
      this.keysHeld.has('ShiftRight');
    return { mx, my, sprint };
  }

  private stepSetPiece(dt: number) {
    if (this.setPiece === 'GOAL') {
      this.setPieceTimer -= dt;
      this.stepBallPhysics(dt, false);
      if (this.setPieceTimer <= 0) {
        this.startGoalCelebration3dCutscene();
      }
      return;
    }

    if (this.setPiece === 'GOAL_CELEBRATION_3D') {
      this.setPieceTimer -= dt;
      this.celebrationBoost = 0.85;
      if (this.setPieceTimer <= 0) {
        this.skipCutscene();
      }
      return;
    }

    if (this.setPiece === 'REPLAY') {
      this.replayCursor += dt * 42; // 0.7x slow-motion 8-bit replay
      if (this.replayCursor >= this.replayPlaybackFrames.length) {
        this.skipReplay();
      }
      return;
    }

    if (this.setPiece === 'PRE_KICKOFF') {
      this.setPieceTimer -= dt;
      if (this.setPieceTimer <= 0) {
        this.skipCutscene();
      }
      return;
    }

    if (this.setPiece === 'HALFTIME') {
      this.setPieceTimer -= dt;
      for (const p of this.players) {
        if (p.redCarded) continue;
        const stepY = Math.max(PITCH.top + 8, p.y - dt * 16);
        p.animDist += Math.abs(p.y - stepY);
        p.y = stepY;
      }
      if (this.setPieceTimer <= 0) {
        this.skipCutscene();
      }
      return;
    }

    if (this.setPiece === 'FULLTIME') {
      this.setPieceTimer -= dt;
      for (const p of this.players) {
        if (p.redCarded) continue;
        const dx = PITCH.centerX - p.x;
        const dy = PITCH.centerY - p.y;
        const d = Math.hypot(dx, dy);
        if (d > 26) {
          p.x += (dx / d) * dt * 18;
          p.y += (dy / d) * dt * 18;
          p.animDist += dt * 18;
        }
      }
      if (this.setPieceTimer <= 0) {
        this.completeFulltimeCutscene();
      }
      return;
    }

    if (this.setPiece === 'TROPHY_CELEBRATION') {
      this.setPieceTimer -= dt;
      this.celebrationBoost = 0.9;
      this.confettiCooldown -= dt;
      if (this.confettiCooldown <= 0) {
        this.confettiCooldown = 0.26;
        const palette = [this.homeTeam.primaryColor, '#facc15', '#38bdf8', '#ec4899', '#22c55e'];
        const col = palette[Math.floor(Math.random() * palette.length)];
        this.emitParticles(
          PITCH.centerX + (Math.random() - 0.5) * 90,
          PITCH.centerY + (Math.random() - 0.5) * 40,
          12,
          10,
          col,
          65
        );
      }
      for (const p of this.players) {
        if (p.team === 'home' && !p.redCarded) {
          p.y += Math.sin(this.totalTime * 14 + p.number) * 0.22;
          p.animDist += dt * 42;
        }
      }
      if (this.setPieceTimer <= 0) {
        this.finalizeEndMatch(true);
      }
      return;
    }

    if (this.setPiece === 'PENALTY_SHOOTOUT') {
      this.stepPenaltyShootout(dt);
      return;
    }

    this.setPieceTimer -= dt;

    if (this.setPiece === 'KICKOFF') {
      if (this.setPieceTimer <= 0) {
        this.setPiece = 'NONE';
        const kicker = this.players.find((p) => p.team === this.setPieceTeam && !p.redCarded && p.role !== 'GK');
        if (kicker) {
          this.ball.ownerId = kicker.id;
          this.ball.lastTouchTeam = kicker.team;
          this.ball.lastTouchPlayerId = kicker.id;
          this.ball.previousTouchPlayerId = null;
        }
        soundEngine.playWhistle();
        this.pushHud(true);
      }
      return;
    }

    if (this.setPieceTeam === 'home') {
      const { mx, my } = this.getInputAxes();
      if (Math.abs(mx) > 0.1 || Math.abs(my) > 0.1) {
        this.setPieceAimAngle = Math.atan2(my, mx);
      }
      if (this.shootJustPressed || this.keysHeld.has('KeyK') || this.keysHeld.has('Space') || this.touchInput.shootHeld) {
        this.chargingShot = true;
        this.shotCharge = Math.min(1, this.shotCharge + dt * 1.4);
      }
      if (
        this.passJustPressed ||
        this.loftPassJustPressed ||
        (this.chargingShot && this.shootJustReleased) ||
        this.setPieceTimer < -4.5
      ) {
        const isShot = this.setPiece === 'PENALTY' || this.setPiece === 'FREE_KICK' || this.chargingShot;
        const isLoft = this.loftPassJustPressed || this.setPiece === 'CORNER_KICK' || this.setPiece === 'GOAL_KICK';
        const power = Math.max(0.5, this.shotCharge || 0.72);
        this.executeSetPieceKick('home', isShot, isLoft, power);
      }
    } else {
      if (this.setPieceTimer <= 0) {
        const isShot = this.setPiece === 'PENALTY' || this.setPiece === 'FREE_KICK';
        const isLoft = this.setPiece === 'CORNER_KICK' || this.setPiece === 'GOAL_KICK';
        this.executeSetPieceKick('away', isShot, isLoft, 0.74);
      }
    }
  }

  private executeSetPieceKick(team: TeamSide, isShot: boolean, isLoft: boolean, power: number) {
    const taker = this.players.find((p) => p.id === this.setPieceTakerId) ??
      this.players.find((p) => p.team === team && !p.redCarded);

    let angle = this.setPieceAimAngle;
    if (team === 'away') {
      if (this.setPiece === 'CORNER_KICK') {
        const boxTargetX = PITCH.left + 36;
        const boxTargetY = PITCH.centerY + (Math.random() - 0.5) * 28;
        angle = Math.atan2(boxTargetY - this.ball.y, boxTargetX - this.ball.x);
      } else {
        const targetX = PITCH.left;
        const targetY = PITCH.centerY + (Math.random() - 0.5) * 32;
        angle = Math.atan2(targetY - this.ball.y, targetX - this.ball.x);
      }
    }

    const speed = isShot ? 225 + power * 115 : isLoft ? 165 + power * 55 : 165 + power * 55;
    this.ball.vx = Math.cos(angle) * speed;
    this.ball.vy = Math.sin(angle) * speed;
    this.ball.vz =
      this.setPiece === 'CORNER_KICK'
        ? 86 + power * 24
        : this.setPiece === 'GOAL_KICK'
        ? 78
        : this.setPiece === 'THROW_IN'
        ? 45
        : isLoft
        ? 88
        : 26;
    this.ball.ownerId = null;
    this.ball.previousTouchPlayerId = this.ball.lastTouchPlayerId;
    this.ball.lastTouchTeam = team;
    this.ball.lastTouchPlayerId = taker?.id ?? null;
    this.ball.pickupLockTimer = 0.24;
    this.ballKickMode = isShot && this.setPiece !== 'CORNER_KICK' ? 'shot' : 'pass';

    if (taker) {
      const contrib = this.getOrCreateContrib(taker);
      if (isShot && this.setPiece !== 'CORNER_KICK') contrib.shots += 1;
      else contrib.passes += 1;
    }

    if (this.setPiece === 'CORNER_KICK' && team === 'home') {
      // Switch control to nearest attacker in the penalty box to volley/head the corner cross
      const boxAtt = this.players
        .filter((p) => p.team === 'home' && p.id !== taker?.id && !p.redCarded && p.role !== 'GK')
        .sort((a, b) => Math.hypot(b.x - PITCH.right, b.y - PITCH.centerY) - Math.hypot(a.x - PITCH.right, a.y - PITCH.centerY))[0];
      if (boxAtt) this.activeHomePlayerId = boxAtt.id;
    }

    if (isShot && this.setPiece !== 'CORNER_KICK') {
      if (team === 'home') this.stats.homeShots += 1;
      else this.stats.awayShots += 1;
      soundEngine.playShoot(power);
    } else {
      if (team === 'home') this.stats.homePasses += 1;
      else this.stats.awayPasses += 1;
      soundEngine.playPass();
    }

    this.chargingShot = false;
    this.shotCharge = 0;
    this.setPiece = 'NONE';
    this.emitParticles(this.ball.x, this.ball.y, 1, 8, '#f8fafc', 40);
    this.pushHud(true);
  }

  private stepPenaltyShootout(dt: number) {
    if (!this.shootoutKickInFlight) {
      // Wait cleanly for Left / Middle / Right directional selection from user (via UI buttons or Left/Up/Right keys)
      if (this.shootoutTurn === 'home' && !this.shootoutPrompt?.awaitingInput) {
        this.submitPenaltyDirection('middle');
      } else if (this.shootoutTurn === 'away' && !this.shootoutPrompt?.awaitingInput) {
        this.submitPenaltyDirection('middle');
      }
      return;
    }

    this.stepBallPhysics(dt, false);
    const gk = this.players.find((p) => p.team !== this.shootoutTurn && p.role === 'GK');
    if (gk) {
      const diveSpeed = 128;
      const dy = this.shootoutGkTargetY - gk.y;
      gk.y += Math.sign(dy) * Math.min(Math.abs(dy), diveSpeed * dt);
      const gkGuessedSameZone = Math.abs(this.shootoutGkTargetY - this.shootoutShotTargetY) < 9;
      if (gkGuessedSameZone && Math.hypot(this.ball.x - gk.x, this.ball.y - gk.y) < 10 && this.ball.vx > 0) {
        this.ball.vx *= -0.4;
        this.ball.vy *= 0.5;
        soundEngine.playPostClang();
        this.finishShootoutAttempt('M', 'SAVED!');
        return;
      }
    }

    this.shootoutResolveTimer += dt;
    if (this.ball.x >= PITCH.right) {
      const inGoal = Math.abs(this.ball.y - PITCH.centerY) <= PITCH.goalHalfHeight - 2;
      if (inGoal) {
        this.goalNetRippleRight = 1;
        soundEngine.playGoalFanfare();
        this.emitParticles(this.ball.x, this.ball.y, 6, 18, '#facc15', 70);
        this.finishShootoutAttempt('G', 'SCORED!');
      } else {
        this.finishShootoutAttempt('M', 'MISSED!');
      }
      return;
    }

    if (this.shootoutResolveTimer > 1.8) {
      this.finishShootoutAttempt('M', 'SAVED!');
    }
  }

  private launchShootoutKick(team: TeamSide, power: number) {
    const speed = 250 + power * 95;
    this.ballKickMode = 'shot';
    this.ball.vx = Math.cos(this.setPieceAimAngle) * speed;
    this.ball.vy = Math.sin(this.setPieceAimAngle) * speed;
    this.ball.vz = 22;
    this.shootoutKickInFlight = true;
    this.shootoutResolveTimer = 0;
    this.chargingShot = false;
    this.shotCharge = 0;
    soundEngine.playShoot(power);
  }

  private finishShootoutAttempt(outcome: 'G' | 'M', label: string) {
    if (this.shootoutTurn === 'home') {
      this.shootoutHome.push(outcome);
      this.shootoutTurn = 'away';
    } else {
      this.shootoutAway.push(outcome);
      this.shootoutTurn = 'home';
      this.shootoutRound += 1;
    }

    this.bannerTitle = label;
    this.bannerTone = outcome === 'G' ? 'goal' : 'neutral';
    this.bannerTimer = 1.4;

    const homeClean = this.shootoutHome.filter((x): x is 'G' | 'M' => x !== 'P');
    const awayClean = this.shootoutAway.filter((x): x is 'G' | 'M' => x !== 'P');
    const res = resolveShootoutState(homeClean, awayClean);
    if (res.decided && res.winner) {
      this.startFulltimeCutscene({
        winner: res.winner,
        homeGoals: res.homeGoals,
        awayGoals: res.awayGoals,
      });
      return;
    }
    this.setupNextShootoutKick();
  }

  private stepLiveMatch(dt: number) {
    this.halfElapsed += dt;
    const halfDur = this.half === 4 || this.half === 5 ? this.extraTimeHalfSec : this.matchHalfSeconds;
    if (this.halfElapsed >= halfDur) {
      if (this.half === 1) {
        this.startHalftimeCutscene();
        return;
      } else if (this.half === 2) {
        if (this.homeScore === this.awayScore) {
          // Tied at 90': proceed to Extra Time (90'-120') across ALL modes!
          this.half = 4;
          this.halfElapsed = 0;
          this.extraTimePlayed = true;
          this.bannerTitle = 'EXTRA TIME!';
          this.bannerSubtitle = "90' - 120' · GOLDEN DECIDER";
          this.bannerTone = 'setpiece';
          this.bannerTimer = 2.2;
          soundEngine.playWhistle();
          this.setupKickoff('home');
          this.pushHud(true);
          return;
        }
        this.startFulltimeCutscene(null);
        return;
      } else if (this.half === 4) {
        this.half = 5;
        this.halfElapsed = 0;
        this.bannerTitle = 'EXTRA TIME 2ND HALF';
        this.bannerSubtitle = "105' - 120'";
        this.bannerTone = 'setpiece';
        this.bannerTimer = 1.8;
        this.setupKickoff('away');
        this.pushHud(true);
        return;
      } else if (this.half === 5) {
        if (this.homeScore === this.awayScore) {
          this.startPenaltyShootout();
          return;
        }
        this.startFulltimeCutscene(null);
        return;
      }
    }

    if (this.ball.ownerId) {
      if (this.ball.ownerId.startsWith('home')) this.stats.homePossessionTicks += 1;
      else this.stats.awayPossessionTicks += 1;
    }

    this.stepControlledHomePlayer(dt);
    for (const p of this.players) {
      if (p.redCarded) continue;
      if (p.hitFlash > 0) p.hitFlash = Math.max(0, p.hitFlash - dt);
      if (p.tackleCooldown > 0) p.tackleCooldown = Math.max(0, p.tackleCooldown - dt);
      if (p.stunTimer > 0) {
        p.stunTimer = Math.max(0, p.stunTimer - dt);
        p.vx *= 0.88;
        p.vy *= 0.88;
      }
      if (p.tackleTimer > 0) {
        p.tackleTimer = Math.max(0, p.tackleTimer - dt);
        this.checkTackleCollisions(p);
      }

      if (p.id !== this.activeHomePlayerId && p.stunTimer <= 0 && p.tackleTimer <= 0) {
        this.stepAiPlayer(p, dt);
      }

      const prevX = p.x;
      const prevY = p.y;
      p.x = Math.max(PITCH.left - 8, Math.min(PITCH.right + 8, p.x + p.vx * dt));
      p.y = Math.max(PITCH.top - 8, Math.min(PITCH.bottom + 8, p.y + p.vy * dt));
      p.animDist += Math.hypot(p.x - prevX, p.y - prevY);
    }

    // Bug fix: Soft separation between nearby players so sprites never stack cleanly on top of each other
    for (let i = 0; i < this.players.length; i++) {
      const a = this.players[i];
      if (a.redCarded) continue;
      for (let j = i + 1; j < this.players.length; j++) {
        const b = this.players[j];
        if (b.redCarded) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.01 && dist < 8) {
          const push = (8 - dist) * 0.35;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }

    this.stepBallPhysics(dt, true);

    // Record compact frame into rolling replay ring buffer
    this.replayBuffer.push({
      ballX: this.ball.x,
      ballY: this.ball.y,
      ballZ: this.ball.z,
      ballSpin: this.ball.spin,
      players: this.players.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        facingX: p.facingX,
        facingY: p.facingY,
        animDist: p.animDist,
        tackleTimer: p.tackleTimer,
        redCarded: p.redCarded,
      })),
      refX: this.referee.x,
      refY: this.referee.y,
    });
    if (this.replayBuffer.length > MAX_REPLAY_FRAMES) {
      this.replayBuffer.shift();
    }
  }

  private stepControlledHomePlayer(dt: number) {
    let player = this.players.find((p) => p.id === this.activeHomePlayerId && !p.redCarded);
    if (!player) {
      player = this.players.find((p) => p.team === 'home' && !p.redCarded && p.role !== 'GK');
      if (player) this.activeHomePlayerId = player.id;
    }
    if (!player) return;

    const { mx, my, sprint } = this.getInputAxes();
    const hasBall = this.ball.ownerId === player.id;

    if (player.stunTimer <= 0 && player.tackleTimer <= 0) {
      const baseSpeed = 68 + (this.homeTeam.speed - 75) * 0.9;
      const sprintBoost = sprint && player.stamina > 8 ? 1.32 : 1.0;
      const hasMoveInput = Math.hypot(mx, my) > 0.08;
      if (sprint && hasMoveInput) {
        player.stamina = Math.max(0, player.stamina - dt * 28);
      } else {
        player.stamina = Math.min(100, player.stamina + dt * 16);
      }

      const dribbleFactor = hasBall ? 0.94 : 1.0;
      const speed = baseSpeed * sprintBoost * dribbleFactor;
      const bx = this.ball.x - player.x;
      const by = this.ball.y - player.y;
      const bDist = Math.hypot(bx, by);
      const isReceivingPass = !this.ball.ownerId && player.id === this.passTargetPlayerId;

      if (isReceivingPass && bDist > 1.5) {
        // Auto-intercept incoming pass even while user keeps holding the joystick so passes always connect!
        const dirX = bx / bDist;
        const dirY = by / bDist;
        const lock = hasMoveInput ? (bDist < 38 ? 1.0 : 0.85) : 1.0;
        const steerX = dirX * lock + (hasMoveInput ? mx * (1 - lock) : 0);
        const steerY = dirY * lock + (hasMoveInput ? my * (1 - lock) : 0);
        const steerLen = Math.hypot(steerX, steerY) || 1;
        const interceptSpeed = baseSpeed * Math.max(sprintBoost, 1.24);
        player.vx = (steerX / steerLen) * interceptSpeed;
        player.vy = (steerY / steerLen) * interceptSpeed;
        player.facingX = dirX;
        player.facingY = dirY;
      } else if (hasMoveInput) {
        if (!this.ball.ownerId && bDist < 28 && bDist > 1.5) {
          // Gentle magnetic assist onto very close loose balls while dribbling with joystick
          const dirX = bx / bDist;
          const dirY = by / bDist;
          const steerX = mx * 0.65 + dirX * 0.35;
          const steerY = my * 0.65 + dirY * 0.35;
          const steerLen = Math.hypot(steerX, steerY) || 1;
          player.vx = (steerX / steerLen) * speed;
          player.vy = (steerY / steerLen) * speed;
          player.facingX = mx;
          player.facingY = my;
        } else {
          player.vx = mx * speed;
          player.vy = my * speed;
          player.facingX = mx;
          player.facingY = my;
        }
      } else if (!this.ball.ownerId) {
        // Loose ball auto-collect when user isn't holding a direction
        if (bDist < 360 && bDist > 2.0) {
          const collectSpeed = baseSpeed * 1.22;
          player.vx = (bx / bDist) * collectSpeed;
          player.vy = (by / bDist) * collectSpeed;
          player.facingX = bx / bDist;
          player.facingY = by / bDist;
        } else {
          player.vx = 0;
          player.vy = 0;
        }
      } else {
        player.vx = 0;
        player.vy = 0;
      }
    }

    if (this.loftPassJustPressed) {
      if (hasBall) {
        this.performPass(player, true, mx, my);
      } else {
        this.switchToNearestHomePlayer();
      }
    } else if (this.passJustPressed) {
      if (hasBall) {
        this.performPass(player, false, mx, my);
      } else {
        this.switchToNearestHomePlayer();
      }
    }

    if (hasBall) {
      if (this.shootJustPressed || this.keysHeld.has('KeyK') || this.keysHeld.has('Space') || this.touchInput.shootHeld) {
        this.chargingShot = true;
        this.shotCharge = Math.min(1, this.shotCharge + dt * 1.65);
      }
      if (
        this.chargingShot &&
        (this.shootJustReleased || (!this.keysHeld.has('KeyK') && !this.keysHeld.has('Space') && !this.touchInput.shootHeld))
      ) {
        this.performShot(player, Math.max(0.48, this.shotCharge), my);
        this.chargingShot = false;
        this.shotCharge = 0;
      }
    } else {
      this.chargingShot = false;
      this.shotCharge = 0;
      if (this.shootJustPressed && player.tackleCooldown <= 0 && player.stunTimer <= 0) {
        this.performSlideTackle(player);
      }
    }
  }

  private switchToNearestHomePlayer() {
    const candidates = this.players.filter(
      (p) => p.team === 'home' && !p.redCarded && p.role !== 'GK' && p.id !== this.activeHomePlayerId
    );
    if (candidates.length === 0) return;
    candidates.sort(
      (a, b) => Math.hypot(a.x - this.ball.x, a.y - this.ball.y) - Math.hypot(b.x - this.ball.x, b.y - this.ball.y)
    );
    this.activeHomePlayerId = candidates[0].id;
    soundEngine.playMenuBlip();
  }

  private performPass(passer: PlayerEntity, isLofted: boolean = false, inputX = 0, inputY = 0) {
    const teammates = this.players.filter(
      (p) => p.team === passer.team && p.id !== passer.id && !p.redCarded
    );
    const best = selectPassRecipient(passer, teammates, isLofted, inputX, inputY);
    if (!best) return;

    const targetDirectPass = passer.team === 'home' && best.role !== 'GK';
    const { vx, vy, vz } = computePassVelocity(passer, best, isLofted, targetDirectPass);

    this.ball.ownerId = null;
    this.ball.pickupLockTimer = isLofted ? 0.16 : 0.1;
    this.ball.vx = vx;
    this.ball.vy = vy;
    this.ball.vz = vz;
    this.ball.previousTouchPlayerId = this.ball.lastTouchPlayerId;
    this.ball.lastTouchTeam = passer.team;
    this.ball.lastTouchPlayerId = passer.id;
    this.passTargetPlayerId = best.id;
    this.passTargetTimer = isLofted ? 1.6 : 1.3;
    this.ballKickMode = 'pass';

    this.getOrCreateContrib(passer).passes += 1;

    if (passer.team === 'home') {
      this.stats.homePasses += 1;
      if (best.role !== 'GK') this.activeHomePlayerId = best.id;
    } else {
      this.stats.awayPasses += 1;
    }
    soundEngine.playPass();
    this.emitParticles(this.ball.x, this.ball.y, isLofted ? 4 : 1, isLofted ? 9 : 5, isLofted ? '#bae6fd' : '#e2e8f0', 34);
  }

  private performShot(shooter: PlayerEntity, power: number, inputY = 0) {
    const targetGoalX = shooter.team === 'home' ? PITCH.right : PITCH.left;
    const aimYAxis = Math.abs(inputY) > 0.15 ? inputY : shooter.facingY;
    const aimOffsetY = aimYAxis * (PITCH.goalHalfHeight - 4);
    const targetY = Math.max(
      PITCH.centerY - PITCH.goalHalfHeight + 3,
      Math.min(PITCH.centerY + PITCH.goalHalfHeight - 3, PITCH.centerY + aimOffsetY)
    );
    const dx = targetGoalX - shooter.x;
    const dy = targetY - shooter.y;
    const dist = Math.hypot(dx, dy) || 1;
    const shotSpeed = 248 + power * 132;

    this.ball.ownerId = null;
    this.ball.pickupLockTimer = 0.2;
    this.passTargetPlayerId = null;
    this.passTargetTimer = 0;
    this.ballKickMode = 'shot';
    this.ball.vx = (dx / dist) * shotSpeed;
    this.ball.vy = (dy / dist) * shotSpeed;
    this.ball.vz = 26 + power * 28;
    this.ball.previousTouchPlayerId = this.ball.lastTouchPlayerId;
    this.ball.lastTouchTeam = shooter.team;
    this.ball.lastTouchPlayerId = shooter.id;

    this.getOrCreateContrib(shooter).shots += 1;
    this.recentIntensityBurst = Math.min(0.4, this.recentIntensityBurst + 0.15);

    if (shooter.team === 'home') this.stats.homeShots += 1;
    else this.stats.awayShots += 1;

    this.hitstop = 0.032;
    this.trauma = Math.min(1, this.trauma + 0.25 * power);
    soundEngine.playShoot(power);
    this.emitParticles(this.ball.x, this.ball.y, 2, 10, '#facc15', 55);
  }

  private performSlideTackle(tackler: PlayerEntity) {
    let aimX = tackler.facingX;
    let aimY = tackler.facingY;
    const predBallX = this.ball.x + this.ball.vx * 0.08;
    const predBallY = this.ball.y + this.ball.vy * 0.08;
    const bx = predBallX - tackler.x;
    const by = predBallY - tackler.y;
    const bDist = Math.hypot(bx, by);
    if (this.ball.ownerId !== tackler.id && bDist > 1 && bDist < 38) {
      const fLen = Math.hypot(aimX, aimY) || 1;
      const fx = aimX / fLen;
      const fy = aimY / fLen;
      const tx = bx / bDist;
      const ty = by / bDist;
      // Blend facing smoothly toward predicted ball path so tackles connect cleanly
      const blend = tackler.team === 'away' ? 0.85 : 0.55;
      aimX = fx * (1 - blend) + tx * blend;
      aimY = fy * (1 - blend) + ty * blend;
      tackler.facingX = aimX;
      tackler.facingY = aimY;
    }

    const len = Math.hypot(aimX, aimY) || 1;
    tackler.tackleTimer = 0.22;
    tackler.tackleCooldown = 0.85;
    tackler.vx = (aimX / len) * 158;
    tackler.vy = (aimY / len) * 158;
    soundEngine.playTackle();
    this.emitParticles(tackler.x, tackler.y, 0, 5, '#86efac', 32);
  }

  private performCleanAiTackle(tackler: PlayerEntity, victim: PlayerEntity) {
    const dx = this.ball.x - tackler.x;
    const dy = this.ball.y - tackler.y;
    const dist = Math.hypot(dx, dy) || 1;
    tackler.facingX = dx / dist;
    tackler.facingY = dy / dist;
    tackler.tackleCooldown = tackler.team === 'away' ? 1.05 : 0.72;
    tackler.vx *= 0.35;
    tackler.vy *= 0.35;

    victim.stunTimer = 0.26;
    victim.hitFlash = 0.12;
    const vdx = victim.x - tackler.x;
    const vdy = victim.y - tackler.y;
    const vDist = Math.hypot(vdx, vdy) || 1;
    victim.vx = (vdx / vDist) * 32;
    victim.vy = (vdy / vDist) * 32;

    this.ball.ownerId = tackler.id;
    this.ball.previousTouchPlayerId = this.ball.lastTouchPlayerId;
    this.ball.lastTouchTeam = tackler.team;
    this.ball.lastTouchPlayerId = tackler.id;
    this.ball.pickupLockTimer = 0.16;
    this.passTargetPlayerId = null;
    this.passTargetTimer = 0;

    if (tackler.team === 'home' && tackler.role !== 'GK') {
      this.activeHomePlayerId = tackler.id;
    }

    this.getOrCreateContrib(tackler).tackles += 1;
    if (tackler.team === 'home') this.stats.homeTackles += 1;
    else this.stats.awayTackles += 1;

    soundEngine.playTackle();
    this.emitParticles(this.ball.x, this.ball.y, 1, 8, '#86efac', 42);
  }

  private checkTackleCollisions(tackler: PlayerEntity) {
    const tLen = Math.hypot(tackler.facingX, tackler.facingY) || 1;
    const tDirX = tackler.facingX / tLen;
    const tDirY = tackler.facingY / tLen;
    const bootX = tackler.x + tDirX * 3;
    const bootY = tackler.y + tDirY * 2;
    const distToBall = Math.hypot(bootX - this.ball.x, bootY - this.ball.y);

    const owner = this.ball.ownerId
      ? this.players.find((o) => o.id === this.ball.ownerId && o.team !== tackler.team && !o.redCarded)
      : undefined;

    const isBehindVictim = (victim: PlayerEntity) => {
      const vLen = Math.hypot(victim.facingX, victim.facingY) || 1;
      const vDirX = victim.facingX / vLen;
      const vDirY = victim.facingY / vLen;
      return tDirX * vDirX + tDirY * vDirY > 0.35;
    };

    if ((!this.ball.ownerId || this.ball.ownerId !== tackler.id) && distToBall < 11.5) {
      const divingFromBehindIntoOwner =
        owner !== undefined &&
        Math.hypot(tackler.x - owner.x, tackler.y - owner.y) < 8 &&
        isBehindVictim(owner);

      if (!divingFromBehindIntoOwner) {
        this.ball.ownerId = tackler.id;
        this.ball.previousTouchPlayerId = this.ball.lastTouchPlayerId;
        this.ball.lastTouchTeam = tackler.team;
        this.ball.lastTouchPlayerId = tackler.id;
        this.ball.pickupLockTimer = 0.16;
        this.passTargetPlayerId = null;
        this.passTargetTimer = 0;
        tackler.tackleTimer = 0;
        tackler.vx *= 0.35;
        tackler.vy *= 0.35;
        if (owner) {
          owner.stunTimer = Math.max(owner.stunTimer, 0.24);
          owner.hitFlash = 0.1;
        }
        if (tackler.team === 'home' && tackler.role !== 'GK') {
          this.activeHomePlayerId = tackler.id;
        }
        this.getOrCreateContrib(tackler).tackles += 1;
        if (tackler.team === 'home') this.stats.homeTackles += 1;
        else this.stats.awayTackles += 1;
        soundEngine.playPass();
        return;
      }
    }

    for (const victim of this.players) {
      if (victim.team === tackler.team || victim.redCarded || victim.stunTimer > 0) continue;
      const dist = Math.hypot(tackler.x - victim.x, tackler.y - victim.y);
      if (dist < 9.5) {
        const fromBehind = isBehindVictim(victim);
        const hitPlayerFirst = isTackleHitPlayerFirst({
          distToBall,
          fromBehind,
        });

        const decision = evaluateTackle({
          hitPlayerFirst,
          fromBehind,
          severityRoll: Math.random(),
          victimSide: victim.team,
          spotX: victim.x,
          spotY: victim.y,
          tacklerExistingYellows: tackler.yellowCards,
        });

        victim.stunTimer = decision.foul ? 0.6 : 0.24;
        victim.hitFlash = 0.14;
        tackler.tackleTimer = 0;
        tackler.vx *= 0.35;
        tackler.vy *= 0.35;
        this.hitstop = 0.04;
        this.trauma = Math.min(1, this.trauma + (decision.foul ? 0.35 : 0.16));

        if (!decision.foul && this.ball.ownerId === victim.id) {
          this.ball.ownerId = tackler.id;
          this.ball.previousTouchPlayerId = this.ball.lastTouchPlayerId;
          this.ball.lastTouchTeam = tackler.team;
          this.ball.lastTouchPlayerId = tackler.id;
          this.ball.pickupLockTimer = 0.16;
          if (tackler.team === 'home' && tackler.role !== 'GK') {
            this.activeHomePlayerId = tackler.id;
          }
          this.getOrCreateContrib(tackler).tackles += 1;
          if (tackler.team === 'home') this.stats.homeTackles += 1;
          else this.stats.awayTackles += 1;
          soundEngine.playTackle();
          return;
        }

        if (decision.foul) {
          if (tackler.team === 'home') this.stats.homeFouls += 1;
          else this.stats.awayFouls += 1;
          this.recentIntensityBurst = Math.min(0.4, this.recentIntensityBurst + 0.14);

          const minute = this.getCurrentMinute();
          let title = decision.isPenalty ? 'PENALTY KICK!' : 'FOUL! FREE KICK';
          const subtitle = `${tackler.team === 'home' ? this.homeTeam.shortCode : this.awayTeam.shortCode} #${tackler.number}`;
          let tone: MatchHudSnapshot['bannerTone'] = 'setpiece';

          if (decision.card === 'YELLOW') {
            tackler.yellowCards += 1;
            this.getOrCreateContrib(tackler).yellows += 1;
            if (tackler.team === 'home') this.stats.homeYellows += 1;
            else this.stats.awayYellows += 1;
            this.cards.push({ team: tackler.team, playerNumber: tackler.number, card: 'YELLOW', minute });
            this.referee.cardShown = 'YELLOW';
            this.referee.cardTimer = 2.1;
            title = decision.isPenalty ? 'PENALTY + YELLOW CARD!' : 'YELLOW CARD!';
            tone = 'yellow';
            soundEngine.playCard(false);
          } else if (decision.card === 'RED') {
            tackler.redCarded = true;
            this.getOrCreateContrib(tackler).reds += 1;
            if (tackler.team === 'home') this.stats.homeReds += 1;
            else this.stats.awayReds += 1;
            this.cards.push({ team: tackler.team, playerNumber: tackler.number, card: 'RED', minute });
            this.referee.cardShown = 'RED';
            this.referee.cardTimer = 2.4;
            title = decision.secondYellowRed ? '2ND YELLOW -> RED CARD!' : 'RED CARD! SENT OFF!';
            tone = 'red';
            soundEngine.playCard(true);
          }

          if (decision.isPenalty) {
            const spotX = victim.team === 'home' ? PITCH.right - PITCH.penaltySpotOffset : PITCH.left + PITCH.penaltySpotOffset;
            this.setupSetPiece('PENALTY', victim.team, spotX, PITCH.centerY, title, subtitle, tone);
          } else {
            this.setupSetPiece('FREE_KICK', victim.team, decision.spotX, decision.spotY, title, subtitle, tone);
          }
          return;
        }
      }
    }
  }

  private stepAiPlayer(p: PlayerEntity, dt: number) {
    const teamObj = p.team === 'home' ? this.homeTeam : this.awayTeam;
    const hasBall = this.ball.ownerId === p.id;
    const oppGoalX = p.team === 'home' ? PITCH.right : PITCH.left;
    const ownGoalX = p.team === 'home' ? PITCH.left : PITCH.right;
    const diffCfg = p.team === 'away' ? getDifficultyConfig(this.difficulty) : null;

    if (p.aiPolicy === 'GK') {
      if (hasBall) {
        p.facingX = p.team === 'home' ? 1 : -1;
        p.facingY = (Math.random() - 0.5) * 0.6;
        this.performPass(p);
        return;
      }
      const targetX = p.team === 'home' ? PITCH.left + 10 : PITCH.right - 10;
      const clampedBallY = Math.max(
        PITCH.centerY - PITCH.goalHalfHeight + 3,
        Math.min(PITCH.centerY + PITCH.goalHalfHeight - 3, this.ball.y)
      );
      const dx = targetX - p.x;
      const dy = clampedBallY - p.y;
      const baseDiveBoost = Math.abs(this.ball.vx) > 130 ? 96 : 75;
      const diveBoost = diffCfg ? baseDiveBoost * diffCfg.gkDiveSpeedMult : baseDiveBoost;
      p.vx = Math.max(-diveBoost, Math.min(diveBoost, dx * 4.5));
      p.vy = Math.max(-diveBoost, Math.min(diveBoost, dy * 5.2));
      p.facingX = p.team === 'home' ? 1 : -1;
      return;
    }

    if (hasBall) {
      const distToGoal = Math.hypot(oppGoalX - p.x, PITCH.centerY - p.y);
      const shotRange = diffCfg ? diffCfg.shotRange : 108;
      const shotRate = diffCfg ? 2.5 * diffCfg.shotRateMult : 2.5;
      if (distToGoal < shotRange && Math.random() < dt * shotRate) {
        p.facingX = p.team === 'home' ? 1 : -1;
        const aimSpread = diffCfg ? 0.4 / diffCfg.shotAimSharpness : 0.4;
        p.facingY = (PITCH.centerY - p.y) * 0.02 + (Math.random() - 0.5) * aimSpread;
        const shotPower = Math.max(
          0.45,
          Math.min(1, 0.72 + (diffCfg ? diffCfg.shotPowerBonus : 0) + Math.random() * 0.25)
        );
        this.performShot(p, shotPower);
        return;
      }

      const nearestOpp = this.players
        .filter((o) => o.team !== p.team && !o.redCarded)
        .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
      if (nearestOpp && Math.hypot(nearestOpp.x - p.x, nearestOpp.y - p.y) < 22 && Math.random() < dt * 3.0) {
        const longLoft = Math.random() < 0.35;
        this.performPass(p, longLoft);
        return;
      }

      const dx = oppGoalX - p.x;
      const dy = PITCH.centerY - p.y;
      const len = Math.hypot(dx, dy) || 1;
      const baseSp = 62 + (teamObj.speed - 75) * 0.75;
      const sp = diffCfg ? baseSp * diffCfg.dribbleSpeedMult : baseSp;
      p.vx = (dx / len) * sp;
      p.vy = (dy / len) * sp * 0.7;
      p.facingX = p.vx;
      p.facingY = p.vy;
      return;
    }

    const ballOwner = this.players.find((o) => o.id === this.ball.ownerId);
    const teamHasBall = ballOwner?.team === p.team;
    const teamOutfield = this.players.filter((o) => o.team === p.team && !o.redCarded && o.role !== 'GK');
    const rankedByBall = [...teamOutfield].sort(
      (a, b) => Math.hypot(a.x - this.ball.x, a.y - this.ball.y) - Math.hypot(b.x - this.ball.x, b.y - this.ball.y)
    );
    const closestChaser = rankedByBall[0];
    const chaserRank = rankedByBall.findIndex((o) => o.id === p.id);

    const distToBall = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
    const isPassTarget = !ballOwner && p.id === this.passTargetPlayerId;
    const isLooseBallChaser = !ballOwner && closestChaser?.id === p.id && distToBall < 340;
    const isHomeDefenseAutoTacklePress =
      p.team === 'home' &&
      ballOwner?.team === 'away' &&
      (chaserRank >= 0 && chaserRank < 2) &&
      (p.role === 'DEF' || p.role === 'MID' || closestChaser?.id === p.id) &&
      distToBall < 280;
    const isOpponentPress =
      p.team === 'away' &&
      !teamHasBall &&
      closestChaser?.id === p.id &&
      distToBall < 215;
    const isOpponentCover =
      p.team === 'away' &&
      ballOwner?.team === 'home' &&
      chaserRank === 1 &&
      distToBall < 155;
    const shouldPress = isPassTarget || isLooseBallChaser || isHomeDefenseAutoTacklePress || isOpponentPress;

    let targetX = p.homeX;
    let targetY = p.homeY;

    if (shouldPress) {
      if (p.team === 'away' && ballOwner) {
        // Position goal-side in front of the ball so opponent tackles the ball cleanly rather than fouling from behind
        const goalSideOffset = Math.sign(ownGoalX - ballOwner.x) * 5;
        targetX = Math.max(PITCH.left + 8, Math.min(PITCH.right - 8, this.ball.x + ballOwner.vx * 0.1 + goalSideOffset));
        targetY = Math.max(PITCH.top + 8, Math.min(PITCH.bottom - 8, this.ball.y + ballOwner.vy * 0.1));
      } else {
        targetX = ballOwner ? ballOwner.x + ballOwner.facingX * 6 : this.ball.x;
        targetY = ballOwner ? ballOwner.y + ballOwner.facingY * 4 : this.ball.y;
      }

      if (
        p.team === 'home' &&
        ballOwner &&
        ballOwner.team === 'away' &&
        Math.hypot(p.x - this.ball.x, p.y - this.ball.y) < 15 &&
        p.tackleCooldown <= 0
      ) {
        this.performCleanAiTackle(p, ballOwner);
        return;
      }

      if (
        p.team === 'away' &&
        ballOwner &&
        ballOwner.team === 'home' &&
        p.tackleCooldown <= 0
      ) {
        const distToCarrierBall = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
        const carrierLen = Math.hypot(ballOwner.facingX, ballOwner.facingY) || 1;
        const cDirX = ballOwner.facingX / carrierLen;
        const cDirY = ballOwner.facingY / carrierLen;
        const toBallX = this.ball.x - p.x;
        const toBallY = this.ball.y - p.y;
        const tbLen = Math.hypot(toBallX, toBallY) || 1;
        const fromBehind = (toBallX / tbLen) * cDirX + (toBallY / tbLen) * cDirY > 0.35;

        const tackleMult = diffCfg ? diffCfg.tackleRateMult : 1.0;
        if (distToCarrierBall < 13 && !fromBehind && Math.random() < dt * 1.45 * tackleMult) {
          this.performCleanAiTackle(p, ballOwner);
          return;
        }
        if (distToCarrierBall < 20 && !fromBehind && Math.random() < dt * 0.65 * tackleMult) {
          p.facingX = toBallX;
          p.facingY = toBallY;
          this.performSlideTackle(p);
          return;
        }
      }
    } else if (isOpponentCover && ballOwner) {
      targetX = Math.max(PITCH.left + 20, Math.min(PITCH.right - 20, ballOwner.x + (ownGoalX - ballOwner.x) * 0.25));
      targetY = (ballOwner.y + PITCH.centerY) * 0.5;
    } else if (p.aiPolicy === 'SWEEPER') {
      targetX = p.homeX * 0.65 + (ownGoalX + (this.ball.x - ownGoalX) * 0.4) * 0.35;
      targetY = p.homeY * 0.6 + this.ball.y * 0.4;
    } else if (p.aiPolicy === 'PLAYMAKER') {
      const shiftX = (this.ball.x - PITCH.centerX) * 0.45;
      targetX = Math.max(PITCH.left + 35, Math.min(PITCH.right - 35, p.homeX + shiftX));
      targetY = p.homeY + (this.ball.y - PITCH.centerY) * 0.25;
    } else {
      const pushDir = p.team === 'home' ? 1 : -1;
      targetX = teamHasBall
        ? Math.max(PITCH.left + 40, Math.min(PITCH.right - 40, p.homeX + pushDir * 72))
        : p.homeX + (this.ball.x - PITCH.centerX) * 0.3;
      targetY = p.homeY + (this.ball.y - PITCH.centerY) * 0.2;
    }

    const dx = targetX - p.x;
    const dy = targetY - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 3) {
      const sp = computeAiPressSpeed({
        teamSide: p.team,
        teamSpeed: teamObj.speed,
        isHomeDefensePress: isHomeDefenseAutoTacklePress,
        isLooseBallChaser,
        isOpponentPress,
        isOpponentCover,
        shouldPress,
        difficulty: this.difficulty,
      });
      p.vx = (dx / dist) * Math.min(sp, dist * 5);
      p.vy = (dy / dist) * Math.min(sp, dist * 5);
      p.facingX = p.vx;
      p.facingY = p.vy;
    } else {
      p.vx = 0;
      p.vy = 0;
    }
  }

  private stepBallPhysics(dt: number, checkBounds: boolean) {
    if (this.ball.pickupLockTimer > 0) {
      this.ball.pickupLockTimer = Math.max(0, this.ball.pickupLockTimer - dt);
    }
    if (this.passTargetTimer > 0) {
      this.passTargetTimer = Math.max(0, this.passTargetTimer - dt);
      if (this.passTargetTimer === 0) {
        this.passTargetPlayerId = null;
        if (this.ballKickMode === 'pass') this.ballKickMode = 'loose';
      }
    }

    const owner = this.ball.ownerId ? this.players.find((p) => p.id === this.ball.ownerId && !p.redCarded) : null;
    if (owner) {
      this.passTargetPlayerId = null;
      this.passTargetTimer = 0;
      this.ballKickMode = 'loose';
      const len = Math.hypot(owner.facingX, owner.facingY) || 1;
      this.ball.x = owner.x + (owner.facingX / len) * 6;
      this.ball.y = owner.y + (owner.facingY / len) * 4;
      this.ball.z = 0;
      this.ball.vx = owner.vx;
      this.ball.vy = owner.vy;
      this.ball.spin += Math.hypot(owner.vx, owner.vy) * dt * 0.12;
      this.ball.trail = [];
      return;
    }

    // Accurate pass steering toward intended recipient during flight
    if (this.passTargetPlayerId && this.passTargetTimer > 0 && this.ball.z < 28) {
      const passTarget = this.players.find((p) => p.id === this.passTargetPlayerId && !p.redCarded);
      if (passTarget) {
        const steered = steerPassBallTowardTarget(this.ball, passTarget, dt);
        this.ball.vx = steered.vx;
        this.ball.vy = steered.vy;
      }
    }

    const speed = Math.hypot(this.ball.vx, this.ball.vy);
    if (speed < 48 && this.ballKickMode !== 'loose') {
      this.ballKickMode = 'loose';
    }
    if (speed > 135) {
      this.ball.trail.push({ x: this.ball.x, y: this.ball.y, z: this.ball.z });
      if (this.ball.trail.length > 5) this.ball.trail.shift();
    } else if (this.ball.trail.length > 0) {
      this.ball.trail.shift();
    }

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    this.ball.z += this.ball.vz * dt;
    if (this.ball.z > 0 || this.ball.vz > 0) {
      this.ball.vz -= 155 * dt;
      if (this.ball.z <= 0) {
        this.ball.z = 0;
        this.ball.vz = Math.abs(this.ball.vz) > 20 ? -this.ball.vz * 0.45 : 0;
      }
    }

    const drag = this.ball.z > 1 ? 0.992 : 0.968;
    const factor = Math.pow(drag, dt * 60);
    this.ball.vx *= factor;
    this.ball.vy *= factor;
    this.ball.spin += speed * dt * 0.14;

    const posts = [
      { x: PITCH.left, y: PITCH.centerY - PITCH.goalHalfHeight },
      { x: PITCH.left, y: PITCH.centerY + PITCH.goalHalfHeight },
      { x: PITCH.right, y: PITCH.centerY - PITCH.goalHalfHeight },
      { x: PITCH.right, y: PITCH.centerY + PITCH.goalHalfHeight },
    ];
    for (const post of posts) {
      if (Math.hypot(this.ball.x - post.x, this.ball.y - post.y) < 4) {
        this.ball.vx *= -0.7;
        this.ball.vy += (this.ball.y - post.y) * 18;
        this.ballKickMode = 'loose';
        soundEngine.playPostClang();
        this.trauma = Math.min(1, this.trauma + 0.22);
      }
    }

    if (this.ball.z < 18) {
      for (const p of this.players) {
        if (p.redCarded || p.stunTimer > 0) continue;
        // Only lock out the passer who just kicked the ball so teammates can trap passes immediately!
        if (this.ball.pickupLockTimer > 0 && p.id === this.ball.lastTouchPlayerId) continue;
        // No outfield blocking when shooting (only opposing GK may parry/save), and no blocking passes in flight (only passTarget traps)!
        if (this.ballKickMode === 'shot' && p.role !== 'GK') continue;
        if (this.ballKickMode === 'shot' && p.team === this.ball.lastTouchTeam) continue;
        if (this.ballKickMode === 'pass' && this.passTargetPlayerId && p.id !== this.passTargetPlayerId) continue;

        const reach = p.role === 'GK' ? 11.5 : p.id === this.passTargetPlayerId ? 16 : 11;
        if (Math.hypot(p.x - this.ball.x, p.y - this.ball.y) < reach) {
          // GK parries fierce close-range shots out occasionally (scales with away difficulty)
          const parryChance =
            p.role === 'GK' && p.team === 'away'
              ? Math.max(0.1, Math.min(0.75, 0.35 + getDifficultyConfig(this.difficulty).gkParryBonus))
              : 0.35;
          if (p.role === 'GK' && speed > 210 && Math.random() < parryChance) {
            this.ball.vx = p.team === 'home' ? 120 : -120;
            this.ball.vy = (this.ball.y - p.y) * 16 + (Math.random() > 0.5 ? 70 : -70);
            this.ball.lastTouchTeam = p.team;
            this.ball.lastTouchPlayerId = p.id;
            this.ball.pickupLockTimer = 0.2;
            this.passTargetPlayerId = null;
            this.passTargetTimer = 0;
            this.ballKickMode = 'loose';
            soundEngine.playPostClang();
            this.emitParticles(this.ball.x, this.ball.y, 4, 8, '#ffffff', 50);
            break;
          }
          this.ball.ownerId = p.id;
          this.ball.previousTouchPlayerId = this.ball.lastTouchPlayerId;
          this.ball.lastTouchTeam = p.team;
          this.ball.lastTouchPlayerId = p.id;
          this.passTargetPlayerId = null;
          this.passTargetTimer = 0;
          this.ballKickMode = 'loose';
          if (p.team === 'home' && p.role !== 'GK') {
            this.activeHomePlayerId = p.id;
          }
          break;
        }
      }
    }

    if (!checkBounds) return;

    const oob = classifyOutOfBounds(this.ball.x, this.ball.y, this.ball.lastTouchTeam);
    if (!oob) return;

    if (oob.kind === 'GOAL') {
      const scoringSide = oob.awardedTo;
      if (scoringSide === 'home') {
        this.homeScore += 1;
        this.goalNetRippleRight = 1;
      } else {
        this.awayScore += 1;
        this.goalNetRippleLeft = 1;
      }

      // Attribute goal + assist to players
      const scorer =
        this.players.find((p) => p.id === this.ball.lastTouchPlayerId && p.team === scoringSide) ??
        this.players.find((p) => p.team === scoringSide && p.role === 'FWD') ??
        this.players[0];
      if (scorer) {
        this.getOrCreateContrib(scorer).goals += 1;
        this.goalLog.push({
          team: scoringSide,
          playerNumber: scorer.number,
          playerName: scorer.name,
          minute: this.getCurrentMinute(),
        });
      }
      const assister = this.players.find(
        (p) =>
          p.id === this.ball.previousTouchPlayerId &&
          p.team === scoringSide &&
          p.id !== scorer?.id
      );
      if (assister) {
        this.getOrCreateContrib(assister).assists += 1;
      }

      this.celebrationBoost = 1;
      this.recentIntensityBurst = 0.4;
      this.hitstop = 0.075;
      this.trauma = 0.75;
      this.setPiece = 'GOAL';
      this.setPieceTeam = scoringSide;
      this.setPieceTimer = 1.65;
      this.goalAnimationTimer = 2.05;
      this.goalScoringTeam = scoringSide;
      this.goalScorerName = scorer
        ? `${scorer.name} #${scorer.number}`
        : scoringSide === 'home'
        ? this.homeTeam.name
        : this.awayTeam.name;
      this.ball.vx *= 0.22;
      this.ball.vy *= 0.22;
      this.bannerTitle = 'GOAL!';
      this.bannerSubtitle = `${this.goalScorerName} (${this.getCurrentMinute()}')`;
      this.bannerTone = 'goal';
      this.bannerTimer = 1.65;
      soundEngine.playGoalFanfare();
      soundEngine.playCrowdChant(1, this.isRivalry);
      this.emitParticles(this.ball.x, this.ball.y, 8, 28, '#facc15', 85);
      this.emitParticles(this.ball.x, this.ball.y, 8, 16, '#38bdf8', 75);
      this.pushHud(true);
      return;
    }

    const labelMap = {
      THROW_IN: 'THROW-IN',
      GOAL_KICK: 'GOAL KICK',
      CORNER_KICK: 'CORNER KICK',
    } as const;
    const teamLabel = oob.awardedTo === 'home' ? this.homeTeam.shortCode : this.awayTeam.shortCode;
    this.setupSetPiece(oob.kind, oob.awardedTo, oob.spotX, oob.spotY, labelMap[oob.kind], `${teamLabel} BALL`, 'setpiece');
  }

  private finalizeEndMatch(wonTrophy: boolean) {
    this.finished = true;
    this.pushHud(true);
    this.onMatchEnd({
      competitionId: this.competitionId,
      leagueRound: this.leagueRound,
      wonTrophy,
      isSingleplayerTour: this.isSingleplayerTour,
      isRivalry: this.isRivalry,
      rivalryId: this.rivalryId,
      rivalryTitle: this.rivalryTitle,
      stadiumName: this.stadium.name,
      difficulty: this.difficulty,
      matchHalfSeconds: this.matchHalfSeconds,
      extraTimePlayed: this.extraTimePlayed,
      dateLabel: this.matchDateLabel,
      timeLabel: this.matchTimeLabel,
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      shootoutWinner: this.pendingShootoutResult?.winner ?? null,
      shootoutHomeGoals: this.pendingShootoutResult?.homeGoals ?? 0,
      shootoutAwayGoals: this.pendingShootoutResult?.awayGoals ?? 0,
      shootoutHome: [...this.shootoutHome],
      shootoutAway: [...this.shootoutAway],
      stats: { ...this.stats },
      cards: [...this.cards],
      goalLog: [...this.goalLog],
      playerContributions: Array.from(this.playerStatMap.values()),
      isUltimateTeam: this.isUltimateTeam,
      utContext: this.isUltimateTeam
        ? {
            subMode: this.utSubMode ?? 'squad',
            division: this.utDivision,
          }
        : undefined,
    });
  }

  private renderFrame() {
    const { intensity } = this.getIntensityState();

    // If playing back Instant Replay, build interpolated frame view without mutating live entities
    if (this.setPiece === 'REPLAY' && this.replayPlaybackFrames.length > 0) {
      const f =
        this.replayPlaybackFrames[
          Math.min(this.replayPlaybackFrames.length - 1, Math.floor(this.replayCursor))
        ];
      const replayPlayers = this.players.map((p) => {
        const rp = f.players.find((x) => x.id === p.id);
        return rp ? { ...p, ...rp } : p;
      });
      const replayBall: BallEntity = {
        ...this.ball,
        x: f.ballX,
        y: f.ballY,
        z: f.ballZ,
        spin: f.ballSpin,
        trail: [],
      };
      this.renderer.render(this.displayCanvas, {
        competitionId: this.competitionId,
        cupRoundLabel: this.cupRoundLabel,
        isRoadTo38: this.isRoadTo38,
        isFinale38: this.isFinale38,
        championTeam: this.championTeam,
        trophyTitle: this.trophyTitle,
        stadium: this.stadium,
        lighting: this.lighting,
        isRivalry: this.isRivalry,
        rivalryId: this.rivalryId,
        rivalryTitle: this.rivalryTitle,
        matchSeed: this.matchSeed,
        homeTeam: this.homeTeam,
        awayTeam: this.awayTeam,
        players: replayPlayers,
        activeHomePlayerId: this.activeHomePlayerId,
        ball: replayBall,
        referee: { ...this.referee, x: f.refX, y: f.refY },
        setPiece: 'REPLAY',
        setPieceTeam: this.setPieceTeam,
        setPieceAimAngle: this.setPieceAimAngle,
        shotCharge: 0,
        goalNetRippleLeft: this.goalNetRippleLeft,
        goalNetRippleRight: this.goalNetRippleRight,
        shakeX: 0,
        shakeY: 0,
        time: this.totalTime,
        ledTime: this.ledTime,
        celebrationBoost: this.celebrationBoost,
        intensity,
        particles: this.particles,
      });
      return;
    }

    const shakeMag = this.trauma * this.trauma * 6;
    const shakeX = (Math.random() - 0.5) * 2 * shakeMag;
    const shakeY = (Math.random() - 0.5) * 2 * shakeMag;

    this.renderer.render(this.displayCanvas, {
      competitionId: this.competitionId,
      cupRoundLabel: this.cupRoundLabel,
      isRoadTo38: this.isRoadTo38,
      isFinale38: this.isFinale38,
      championTeam: this.championTeam,
      trophyTitle: this.trophyTitle,
      stadium: this.stadium,
      lighting: this.lighting,
      isRivalry: this.isRivalry,
      rivalryId: this.rivalryId,
      rivalryTitle: this.rivalryTitle,
      matchSeed: this.matchSeed,
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      players: this.players,
      activeHomePlayerId: this.activeHomePlayerId,
      ball: this.ball,
      referee: this.referee,
      setPiece: this.setPiece,
      setPieceTeam: this.setPieceTeam,
      setPieceAimAngle: this.setPieceAimAngle,
      shotCharge: this.shotCharge,
      goalNetRippleLeft: this.goalNetRippleLeft,
      goalNetRippleRight: this.goalNetRippleRight,
      shakeX,
      shakeY,
      time: this.totalTime,
      ledTime: this.ledTime,
      celebrationBoost: this.celebrationBoost,
      intensity,
      particles: this.particles,
    });
  }

  private pushHud(force: boolean) {
    if (!force && this.totalTime - this.lastHudPush < 0.1) return;
    this.lastHudPush = this.totalTime;

    const matchMinutes = this.getCurrentMinute();
    const { intensity, chantText } = this.getIntensityState();
    const replayActive = this.setPiece === 'REPLAY';
    const replayProgress =
      replayActive && this.replayPlaybackFrames.length > 0
        ? Math.min(1, this.replayCursor / this.replayPlaybackFrames.length)
        : 0;

    const cutscenePhase = this.getActiveCutscenePhase();
    const cutsceneProgress =
      cutscenePhase && this.cutsceneDuration > 0
        ? Math.max(0, Math.min(1, 1 - this.setPieceTimer / this.cutsceneDuration))
        : 0;
    const cutsceneRemainingSec = cutscenePhase ? Math.max(0, Math.ceil(this.setPieceTimer)) : 0;

    const homePlayers = this.players.filter((p) => p.team === 'home');
    const homeLineupPlayers = this.homeLineupSlots.map((slot, idx) => {
      const entity = homePlayers[idx];
      return {
        id: entity?.id ?? `home-${slot.number}-${idx}`,
        number: entity?.number ?? slot.number,
        name: entity?.name ?? slot.name,
        positionLabel: slot.positionLabel,
        role: entity?.role ?? slot.role,
        isCaptain: slot.isCaptain,
      };
    });

    this.onHudUpdate({
      competitionId: this.competitionId,
      cupRoundLabel: this.cupRoundLabel,
      leagueRound: this.leagueRound,
      isRoadTo38: this.isRoadTo38,
      isFinale38: this.isFinale38,
      isGroupStage: this.cupRoundLabel === 'GROUP STAGES',
      matchDateLabel: this.matchDateLabel ?? 'AUG 14, 2026',
      matchTimeLabel: this.matchTimeLabel ?? '15:00',
      isSingleplayerTour: this.isSingleplayerTour,
      isRivalry: this.isRivalry,
      rivalryId: this.rivalryId,
      rivalryTitle: this.rivalryTitle,
      stadiumName: this.stadium.name,
      difficulty: this.difficulty,
      matchHalfSeconds: this.matchHalfSeconds,
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      clockSeconds: matchMinutes * 60,
      half: this.half,
      extraTimeActive: this.half === 4 || this.half === 5,
      setPiece: this.setPiece,
      setPieceTeam: this.setPieceTeam,
      cutscenePhase,
      cutsceneProgress,
      cutsceneRemainingSec,
      championTeam: this.championTeam,
      trophyTitle: this.trophyTitle,
      bannerTitle: this.bannerTimer > 0 ? this.bannerTitle : '',
      bannerSubtitle: this.bannerTimer > 0 ? this.bannerSubtitle : '',
      bannerTone: this.bannerTone,
      goalAnimationActive: this.goalAnimationTimer > 0,
      goalAnimationTimer: this.goalAnimationTimer,
      goalScoringTeam: this.goalScoringTeam,
      goalScorerName: this.goalScorerName,
      replayActive,
      replayProgress,
      shotCharge: this.shotCharge,
      playerHasBall: this.ball.ownerId === this.activeHomePlayerId,
      intensity,
      chantText,
      shootoutHome: [...this.shootoutHome],
      shootoutAway: [...this.shootoutAway],
      shootoutPrompt: this.shootoutPrompt ? { ...this.shootoutPrompt } : null,
      homeFormation: this.homeFormation,
      homeTactic: this.homeTactic,
      homeLineupPlayers,
      homeBench: this.homeBench.map((b) => ({ ...b })),
      stats: { ...this.stats },
      cards: [...this.cards],
      goalLog: [...this.goalLog],
      liveTicker: this.liveTicker.map((f) => ({ ...f })),
      isUltimateTeam: this.isUltimateTeam,
      utSubMode: this.utSubMode,
      utDivision: this.utDivision,
    });
  }
}
