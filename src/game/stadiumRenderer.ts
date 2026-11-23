import { getBrandLogoSpriteForBrand, preloadBrandLogos } from './brandLogos';
import { getSponsorsForCompetition, LED_NEW_SHAPE_PATTERNS, type LedNewShapePatternKind, type LedSponsorAd } from './data';
import {
  BRAND_AD_CYCLE_SECONDS,
  LED_SHOWCASE_TEXT_ALPHA,
  PITCH,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
  WORLD_WIDTH,
  buildRandomRivalryLedConfig,
  computeCameraViewport,
  getBrandAd12sPhase,
  pickRandomLedShapePattern,
  pickRandomSponsorIndex,
  resolveBrandAdDisplayState,
  resolveDynamicBrandShowcase,
  type CameraViewport,
  type RandomRivalryLedConfig,
} from './rules';
import {
  render360TurntableToPixelGrid,
  type TurntableItemKind,
} from './shoeTurntablePixels';
import {
  drawExtraLedLayerTunnel,
  drawHighResClubCrest,
  drawHighResCompetitionLogoAt,
  drawHighResLedCityOverlay,
  drawHighResLedCompetitionLogoOverlay,
  drawHighResTrophyGraphic,
  drawLedTunnelPanel,
  drawPixelText,
  drawRivalrySpaceMiddlePanel,
  drawRivalrySpaceMiddleText,
  preloadCompetitionLogos,
} from './tunnelLogos';
import type {
  BallEntity,
  CompetitionId,
  LightingPreset,
  PlayerEntity,
  SetPieceType,
  StadiumTheme,
  Team,
  TeamSide,
} from './types';

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface RenderMatchParams {
  competitionId: CompetitionId;
  cupRoundLabel?: string;
  isRoadTo38?: boolean;
  isFinale38?: boolean;
  isUltimateTeam?: boolean;
  championTeam?: Team | null;
  trophyTitle?: string;
  stadium: StadiumTheme;
  lighting: LightingPreset;
  isRivalry: boolean;
  rivalryId?: string | null;
  rivalryTitle: string | null;
  matchSeed?: number;
  homeTeam: Team;
  awayTeam: Team;
  players: PlayerEntity[];
  activeHomePlayerId: string;
  ball: BallEntity;
  referee: {
    x: number;
    y: number;
    cardShown: 'YELLOW' | 'RED' | null;
    cardTimer: number;
  };
  setPiece: SetPieceType;
  setPieceTeam: TeamSide;
  setPieceAimAngle: number;
  shotCharge: number;
  goalNetRippleLeft: number;
  goalNetRippleRight: number;
  camera?: CameraViewport;
  shakeX: number;
  shakeY: number;
  time: number;
  ledTime?: number;
  celebrationBoost: number;
  intensity: number;
  particles: Particle[];
}

// Deterministic pixel crowd spectators spanning the full 960-unit stadium length
const CROWD_COLS = 93;
const CROWD_SEATS = Array.from({ length: CROWD_COLS * 4 }, (_, i) => {
  const row = Math.floor(i / CROWD_COLS);
  const col = i % CROWD_COLS;
  const palette = ['#ef4444', '#facc15', '#34b233', '#38bdf8', '#f472b6', '#ffffff', '#fb923c'];
  return {
    x: 14 + col * 10 + (row % 2) * 4,
    y: 22 + row * 7,
    shirt: palette[(i * 7 + row * 3) % palette.length],
    phase: i * 0.43,
  };
});

// Deterministic stars & descending rotating planets (Sun, Earth, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Moon)
const RIVALRY_LED_STARS = Array.from({ length: 112 }, (_, i) => ({
  x: (i * 53 + 11) % 840,
  y: (i * 7 + 3) % 12,
  phase: i * 0.8,
  fallSpeed: 6 + (i % 5) * 2.2,
}));

type CosmicBodyKind =
  | 'sun'
  | 'earth'
  | 'jupiter'
  | 'saturn'
  | 'mars'
  | 'venus'
  | 'mercury'
  | 'uranus'
  | 'neptune'
  | 'moon';

const RIVALRY_PLANETS: {
  kind: CosmicBodyKind;
  rx: number;
  offsetY: number;
  fallSpeed: number;
  rotSpeed: number;
  r: number;
  dir: 1 | -1;
}[] = [
  { kind: 'sun', rx: 0.05, offsetY: 1, fallSpeed: 10.5, rotSpeed: 1.9, r: 5.2, dir: 1 },
  { kind: 'mercury', rx: 0.12, offsetY: 11, fallSpeed: 14.0, rotSpeed: 2.6, r: 3.1, dir: -1 },
  { kind: 'venus', rx: 0.19, offsetY: 6, fallSpeed: 12.2, rotSpeed: -2.2, r: 4.1, dir: 1 },
  { kind: 'earth', rx: 0.27, offsetY: 16, fallSpeed: 11.4, rotSpeed: 2.4, r: 4.8, dir: -1 },
  { kind: 'mars', rx: 0.35, offsetY: 4, fallSpeed: 15.2, rotSpeed: 2.9, r: 3.7, dir: 1 },
  { kind: 'saturn', rx: 0.43, offsetY: 14, fallSpeed: 9.8, rotSpeed: 1.8, r: 4.5, dir: -1 },
  { kind: 'jupiter', rx: 0.51, offsetY: 2, fallSpeed: 10.8, rotSpeed: 3.2, r: 5.1, dir: 1 },
  { kind: 'earth', rx: 0.59, offsetY: 18, fallSpeed: 12.6, rotSpeed: 2.7, r: 4.6, dir: -1 },
  { kind: 'uranus', rx: 0.67, offsetY: 8, fallSpeed: 13.5, rotSpeed: -2.1, r: 3.9, dir: 1 },
  { kind: 'sun', rx: 0.75, offsetY: 15, fallSpeed: 11.0, rotSpeed: 2.3, r: 5.0, dir: -1 },
  { kind: 'neptune', rx: 0.83, offsetY: 5, fallSpeed: 14.4, rotSpeed: 2.5, r: 3.8, dir: 1 },
  { kind: 'moon', rx: 0.89, offsetY: 19, fallSpeed: 16.0, rotSpeed: 1.7, r: 3.2, dir: -1 },
  { kind: 'jupiter', rx: 0.94, offsetY: 10, fallSpeed: 12.0, rotSpeed: 3.0, r: 4.7, dir: 1 },
  { kind: 'saturn', rx: 0.98, offsetY: 22, fallSpeed: 10.4, rotSpeed: 2.0, r: 4.3, dir: -1 },
];

export class StadiumRenderer {
  private buffer: HTMLCanvasElement;
  private bctx: CanvasRenderingContext2D;
  private staticLayer: HTMLCanvasElement | null = null;
  private staticKey = '';

  constructor() {
    this.buffer = document.createElement('canvas');
    this.buffer.width = VIRTUAL_WIDTH;
    this.buffer.height = VIRTUAL_HEIGHT;
    const ctx = this.buffer.getContext('2d');
    if (!ctx) throw new Error('Unable to create offscreen 2D context');
    ctx.imageSmoothingEnabled = false;
    this.bctx = ctx;
    preloadBrandLogos();
    preloadCompetitionLogos();
  }

  private ensureStaticLayer(stadium: StadiumTheme, lighting: LightingPreset) {
    const key = `${stadium.id}:${lighting.id}:${WORLD_WIDTH}`;
    if (this.staticLayer && this.staticKey === key) return this.staticLayer;
    const c = document.createElement('canvas');
    c.width = WORLD_WIDTH;
    c.height = VIRTUAL_HEIGHT;
    const sctx = c.getContext('2d');
    if (!sctx) return null;
    sctx.imageSmoothingEnabled = false;
    this.drawStaticStadiumBackdrop(sctx, stadium, lighting);
    this.drawPitchLines(sctx, stadium);
    this.staticLayer = c;
    this.staticKey = key;
    return c;
  }

  public render(displayCanvas: HTMLCanvasElement, params: RenderMatchParams) {
    const ctx = this.bctx;
    ctx.imageSmoothingEnabled = false;

    const cam =
      params.camera ??
      computeCameraViewport({
        angle: 'tele_broadcast',
        targetX: params.ball.x,
        targetY: params.ball.y,
        attackDir: 1,
      });
    const zoom = cam.zoom;
    const viewLeft = cam.viewLeft - params.shakeX;
    const viewTop = cam.viewTop - params.shakeY;

    // Clean deep background frame for wide zoom angles
    ctx.fillStyle = params.lighting.skyTint || params.stadium.skyColor || '#070b18';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    ctx.fillStyle = params.stadium.surroundColor;
    ctx.fillRect(0, Math.max(0, Math.round((VIRTUAL_HEIGHT - viewTop) * zoom)), VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-viewLeft, -viewTop);

    // 1. Cached Static Stadium + Extended Pitch (960x288)
    const staticCanvas = this.ensureStaticLayer(params.stadium, params.lighting);
    if (staticCanvas) {
      ctx.drawImage(staticCanvas, 0, 0);
    }

    // 2. Animated 8-bit Cheering Crowd & Corner Flags
    this.drawAnimatedCrowdAndFlags(ctx, params.time, params.celebrationBoost, params.intensity);

    const isTrophyCeremony = params.setPiece === 'TROPHY_CELEBRATION';

    // 3. Pitch-Side & Endzone Animated Perimeter LED Boards
    this.drawPerimeterLedBoards(
      ctx,
      params.ledTime ?? params.time,
      params.celebrationBoost,
      params.competitionId,
      params.isRivalry,
      params.rivalryId ?? null,
      params.rivalryTitle,
      params.matchSeed ?? 2627,
      params.homeTeam.name,
      params.awayTeam.name,
      params.stadium.id,
      params.stadium.name,
      params.cupRoundLabel,
      Boolean(params.isRoadTo38),
      Boolean(params.isFinale38),
      isTrophyCeremony,
      Boolean(params.isUltimateTeam)
    );

    // 4. Goals (far away at left x=60 & right x=900)
    this.drawGoal(ctx, 'left', params.goalNetRippleLeft);
    this.drawGoal(ctx, 'right', params.goalNetRippleRight);

    // 4b. Trophy Celebration center-pitch stage podium
    if (isTrophyCeremony) {
      const winner = params.championTeam ?? params.homeTeam;
      const stageX = PITCH.centerX - 38;
      const stageY = PITCH.centerY + 4;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(stageX, stageY, 76, 18);
      ctx.fillStyle = winner.primaryColor;
      ctx.fillRect(stageX + 2, stageY + 2, 72, 12);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(stageX + 18, stageY - 5, 40, 7);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(stageX + 20, stageY - 4, 36, 2);
    }

    // 5. Aim guide during set pieces
    if (
      params.setPiece === 'FREE_KICK' ||
      params.setPiece === 'PENALTY' ||
      params.setPiece === 'PENALTY_SHOOTOUT' ||
      params.setPiece === 'CORNER_KICK' ||
      params.setPiece === 'THROW_IN' ||
      params.setPiece === 'GOAL_KICK'
    ) {
      if (params.setPieceTeam === 'home') {
        this.drawSetPieceAimArrow(ctx, params.ball.x, params.ball.y, params.setPieceAimAngle, params.shotCharge);
      }
    }

    // 6. Depth-sorted actors
    const drawables: { y: number; draw: () => void }[] = [];

    for (const p of params.players) {
      if (p.redCarded) continue;
      const team = p.team === 'home' ? params.homeTeam : params.awayTeam;
      const isControlled = p.id === params.activeHomePlayerId && params.setPiece !== 'PRE_KICKOFF' && !isTrophyCeremony;
      drawables.push({
        y: p.y,
        draw: () => this.drawPlayer(ctx, p, team, isControlled, params.ball.ownerId === p.id, params.shotCharge, params.time),
      });
    }

    drawables.push({
      y: params.referee.y,
      draw: () => this.drawReferee(ctx, params.referee),
    });

    if (!isTrophyCeremony) {
      drawables.push({
        y: params.ball.y + 1,
        draw: () => this.drawBall(ctx, params.ball, params.competitionId, params.time),
      });
    }

    drawables.sort((a, b) => a.y - b.y);
    for (const item of drawables) {
      item.draw();
    }

    // 7. Pooled pixel particles
    for (const pt of params.particles) {
      if (!pt.active) continue;
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.round(pt.x), Math.round(pt.y - pt.z), pt.size, pt.size);
    }

    // 8. Lighting Preset Atmosphere Overlay + Floodlight Beams across 960-unit stadium
    if (params.lighting.ambientTint) {
      ctx.fillStyle = params.lighting.ambientTint;
      ctx.fillRect(0, 0, WORLD_WIDTH, VIRTUAL_HEIGHT);
    }
    if (params.lighting.floodBeamAlpha > 0 || isTrophyCeremony || params.setPiece === 'PRE_KICKOFF') {
      const alpha = isTrophyCeremony ? 0.16 : params.setPiece === 'PRE_KICKOFF' ? 0.14 : params.lighting.floodBeamAlpha;
      ctx.fillStyle = `rgba(255, 255, 220, ${alpha})`;
      const towers = isTrophyCeremony ? [340, 480, 620] : [70, 230, 390, 570, 730, 890];
      for (const tx of towers) {
        ctx.beginPath();
        ctx.moveTo(tx - 6, 15);
        ctx.lineTo(tx + 6, 15);
        ctx.lineTo(tx + 46, isTrophyCeremony ? 200 : 140);
        ctx.lineTo(tx - 46, isTrophyCeremony ? 200 : 140);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();

    // 9. Screen-space Instant Replay Broadcast Frame & CRT Scanline Vignette
    if (params.setPiece === 'REPLAY') {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(3, 3, VIRTUAL_WIDTH - 6, VIRTUAL_HEIGHT - 6);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
      for (let sy = 0; sy < VIRTUAL_HEIGHT; sy += 4) {
        ctx.fillRect(0, sy, VIRTUAL_WIDTH, 1);
      }
      if (Math.floor(params.time * 4) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(10, 10, 5, 5);
      }
      drawPixelText(ctx, 'REPLAY', 38, 9, 1, '#ffffff', '#000000', '#991b1b');
    }

    // Blit crisp 8-bit buffer onto high-DPI viewport canvas
    const dctx = displayCanvas.getContext('2d');
    if (dctx) {
      dctx.imageSmoothingEnabled = false;
      dctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
      dctx.drawImage(this.buffer, 0, 0, displayCanvas.width, displayCanvas.height);

      const sx = displayCanvas.width / VIRTUAL_WIDTH;
      const sy = displayCanvas.height / VIRTUAL_HEIGHT;
      const wsx = zoom * sx;
      const wsy = zoom * sy;
      const wx = (worldX: number) => (worldX - viewLeft) * wsx;
      const wy = (worldY: number) => (worldY - viewTop) * wsy;

      const startX = PITCH.left;
      const totalW = PITCH.right - PITCH.left;
      const boardY = 55;
      const boardH = 12;
      const botY = PITCH.bottom + 7;
      const midW = 168;
      const sideW = Math.floor((totalW - midW) / 2); // 336 -> 3 panels of 112 each
      const midX = startX + sideW;
      const rightX = midX + midW;
      const rightW = startX + totalW - rightX;
      const ledTime = params.ledTime ?? params.time;

      // Multi-panel segmentation across the longer pitch (3 Left + 1 Mid + 3 Right per row = 14 horizontal panels + 4 endzone panels)
      const panelSegments = 3;
      const leftPanelW = sideW / panelSegments;
      const rightPanelW = rightW / panelSegments;

      dctx.save();

      if (isTrophyCeremony) {
        const winner = params.championTeam ?? params.homeTeam;
        this.drawHighResCosmicPlanetsOverlay(
          dctx,
          wx(startX),
          wy(47),
          totalW * wsx,
          7 * wsy,
          wsx,
          wsy,
          ledTime,
          true
        );
        this.drawHighResCosmicPlanetsOverlay(
          dctx,
          wx(startX),
          wy(boardY),
          totalW * wsx,
          boardH * wsy,
          wsx,
          wsy,
          ledTime,
          true
        );
        this.drawHighResCosmicPlanetsOverlay(
          dctx,
          wx(startX),
          wy(botY),
          totalW * wsx,
          11 * wsy,
          wsx,
          wsy,
          ledTime,
          true
        );

        this.drawHighResTrophyLedContent(
          dctx,
          wx(startX),
          wy(boardY),
          totalW * wsx,
          boardH * wsy,
          wx(midX),
          midW * wsx,
          wsx,
          wsy,
          ledTime,
          params.competitionId,
          winner,
          params.trophyTitle ?? 'CAAYVG LEAGUE'
        );
        this.drawHighResTrophyLedContent(
          dctx,
          wx(startX),
          wy(botY),
          totalW * wsx,
          11 * wsy,
          wx(midX),
          midW * wsx,
          wsx,
          wsy,
          ledTime + 1.2,
          params.competitionId,
          winner,
          params.trophyTitle ?? 'CAAYVG LEAGUE'
        );

        drawHighResTrophyGraphic(
          dctx,
          wx(PITCH.centerX),
          wy(PITCH.centerY - 12),
          28 * Math.min(wsx, wsy),
          ledTime * 3.1
        );

        dctx.restore();
        return;
      }

      const isClasico =
        params.isRivalry &&
        (params.rivalryId === 'the-clasico' || (!params.rivalryId && params.rivalryTitle === 'THE CLÁSICO')) &&
        params.competitionId === 'league' &&
        !params.isRoadTo38 &&
        !params.isFinale38;
      const isCustomRivalry =
        params.isRivalry && !isClasico && !params.isRoadTo38 && !params.isFinale38;
      const isEfootball = params.stadium.id === 'efootball-stadium';
      const matchSeed = params.matchSeed ?? 2627;

      if (isClasico) {
        const label = params.rivalryTitle ?? 'THE CLÁSICO';
        this.drawPixelatedClasicoSpaceOverlay(
          dctx,
          wx(startX),
          wy(boardY),
          totalW * wsx,
          boardH * wsy,
          480,
          boardH,
          ledTime
        );

        if (!isEfootball) {
          this.drawPixelatedClasicoSpaceOverlay(
            dctx,
            wx(startX),
            wy(botY),
            totalW * wsx,
            11 * wsy,
            480,
            11,
            ledTime + 0.6
          );
        } else {
          this.drawPixelatedClasicoSpaceOverlay(
            dctx,
            wx(midX),
            wy(botY),
            midW * wsx,
            11 * wsy,
            midW,
            11,
            ledTime + 0.6
          );
          this.drawHighResEfootballShapesFlank(dctx, wx(startX), wy(botY), sideW * wsx, 11 * wsy, wsx, wsy, ledTime, 0);
          this.drawHighResEfootballShapesFlank(dctx, wx(rightX), wy(botY), rightW * wsx, 11 * wsy, wsx, wsy, ledTime, 2);
        }

        dctx.save();
        dctx.scale(wsx, wsy);
        dctx.translate(-viewLeft, -viewTop);
        dctx.imageSmoothingEnabled = false;
        this.drawRivalryFlankText(dctx, startX, boardY, sideW, boardH, ledTime, label);
        drawRivalrySpaceMiddleText(dctx, midX, boardY, midW, boardH, ledTime, params.stadium.name, label);
        this.drawRivalryFlankText(dctx, rightX, boardY, rightW, boardH, ledTime, label);

        if (!isEfootball) {
          this.drawRivalryFlankText(dctx, startX, botY, sideW, 11, ledTime + 0.8, label);
          this.drawRivalryFlankText(dctx, rightX, botY, rightW, 11, ledTime + 0.8, label);
        }
        drawRivalrySpaceMiddleText(dctx, midX, botY, midW, 11, ledTime, params.stadium.name, label);

        dctx.fillStyle = '#1e293b';
        dctx.fillRect(midX - 1, boardY, 1, boardH);
        dctx.fillRect(rightX, boardY, 1, boardH);
        dctx.fillRect(midX - 1, botY, 1, 11);
        dctx.fillRect(rightX, botY, 1, 11);
        dctx.restore();
      } else if (isCustomRivalry) {
        const rivCfg = buildRandomRivalryLedConfig(
          params.rivalryId ?? 'custom-rivalry',
          params.rivalryTitle ?? 'RIVALRY DERBY',
          params.homeTeam.name,
          params.awayTeam.name,
          matchSeed
        );

        for (let seg = 0; seg < panelSegments; seg++) {
          this.drawHighResRandomRivalryFlank(
            dctx,
            wx(startX + seg * leftPanelW),
            wy(boardY),
            leftPanelW * wsx,
            boardH * wsy,
            wsx,
            wsy,
            rivCfg,
            ledTime + seg * 0.25,
            seg,
            params.homeTeam,
            params.awayTeam
          );
          this.drawHighResRandomRivalryFlank(
            dctx,
            wx(rightX + seg * rightPanelW),
            wy(boardY),
            rightPanelW * wsx,
            boardH * wsy,
            wsx,
            wsy,
            rivCfg,
            ledTime + seg * 0.25,
            seg + 3,
            params.homeTeam,
            params.awayTeam
          );
        }

        if (isEfootball) {
          this.drawHighResEfootballShapesFlank(dctx, wx(startX), wy(botY), sideW * wsx, 11 * wsy, wsx, wsy, ledTime, 0);
          this.drawHighResEfootballShapesFlank(dctx, wx(rightX), wy(botY), rightW * wsx, 11 * wsy, wsx, wsy, ledTime, 2);
        } else {
          for (let seg = 0; seg < panelSegments; seg++) {
            this.drawHighResRandomRivalryFlank(
              dctx,
              wx(startX + seg * leftPanelW),
              wy(botY),
              leftPanelW * wsx,
              11 * wsy,
              wsx,
              wsy,
              rivCfg,
              ledTime + 0.45 + seg * 0.2,
              seg + 6,
              params.homeTeam,
              params.awayTeam
            );
            this.drawHighResRandomRivalryFlank(
              dctx,
              wx(rightX + seg * rightPanelW),
              wy(botY),
              rightPanelW * wsx,
              11 * wsy,
              wsx,
              wsy,
              rivCfg,
              ledTime + 0.45 + seg * 0.2,
              seg + 9,
              params.homeTeam,
              params.awayTeam
            );
          }
        }

        dctx.save();
        dctx.scale(wsx, wsy);
        dctx.translate(-viewLeft, -viewTop);
        dctx.imageSmoothingEnabled = false;
        drawRivalrySpaceMiddleText(dctx, midX, boardY, midW, boardH, ledTime, params.stadium.name, rivCfg.headline, rivCfg.textColor);
        drawRivalrySpaceMiddleText(dctx, midX, botY, midW, 11, ledTime, params.stadium.name, rivCfg.headline, rivCfg.textColor);
        dctx.fillStyle = '#1e293b';
        dctx.fillRect(midX - 1, boardY, 1, boardH);
        dctx.fillRect(rightX, boardY, 1, boardH);
        dctx.fillRect(midX - 1, botY, 1, 11);
        dctx.fillRect(rightX, botY, 1, 11);
        dctx.restore();
      } else {
        // Expanded multi-panel Brand / UT Perimeter LEDs (3 Left + 3 Right Top, 3 Left + 3 Right Bottom, + 4 Endzone Goal-Line panels)
        const activeAds = getSponsorsForCompetition(params.competitionId, Boolean(params.isUltimateTeam));
        const adCount = activeAds.length;
        const cycleIdx = Math.max(0, Math.floor(ledTime / BRAND_AD_CYCLE_SECONDS));
        const { brandCycleIndex } = resolveBrandAdDisplayState(ledTime, cycleIdx);

        for (let seg = 0; seg < panelSegments; seg++) {
          const tLeftSlot = seg;
          const tRightSlot = panelSegments + seg;
          const tLeftAdIdx = pickRandomSponsorIndex(brandCycleIndex, tLeftSlot, adCount, matchSeed);
          const tRightAdIdx = pickRandomSponsorIndex(brandCycleIndex, tRightSlot, adCount, matchSeed);
          const tLeftAd = activeAds[tLeftAdIdx];
          const tRightAd = activeAds[tRightAdIdx];

          this.drawHighRes12sBrandAdFlank(
            dctx,
            wx(startX + seg * leftPanelW),
            wy(boardY),
            leftPanelW * wsx,
            boardH * wsy,
            wsx,
            wsy,
            tLeftAd,
            tLeftAdIdx + brandCycleIndex * 16 + tLeftSlot,
            ledTime,
            matchSeed,
            brandCycleIndex
          );
          this.drawHighRes12sBrandAdFlank(
            dctx,
            wx(rightX + seg * rightPanelW),
            wy(boardY),
            rightPanelW * wsx,
            boardH * wsy,
            wsx,
            wsy,
            tRightAd,
            tRightAdIdx + brandCycleIndex * 16 + tRightSlot,
            ledTime,
            matchSeed,
            brandCycleIndex
          );

          // Mullion dividers between expanded panels
          dctx.fillStyle = '#1e293b';
          if (seg > 0) {
            dctx.fillRect(wx(startX + seg * leftPanelW) - 1, wy(boardY), Math.max(1, wsx), boardH * wsy);
            dctx.fillRect(wx(rightX + seg * rightPanelW) - 1, wy(boardY), Math.max(1, wsx), boardH * wsy);
          }
        }

        if (isEfootball) {
          this.drawHighResEfootballShapesFlank(dctx, wx(startX), wy(botY), sideW * wsx, 11 * wsy, wsx, wsy, ledTime, 0);
          this.drawHighResEfootballShapesFlank(dctx, wx(rightX), wy(botY), rightW * wsx, 11 * wsy, wsx, wsy, ledTime, 2);
        } else {
          for (let seg = 0; seg < panelSegments; seg++) {
            const bLeftSlot = panelSegments * 2 + seg;
            const bRightSlot = panelSegments * 3 + seg;
            const bLeftAdIdx = pickRandomSponsorIndex(brandCycleIndex, bLeftSlot, adCount, matchSeed);
            const bRightAdIdx = pickRandomSponsorIndex(brandCycleIndex, bRightSlot, adCount, matchSeed);
            const bLeftAd = activeAds[bLeftAdIdx];
            const bRightAd = activeAds[bRightAdIdx];

            this.drawHighRes12sBrandAdFlank(
              dctx,
              wx(startX + seg * leftPanelW),
              wy(botY),
              leftPanelW * wsx,
              11 * wsy,
              wsx,
              wsy,
              bLeftAd,
              bLeftAdIdx + brandCycleIndex * 16 + bLeftSlot,
              ledTime,
              matchSeed,
              brandCycleIndex
            );
            this.drawHighRes12sBrandAdFlank(
              dctx,
              wx(rightX + seg * rightPanelW),
              wy(botY),
              rightPanelW * wsx,
              11 * wsy,
              wsx,
              wsy,
              bRightAd,
              bRightAdIdx + brandCycleIndex * 16 + bRightSlot,
              ledTime,
              matchSeed,
              brandCycleIndex
            );

            dctx.fillStyle = '#1e293b';
            if (seg > 0) {
              dctx.fillRect(wx(startX + seg * leftPanelW) - 1, wy(botY), Math.max(1, wsx), 11 * wsy);
              dctx.fillRect(wx(rightX + seg * rightPanelW) - 1, wy(botY), Math.max(1, wsx), 11 * wsy);
            }
          }
        }

        // 4 Goal-Line Endzone LED Panels (Left Top/Bottom beside left goal, Right Top/Bottom beside right goal)
        const endzoneBoards = [
          { x: PITCH.left - 24, y: PITCH.top + 2, w: 12, h: 62, slot: 12 },
          { x: PITCH.left - 24, y: PITCH.bottom - 64, w: 12, h: 62, slot: 13 },
          { x: PITCH.right + 12, y: PITCH.top + 2, w: 12, h: 62, slot: 14 },
          { x: PITCH.right + 12, y: PITCH.bottom - 64, w: 12, h: 62, slot: 15 },
        ];
        for (const ez of endzoneBoards) {
          const ezDx = wx(ez.x);
          const ezDy = wy(ez.y);
          const ezDw = ez.w * wsx;
          const ezDh = ez.h * wsy;
          if (ezDx + ezDw < 0 || ezDx > displayCanvas.width) continue;
          const ezIdx = pickRandomSponsorIndex(brandCycleIndex, ez.slot, adCount, matchSeed);
          const ezAd = activeAds[ezIdx];
          dctx.save();
          dctx.translate(ezDx + ezDw / 2, ezDy + ezDh / 2);
          dctx.rotate(ez.x < PITCH.centerX ? -Math.PI / 2 : Math.PI / 2);
          this.drawHighRes12sBrandAdFlank(
            dctx,
            -ezDh / 2,
            -ezDw / 2,
            ezDh,
            ezDw,
            wsx,
            wsy,
            ezAd,
            ezIdx + brandCycleIndex * 16 + ez.slot,
            ledTime,
            matchSeed,
            brandCycleIndex
          );
          dctx.restore();
        }
      }

      // BOTH Top and Bottom Middle LEDs render ALL-CAPS Pixelated City + Transparent Stadium Logo AND High-Res Competition Logo
      const activeMode: CompetitionId =
        params.isRivalry && params.competitionId === 'league' ? 'league' : params.competitionId;
      const useClasicoStyling = isClasico;
      const useRoad = Boolean(params.isRoadTo38);
      const useFinale = Boolean(params.isFinale38);

      drawHighResLedCityOverlay(
        dctx,
        wx(midX),
        wy(boardY),
        midW * wsx,
        boardH * wsy,
        activeMode,
        ledTime,
        params.stadium,
        useClasicoStyling,
        useRoad,
        useFinale
      );
      drawHighResLedCompetitionLogoOverlay(
        dctx,
        wx(midX),
        wy(boardY),
        midW * wsx,
        boardH * wsy,
        activeMode,
        ledTime,
        useClasicoStyling,
        useRoad,
        useFinale
      );

      drawHighResLedCityOverlay(
        dctx,
        wx(midX),
        wy(botY),
        midW * wsx,
        11 * wsy,
        activeMode,
        ledTime,
        params.stadium,
        useClasicoStyling,
        useRoad,
        useFinale
      );
      drawHighResLedCompetitionLogoOverlay(
        dctx,
        wx(midX),
        wy(botY),
        midW * wsx,
        11 * wsy,
        activeMode,
        ledTime,
        useClasicoStyling,
        useRoad,
        useFinale
      );

      dctx.restore();
    }
  }

  private drawStaticStadiumBackdrop(
    ctx: CanvasRenderingContext2D,
    stadium: StadiumTheme,
    lighting: LightingPreset
  ) {
    ctx.fillStyle = lighting.skyTint || stadium.skyColor;
    ctx.fillRect(0, 0, WORLD_WIDTH, VIRTUAL_HEIGHT);

    // Roof canopy & architectural silhouette per stadium image
    ctx.fillStyle = stadium.roofColor;
    ctx.fillRect(0, 0, WORLD_WIDTH, 20);
    if (stadium.archRoofStyle === 'white_canopy') {
      ctx.fillStyle = '#f8fafc';
      for (let rx = 20; rx < WORLD_WIDTH; rx += 44) {
        ctx.fillRect(rx, 0, 2, 18);
      }
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 15, WORLD_WIDTH, 3);
    } else if (stadium.archRoofStyle === 'lattice_arch') {
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, WORLD_WIDTH, 18);
      ctx.fillStyle = '#cbd5e1';
      for (let rx = 0; rx < WORLD_WIDTH; rx += 24) {
        ctx.fillRect(rx, 2, 2, 16);
        ctx.fillRect(rx + 10, 8, 4, 10);
      }
    } else if (stadium.archRoofStyle === 'gold_bowl') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 14, WORLD_WIDTH, 5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, 17, WORLD_WIDTH, 2);
    } else if (stadium.archRoofStyle === 'track_dome') {
      ctx.fillStyle = '#374151';
      for (let rx = 8; rx < WORLD_WIDTH; rx += 32) {
        ctx.fillRect(rx, 0, 2, 18);
      }
    } else if (stadium.archRoofStyle === 'efootball_blocks') {
      ctx.fillStyle = '#00008b';
      ctx.fillRect(0, 0, WORLD_WIDTH, 20);
      const blocks = ['#ef4444', '#facc15', '#38bdf8', '#f97316', '#22c55e'];
      for (let bx = 6, idx = 0; bx < WORLD_WIDTH; bx += 42, idx++) {
        ctx.fillStyle = blocks[idx % blocks.length];
        ctx.fillRect(bx, 3 + (idx % 2) * 4, 22, 8);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(bx + 22, 5 + (idx % 2) * 4, 5, 7);
      }
    }
    ctx.fillStyle = stadium.standStripeColor;
    ctx.fillRect(0, 18, WORLD_WIDTH, 2);

    // 6 Stadium Floodlights spanning 960-unit stadium
    const towers = [70, 230, 390, 570, 730, 890];
    for (const tx of towers) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(tx - 10, 4, 20, 11);
      ctx.fillStyle = stadium.floodlightColor;
      for (let lx = -7; lx <= 5; lx += 4) {
        ctx.fillRect(tx + lx, 6, 2, 2);
        ctx.fillRect(tx + lx, 10, 2, 2);
      }
    }

    // Concrete stand tiers
    ctx.fillStyle = stadium.standColor;
    ctx.fillRect(0, 21, WORLD_WIDTH, 35);
    ctx.fillStyle = stadium.standStripeColor;
    ctx.fillRect(0, 29, WORLD_WIDTH, 2);
    ctx.fillRect(0, 38, WORLD_WIDTH, 2);
    ctx.fillRect(0, 47, WORLD_WIDTH, 2);

    // Grass surround
    ctx.fillStyle = stadium.surroundColor;
    ctx.fillRect(0, 67, WORLD_WIDTH, VIRTUAL_HEIGHT - 67);

    // Terracotta Athletics Running Track surround (Prince Mohammed Bin Fahd Stadium)
    if (stadium.trackColor) {
      ctx.fillStyle = stadium.trackColor;
      ctx.fillRect(14, 70, WORLD_WIDTH - 28, VIRTUAL_HEIGHT - 74);
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(17, 72, WORLD_WIDTH - 34, VIRTUAL_HEIGHT - 78);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(18.5, 73.5, WORLD_WIDTH - 37, VIRTUAL_HEIGHT - 81);
      ctx.fillStyle = stadium.surroundColor;
      ctx.fillRect(PITCH.left - 26, PITCH.top - 5, PITCH.right - PITCH.left + 52, PITCH.bottom - PITCH.top + 10);
    }
  }

  private drawAnimatedCrowdAndFlags(
    ctx: CanvasRenderingContext2D,
    time: number,
    celebrationBoost: number,
    intensity: number
  ) {
    const speed = 2.5 + intensity * 6 + celebrationBoost * 10;
    const waveJump = intensity > 0.65 || celebrationBoost > 0.1;
    for (const fan of CROWD_SEATS) {
      const s = Math.sin(time * speed + fan.phase);
      const bob = s > 0.25 ? (waveJump ? -2 : -1) : 0;
      const y = fan.y + bob;
      ctx.fillStyle = fan.shirt;
      ctx.fillRect(fan.x, y, 4, 4);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(fan.x + 1, y - 2, 2, 2);
      if (waveJump && s > 0.5) {
        ctx.fillStyle = fan.shirt;
        ctx.fillRect(fan.x - 1, y - 2, 1, 2);
        ctx.fillRect(fan.x + 4, y - 2, 1, 2);
      }
    }

    // Fluttering 8-bit corner flags
    const flutter = Math.sin(time * 8) > 0 ? 1 : 0;
    const flags = [
      { x: PITCH.left, y: PITCH.top },
      { x: PITCH.right, y: PITCH.top },
      { x: PITCH.right, y: PITCH.bottom },
      { x: PITCH.left, y: PITCH.bottom },
    ];
    for (const f of flags) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(f.x, f.y - 6, 1, 6);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(f.x + 1, f.y - 6 + flutter, 3, 2);
    }
  }

  private drawRivalrySpaceLedStrip(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    time: number,
    biDirectionalStars = false
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // Pure deep space black background with downward & upward drifting twinkling stars
    ctx.fillStyle = '#02020b';
    ctx.fillRect(x, y, w, h);

    for (let i = 0; i < RIVALRY_LED_STARS.length; i++) {
      const st = RIVALRY_LED_STARS[i];
      const sx = x + ((st.x + Math.floor(time * 9)) % w);
      const goUp = biDirectionalStars && i % 2 === 1;
      const sy = goUp
        ? y + (h - 1 - (Math.floor((st.y + time * st.fallSpeed) % h)))
        : y + Math.floor((st.y + time * st.fallSpeed) % h);
      const twinkle = Math.sin(time * 7 + st.phase);
      if (twinkle > -0.3) {
        ctx.fillStyle = twinkle > 0.5 ? '#ffffff' : goUp ? '#fde047' : '#94a3b8';
        ctx.fillRect(sx, sy, 1, 1);
      }
    }

    ctx.restore();
  }

  private clasicoPixelBuf: HTMLCanvasElement | null = null;
  private trophyTextPixelBuf: HTMLCanvasElement | null = null;
  private sloganPixelBuf: HTMLCanvasElement | null = null;
  private itemRotBuf: HTMLCanvasElement | null = null;

  private drawRivalryFlankText(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    time: number,
    rivalryTitle: string
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    const label = (rivalryTitle || 'THE CLÁSICO').normalize('NFC').toUpperCase();
    const spacing = 136;
    const scrollOffset = (time * 42) % spacing;
    for (let cx = -spacing + scrollOffset; cx < w + spacing; cx += spacing) {
      drawPixelText(ctx, label, x + cx, y + Math.max(1, Math.floor((h - 7) / 2)), 1, '#ffff00', '#000000');
    }

    ctx.restore();
  }

  // Pixelated cosmic space strip for THE CLÁSICO:
  // Back: very zoomed-in pixelated Sun
  // Mid: smaller pixelated planets moving & rotating
  // Front: zoomed-in pixelated Earth turning around 2D center point AND slowly moving straight down
  private drawPixelatedClasicoSpaceOverlay(
    dctx: CanvasRenderingContext2D,
    stripX: number,
    stripY: number,
    stripW: number,
    stripH: number,
    virtualW: number,
    virtualH: number,
    time: number
  ) {
    const pw = Math.max(64, Math.round(virtualW * 2));
    const ph = Math.max(18, Math.round(virtualH * 2));
    if (!this.clasicoPixelBuf) this.clasicoPixelBuf = document.createElement('canvas');
    if (this.clasicoPixelBuf.width !== pw || this.clasicoPixelBuf.height !== ph) {
      this.clasicoPixelBuf.width = pw;
      this.clasicoPixelBuf.height = ph;
    }
    const pctx = this.clasicoPixelBuf.getContext('2d');
    if (!pctx) return;
    pctx.imageSmoothingEnabled = false;
    pctx.clearRect(0, 0, pw, ph);

    // Helper: draw crisp pixel-art disk with optional pixel banding
    const fillPixelCircle = (
      cx: number,
      cy: number,
      r: number,
      colorFn: (dx: number, dy: number, distSq: number, rSq: number) => string | null
    ) => {
      const ir = Math.ceil(r);
      const rSq = r * r;
      const ox = Math.round(cx);
      const oy = Math.round(cy);
      for (let dy = -ir; dy <= ir; dy++) {
        const py = oy + dy;
        if (py < 0 || py >= ph) continue;
        for (let dx = -ir; dx <= ir; dx++) {
          const px = ox + dx;
          if (px < 0 || px >= pw) continue;
          const dSq = dx * dx + dy * dy;
          if (dSq <= rSq) {
            const col = colorFn(dx, dy, dSq, rSq);
            if (col) {
              pctx.fillStyle = col;
              pctx.fillRect(px, py, 1, 1);
            }
          }
        }
      }
    };

    // LAYER 1 (BEHIND): Very zoomed-in pixelated Sun behind the planets!
    const sunCenters = pw > 500 ? [pw * 0.24, pw * 0.50, pw * 0.78] : [pw * 0.50];
    const bigSunR = Math.max(22, Math.round(ph * 1.15));
    for (let sIdx = 0; sIdx < sunCenters.length; sIdx++) {
      const scx = sunCenters[sIdx];
      const scy = ph * 0.52 + Math.sin(time * 0.8 + sIdx * 1.9) * 2;
      const flareRot = time * 0.55 + sIdx;
      // Stepped pixel solar corona rays behind the sun disk
      for (let ray = 0; ray < 14; ray++) {
        const a = flareRot + (ray / 14) * Math.PI * 2;
        const len = bigSunR + 5 + (ray % 2) * 3;
        for (let step = Math.floor(bigSunR * 0.8); step <= len; step++) {
          const rx = Math.round(scx + Math.cos(a) * step);
          const ry = Math.round(scy + Math.sin(a) * step);
          if (rx >= 0 && rx < pw && ry >= 0 && ry < ph) {
            pctx.fillStyle = step > bigSunR + 2 ? 'rgba(249, 115, 22, 0.72)' : '#fb923c';
            pctx.fillRect(rx, ry, 2, 2);
          }
        }
      }
      fillPixelCircle(scx, scy, bigSunR, (dx, dy, dSq, rSq) => {
        const ratio = Math.sqrt(dSq / rSq);
        const spot = Math.sin(dx * 0.35 + time * 1.6) * Math.cos(dy * 0.35 - time * 1.1);
        if (spot > 0.72 && ratio > 0.25 && ratio < 0.82) return '#c2410c';
        if (ratio < 0.35) return '#fef9c3';
        if (ratio < 0.68) return '#facc15';
        if (ratio < 0.88) return '#f97316';
        return '#ea580c';
      });
    }

    // LAYER 2 (MIDGROUND): Smaller pixelated planets descending & rotating
    for (let i = 0; i < RIVALRY_PLANETS.length; i++) {
      const p = RIVALRY_PLANETS[i];
      if (p.kind === 'earth' || p.kind === 'sun') continue; // Zoomed Earth & zoomed Sun drawn in own layers
      const pr = Math.max(4, Math.round(p.r * 1.35));
      const wrap = ph + pr * 3;
      const py = ((p.offsetY * 2 + time * p.fallSpeed * 1.45) % wrap) - pr * 1.5;
      const px = p.rx * pw + Math.sin(time * 1.1 + i) * 4;
      const rot = time * p.rotSpeed + i * 1.1;

      if (p.kind === 'saturn' || p.kind === 'uranus') {
        const ringCol = p.kind === 'saturn' ? '#fde047' : '#bae6fd';
        pctx.fillStyle = ringCol;
        const tilt = p.kind === 'saturn' ? -0.32 : 0.45;
        for (let t = -Math.PI; t < 0; t += 0.2) {
          const rx = Math.round(px + Math.cos(t) * pr * 1.65 * Math.cos(tilt) - Math.sin(t) * pr * 0.48 * Math.sin(tilt));
          const ry = Math.round(py + Math.cos(t) * pr * 1.65 * Math.sin(tilt) + Math.sin(t) * pr * 0.48 * Math.cos(tilt));
          pctx.fillRect(rx, ry, 2, 1);
        }
      }

      const pal: Record<string, [string, string, string]> = {
        jupiter: ['#fed7aa', '#ea580c', '#7c2d12'],
        saturn: ['#fef08a', '#eab308', '#854d0e'],
        mars: ['#fca5a5', '#ef4444', '#7f1d1d'],
        venus: ['#fde68a', '#f59e0b', '#92400e'],
        mercury: ['#e2e8f0', '#94a3b8', '#475569'],
        uranus: ['#bae6fd', '#38bdf8', '#0369a1'],
        neptune: ['#93c5fd', '#2563eb', '#1e3a8a'],
        moon: ['#f8fafc', '#cbd5e1', '#64748b'],
      };
      const [hi, mid, lo] = pal[p.kind] ?? pal.moon;
      fillPixelCircle(px, py, pr, (dx, dy, dSq, rSq) => {
        if (p.kind === 'jupiter' || p.kind === 'saturn') {
          if (p.kind === 'jupiter') {
            const spotDx = dx - Math.sin(rot) * pr * 0.45;
            const spotDy = dy - Math.round(pr * 0.25);
            if (spotDx * spotDx + spotDy * spotDy <= pr * 0.8) return '#ef4444';
          }
          if (Math.abs((dy + 2) % 3) === 0) return hi;
        }
        const shade = dx * 0.6 + dy * 0.6;
        if (dSq > rSq * 0.68 && shade > 0) return lo;
        if (shade < -pr * 0.25) return hi;
        return mid;
      });

      if (p.kind === 'saturn' || p.kind === 'uranus') {
        const ringCol = p.kind === 'saturn' ? '#fde047' : '#bae6fd';
        pctx.fillStyle = ringCol;
        const tilt = p.kind === 'saturn' ? -0.32 : 0.45;
        for (let t = 0; t <= Math.PI; t += 0.2) {
          const rx = Math.round(px + Math.cos(t) * pr * 1.65 * Math.cos(tilt) - Math.sin(t) * pr * 0.48 * Math.sin(tilt));
          const ry = Math.round(py + Math.cos(t) * pr * 1.65 * Math.sin(tilt) + Math.sin(t) * pr * 0.48 * Math.cos(tilt));
          pctx.fillRect(rx, ry, 2, 1);
        }
      }
    }

    // LAYER 3 (FOREGROUND): Zoomed-in pixelated Earth turning around 2D center point AND slowly going straight down
    const earthCenters = pw > 500 ? [pw * 0.14, pw * 0.50, pw * 0.86] : [pw * 0.50];
    const earthR = Math.max(10, Math.round(ph * 0.48));
    const earthWrap = ph + earthR * 2.6;
    for (let eIdx = 0; eIdx < earthCenters.length; eIdx++) {
      const ecx = earthCenters[eIdx];
      // Slow steady straight-down motion (starts mid-strip so Earth is always prominently visible)
      const eProgress = (ph * 0.55 + eIdx * 7.5 + time * 3.8) % earthWrap;
      const ecy = -earthR * 1.1 + eProgress;
      // Turning smoothly around 2D center point
      const rot2d = time * 2.3 + eIdx * 1.2;
      const cosA = Math.cos(-rot2d);
      const sinA = Math.sin(-rot2d);

      fillPixelCircle(ecx, ecy, earthR, (dx, dy, dSq, rSq) => {
        const lx = dx * cosA - dy * sinA;
        const ly = dx * sinA + dy * cosA;
        const nx = lx / earthR;
        const ny = ly / earthR;
        // White polar ice cap + swirling pixel cloud streaks
        if (Math.abs(ny) > 0.78) return '#f8fafc';
        if (Math.abs(ny - 0.15) < 0.14 && nx > -0.45 && nx < 0.4) return '#ffffff';
        // Continents (Americas / Eurasia pixel shapes rotating around 2D center)
        const c1 = (nx + 0.35) * (nx + 0.35) + (ny + 0.12) * (ny + 0.12) < 0.16;
        const c2 = (nx - 0.32) * (nx - 0.32) + (ny - 0.18) * (ny - 0.18) < 0.13;
        const c3 = (nx - 0.08) * (nx - 0.08) + (ny + 0.38) * (ny + 0.38) < 0.09;
        if (c1 || c2 || c3) {
          return dSq > rSq * 0.72 ? '#15803d' : '#22c55e';
        }
        if (dSq > rSq * 0.75 && dx + dy > 0) return '#1e3a8a';
        return dx + dy < -earthR * 0.25 ? '#38bdf8' : '#2563eb';
      });
    }

    const prevSmooth = dctx.imageSmoothingEnabled;
    dctx.imageSmoothingEnabled = false;
    dctx.drawImage(this.clasicoPixelBuf, stripX, stripY, stripW, stripH);
    dctx.imageSmoothingEnabled = prevSmooth;
  }

  private drawHighResCosmicPlanetsOverlay(
    dctx: CanvasRenderingContext2D,
    stripX: number,
    stripY: number,
    stripW: number,
    stripH: number,
    sx: number,
    sy: number,
    time: number,
    includeUpward: boolean
  ) {
    // Kept for Trophy Celebration cosmic LED strips
    dctx.save();
    dctx.beginPath();
    dctx.rect(stripX, stripY, stripW, stripH);
    dctx.clip();

    const unit = Math.min(sx, sy);
    const wrapH = stripH + 22 * unit;

    for (let i = 0; i < RIVALRY_PLANETS.length; i++) {
      const p = RIVALRY_PLANETS[i];
      const radius = p.r * unit;
      const moveProgress = (p.offsetY * unit * 1.4 + time * p.fallSpeed * sy) % wrapH;
      const goingUp = includeUpward && p.dir === -1;
      const py = goingUp
        ? stripY + stripH + 11 * unit - moveProgress
        : stripY - 11 * unit + moveProgress;
      const px = stripX + p.rx * stripW + Math.sin(time * 1.2 + i * 0.9) * 3.5 * unit;
      const rot = time * p.rotSpeed + i * 1.1;

      if (p.kind === 'sun') {
        const grad = dctx.createRadialGradient(px - radius * 0.25, py - radius * 0.25, radius * 0.15, px, py, radius);
        grad.addColorStop(0, '#fef9c3');
        grad.addColorStop(0.55, '#facc15');
        grad.addColorStop(1, '#ea580c');
        dctx.fillStyle = grad;
        dctx.beginPath();
        dctx.arc(px, py, radius, 0, Math.PI * 2);
        dctx.fill();
        continue;
      }

      if (p.kind === 'saturn' || p.kind === 'uranus') {
        const ringCol = p.kind === 'saturn' ? '#fde047' : '#bae6fd';
        dctx.save();
        dctx.translate(px, py);
        dctx.rotate(p.kind === 'saturn' ? -0.32 : 0.48);
        dctx.strokeStyle = ringCol;
        dctx.lineWidth = Math.max(1.5, unit * 0.8);
        dctx.beginPath();
        dctx.ellipse(0, 0, radius * 1.75, radius * 0.52, 0, 0, Math.PI * 2);
        dctx.stroke();
        dctx.restore();
      }

      const palette: Record<Exclude<CosmicBodyKind, 'sun'>, [string, string]> = {
        earth: ['#38bdf8', '#1d4ed8'],
        jupiter: ['#fed7aa', '#c2410c'],
        saturn: ['#fef08a', '#ca8a04'],
        mars: ['#f87171', '#991b1b'],
        venus: ['#fde68a', '#d97706'],
        mercury: ['#cbd5e1', '#64748b'],
        uranus: ['#7dd3fc', '#0284c7'],
        neptune: ['#60a5fa', '#1e3a8a'],
        moon: ['#f1f5f9', '#64748b'],
      };
      const [lightCol, darkCol] = palette[p.kind];
      const sphereGrad = dctx.createRadialGradient(px - radius * 0.3, py - radius * 0.3, radius * 0.15, px, py, radius);
      sphereGrad.addColorStop(0, lightCol);
      sphereGrad.addColorStop(1, darkCol);
      dctx.fillStyle = sphereGrad;
      dctx.beginPath();
      dctx.arc(px, py, radius, 0, Math.PI * 2);
      dctx.fill();

      if (p.kind === 'earth') {
        dctx.fillStyle = '#22c55e';
        dctx.beginPath();
        dctx.arc(px + Math.sin(rot) * radius * 0.35, py, radius * 0.38, 0, Math.PI * 2);
        dctx.fill();
      }
    }

    dctx.restore();
  }

  // Background with 35 brand-new randomly generated geometric shape patterns
  private draw12sBrandFlankBackdrop(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    ad: LedSponsorAd,
    adSlotSeed: number,
    time: number,
    celebrationBoost: number,
    frameTick: number,
    matchSeed = 2627,
    cycleIdx = 0
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    const { phase } = getBrandAd12sPhase(time);
    const inShowcase =
      phase === 'shoes_fly_down' || phase === 'shoes_name_hold' || phase === 'exit_down';
    const dynamicShowcase = inShowcase
      ? resolveDynamicBrandShowcase(ad, matchSeed, adSlotSeed, cycleIdx, time)
      : null;

    const isFlash = celebrationBoost > 0.2 && frameTick % 2 === 0;
    ctx.fillStyle = isFlash ? '#facc15' : dynamicShowcase ? dynamicShowcase.bgColor : ad.bgColor;
    ctx.fillRect(x, y, w, h);

    const shapeKind: LedNewShapePatternKind = dynamicShowcase
      ? LED_NEW_SHAPE_PATTERNS[dynamicShowcase.shapePatternIdx] ??
        pickRandomLedShapePattern(cycleIdx, adSlotSeed, matchSeed)
      : pickRandomLedShapePattern(cycleIdx, adSlotSeed, matchSeed);
    const prim = dynamicShowcase?.accentColor || ad.accentColor || '#38bdf8';
    const sec = dynamicShowcase?.textColor || ad.fgColor || '#ffffff';
    const rb = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#a855f7'];
    ctx.fillStyle = prim;
    ctx.strokeStyle = prim;

    switch (shapeKind) {
      case 'diamonds_cascade': {
        ctx.globalAlpha = 0.42;
        const step = 14;
        const off = (time * 24) % step;
        for (let cx = x - step + off; cx < x + w + step; cx += step) {
          ctx.fillStyle = Math.floor(cx / step) % 2 === 0 ? prim : sec;
          ctx.beginPath();
          ctx.moveTo(cx, y + 1);
          ctx.lineTo(cx + 5, y + h * 0.5);
          ctx.lineTo(cx, y + h - 1);
          ctx.lineTo(cx - 5, y + h * 0.5);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'hex_honeycomb': {
        ctx.globalAlpha = 0.36;
        const step = 12;
        const shift = (time * 16) % step;
        for (let cx = x + shift; cx < x + w + step; cx += step) {
          const cy = y + (Math.floor(cx / step) % 2 === 0 ? h * 0.35 : h * 0.65);
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2;
            const px = cx + Math.cos(a) * 4;
            const py = cy + Math.sin(a) * 4;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
        break;
      }
      case 'spinning_triangles': {
        ctx.globalAlpha = 0.44;
        for (let i = 0; i < 8; i++) {
          const cx = x + ((i + 0.5) / 8) * w;
          const cy = y + h * 0.5;
          const ang = time * 3.2 + i * 0.7;
          ctx.fillStyle = i % 2 === 0 ? prim : sec;
          ctx.beginPath();
          for (let k = 0; k < 3; k++) {
            const a = ang + (k / 3) * Math.PI * 2;
            const px = cx + Math.cos(a) * 4.5;
            const py = cy + Math.sin(a) * 4.5;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'orbit_circles': {
        ctx.globalAlpha = 0.44;
        for (let i = 0; i < 10; i++) {
          const cx = x + ((i * 19 + time * 26) % w);
          const cy = y + h * 0.5 + Math.sin(time * 5 + i) * (h * 0.32);
          ctx.fillStyle = i % 2 === 0 ? prim : sec;
          ctx.beginPath();
          ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'pixel_stars': {
        ctx.globalAlpha = 0.48;
        for (let s = 0; s < 9; s++) {
          const sx = x + Math.floor(((s * 21 + time * 20) % w));
          const sy = y + Math.floor(((s * 5 + Math.sin(time * 4 + s) * 3 + h * 0.5) % Math.max(4, h - 3)));
          ctx.fillStyle = rb[(s + Math.floor(time * 4)) % rb.length];
          ctx.fillRect(sx - 2, sy, 5, 1);
          ctx.fillRect(sx, sy - 2, 1, 5);
        }
        break;
      }
      case 'zigzag_chevrons': {
        ctx.globalAlpha = 0.40;
        const step = 12;
        const off = (time * 32) % step;
        ctx.lineWidth = 1.5;
        for (let cx = x - step + off; cx < x + w + step; cx += step) {
          ctx.strokeStyle = Math.floor(cx / step) % 2 === 0 ? prim : sec;
          ctx.beginPath();
          ctx.moveTo(cx, y + 1);
          ctx.lineTo(cx + 5, y + h * 0.5);
          ctx.lineTo(cx, y + h - 1);
          ctx.stroke();
        }
        break;
      }
      case 'crosshair_grid': {
        ctx.globalAlpha = 0.36;
        const pulse = Math.floor(time * 6) % 2;
        for (let cx = x + 6; cx < x + w; cx += 14) {
          ctx.fillStyle = ((cx + pulse) % 28 < 14) ? prim : sec;
          ctx.fillRect(cx - 3, y + Math.floor(h / 2), 7, 1);
          ctx.fillRect(cx, y + Math.floor(h / 2) - 3, 1, 7);
        }
        break;
      }
      case 'falling_tetrominoes': {
        ctx.globalAlpha = 0.42;
        for (let i = 0; i < 8; i++) {
          const bx = x + ((i * 22) % Math.max(8, w - 6));
          const by = y + ((Math.floor(time * 18) + i * 5) % h);
          ctx.fillStyle = rb[i % rb.length];
          ctx.fillRect(bx, by % h, 4, 2);
          ctx.fillRect(bx + 2, (by + 2) % h, 4, 2);
        }
        break;
      }
      case 'spiral_squares': {
        ctx.globalAlpha = 0.40;
        for (let i = 0; i < 7; i++) {
          const cx = x + ((i + 0.5) / 7) * w;
          const s = 2 + ((Math.sin(time * 6 + i) + 1) * 2.5);
          ctx.strokeStyle = i % 2 === 0 ? prim : sec;
          ctx.strokeRect(cx - s / 2, y + h * 0.5 - s / 2, s, s);
        }
        break;
      }
      case 'bouncing_capsules': {
        ctx.globalAlpha = 0.42;
        for (let i = 0; i < 9; i++) {
          const bx = x + ((i * 18 + time * 24) % w);
          const bh = 3 + Math.round(((Math.sin(time * 8 + i) + 1) * 0.5) * Math.max(2, h - 5));
          ctx.fillStyle = i % 2 === 0 ? prim : sec;
          ctx.fillRect(bx, y + h - bh, 5, 3);
        }
        break;
      }
      case 'concentric_rings': {
        ctx.globalAlpha = 0.42;
        const p = (time * 1.4) % 1;
        for (let i = 0; i < 4; i++) {
          const cx = x + ((i + 0.5) / 4) * w;
          const r = 2 + p * (h * 0.9);
          ctx.strokeStyle = i % 2 === 0 ? prim : sec;
          ctx.beginPath();
          ctx.arc(cx, y + h / 2, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }
      case 'sunburst_rays': {
        ctx.globalAlpha = 0.36;
        const cx = x + w / 2;
        const cy = y + h / 2;
        for (let i = 0; i < 10; i++) {
          const a = time * 1.6 + (i / 10) * Math.PI * 2;
          ctx.strokeStyle = i % 2 === 0 ? prim : sec;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * w * 0.55, cy + Math.sin(a) * h * 1.4);
          ctx.stroke();
        }
        break;
      }
      case 'kaleidoscope_petals': {
        ctx.globalAlpha = 0.44;
        for (let i = 0; i < 6; i++) {
          const cx = x + ((i + 0.5) / 6) * w;
          const cy = y + h / 2;
          ctx.fillStyle = rb[(i + Math.floor(time * 3)) % rb.length];
          for (let p = 0; p < 4; p++) {
            const a = time * 2.5 + (p * Math.PI) / 2;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
      case 'shield_crests': {
        ctx.globalAlpha = 0.38;
        for (let cx = x + 10; cx < x + w; cx += 18) {
          ctx.strokeStyle = (Math.floor(cx / 18) + frameTick) % 3 === 0 ? sec : prim;
          ctx.beginPath();
          ctx.moveTo(cx - 4, y + 2);
          ctx.lineTo(cx + 4, y + 2);
          ctx.lineTo(cx + 4, y + h * 0.6);
          ctx.lineTo(cx, y + h - 1);
          ctx.lineTo(cx - 4, y + h * 0.6);
          ctx.closePath();
          ctx.stroke();
        }
        break;
      }
      case 'comet_streaks': {
        ctx.globalAlpha = 0.45;
        for (let i = 0; i < 6; i++) {
          const cx = x + ((i * 31 + time * 72) % (w + 16)) - 8;
          const cy = y + 2 + ((i * 3) % Math.max(3, h - 4));
          ctx.fillStyle = sec;
          ctx.fillRect(cx, cy, 4, 2);
          ctx.fillStyle = prim;
          ctx.fillRect(cx - 8, cy, 8, 1);
        }
        break;
      }
      case 'octagon_pulse': {
        ctx.globalAlpha = 0.40;
        const r = 2.5 + ((Math.sin(time * 7) + 1) * 1.4);
        for (let cx = x + 10; cx < x + w; cx += 16) {
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            const px = cx + Math.cos(a) * r;
            const py = y + h / 2 + Math.sin(a) * r;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
        break;
      }
      case 'crescent_moons': {
        ctx.globalAlpha = 0.42;
        const shift = (time * 22) % 16;
        for (let cx = x - 16 + shift; cx < x + w + 16; cx += 16) {
          ctx.fillStyle = prim;
          ctx.beginPath();
          ctx.arc(cx, y + h / 2, 4, -Math.PI * 0.65, Math.PI * 0.65);
          ctx.arc(cx + 2, y + h / 2, 3, Math.PI * 0.6, -Math.PI * 0.6, true);
          ctx.fill();
        }
        break;
      }
      case 'gear_cogs': {
        ctx.globalAlpha = 0.38;
        for (let i = 0; i < 6; i++) {
          const cx = x + ((i + 0.5) / 6) * w;
          const cy = y + h / 2;
          const dir = i % 2 === 0 ? 1 : -1;
          for (let t = 0; t < 6; t++) {
            const a = dir * time * 2.8 + (t / 6) * Math.PI * 2;
            ctx.fillRect(Math.round(cx + Math.cos(a) * 4), Math.round(cy + Math.sin(a) * 3.5), 2, 2);
          }
        }
        break;
      }
      case 'crystal_shards': {
        ctx.globalAlpha = 0.42;
        for (let i = 0; i < 10; i++) {
          const cx = x + ((i * 17 + time * 18) % w);
          ctx.fillStyle = i % 2 === 0 ? prim : sec;
          ctx.beginPath();
          ctx.moveTo(cx, y + 1);
          ctx.lineTo(cx + 4, y + h - 1);
          ctx.lineTo(cx - 2, y + h - 2);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'ribbon_helix': {
        ctx.globalAlpha = 0.44;
        for (let rx = 0; rx < w; rx += 4) {
          const y1 = y + Math.round(((Math.sin(time * 6 + rx * 0.14) + 1) * 0.5) * Math.max(2, h - 3));
          const y2 = y + Math.round(((Math.sin(time * 6 + rx * 0.14 + Math.PI) + 1) * 0.5) * Math.max(2, h - 3));
          ctx.fillStyle = prim;
          ctx.fillRect(x + rx, y1, 3, 2);
          ctx.fillStyle = sec;
          ctx.fillRect(x + rx, y2, 3, 2);
        }
        break;
      }
      case 'halftone_waves': {
        ctx.globalAlpha = 0.42;
        for (let gx = 4; gx < w; gx += 7) {
          for (let gy = 2; gy < h; gy += 4) {
            const rad = 0.8 + ((Math.sin(time * 6 + gx * 0.12 + gy * 0.2) + 1) * 0.75);
            ctx.beginPath();
            ctx.arc(x + gx, y + gy, rad, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
      case 'diamond_lattice': {
        ctx.globalAlpha = 0.34;
        const off = (time * 16) % 10;
        for (let lx = x - 10 + off; lx < x + w + 10; lx += 10) {
          ctx.beginPath();
          ctx.moveTo(lx, y);
          ctx.lineTo(lx + h, y + h);
          ctx.moveTo(lx + h, y);
          ctx.lineTo(lx, y + h);
          ctx.stroke();
        }
        break;
      }
      case 'heart_spades': {
        ctx.globalAlpha = 0.44;
        for (let i = 0; i < 8; i++) {
          const cx = x + ((i * 21 + time * 22) % w);
          const cy = y + Math.floor(h / 2);
          ctx.fillStyle = i % 2 === 0 ? '#f43f5e' : prim;
          ctx.fillRect(cx - 2, cy - 2, 2, 2);
          ctx.fillRect(cx + 1, cy - 2, 2, 2);
          ctx.fillRect(cx - 1, cy, 3, 2);
          ctx.fillRect(cx, cy + 2, 1, 1);
        }
        break;
      }
      case 'pixel_crowns': {
        ctx.globalAlpha = 0.44;
        const off = (time * 20) % 18;
        for (let cx = x - 18 + off; cx < x + w + 18; cx += 18) {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(cx - 3, y + h - 5, 7, 3);
          ctx.fillRect(cx - 3, y + h - 7, 1, 2);
          ctx.fillRect(cx, y + h - 8, 1, 3);
          ctx.fillRect(cx + 3, y + h - 7, 1, 2);
        }
        break;
      }
      case 'cyber_brackets': {
        ctx.globalAlpha = 0.42;
        const off = (time * 36) % 16;
        for (let cx = x - 16 + off; cx < x + w + 16; cx += 16) {
          ctx.fillStyle = Math.floor(cx / 16) % 2 === 0 ? prim : sec;
          ctx.fillRect(cx, y + 2, 4, 1);
          ctx.fillRect(cx, y + 2, 1, h - 4);
          ctx.fillRect(cx, y + h - 3, 4, 1);
        }
        break;
      }
      case 'meteor_rain': {
        ctx.globalAlpha = 0.45;
        for (let i = 0; i < 9; i++) {
          const mx = x + ((i * 23 + Math.floor(time * 28)) % w);
          const my = y + ((i * 4 + Math.floor(time * 28)) % h);
          ctx.fillStyle = rb[i % rb.length];
          ctx.fillRect(mx, my, 3, 2);
          ctx.fillRect(mx - 2, (my - 2 + h) % h, 2, 1);
        }
        break;
      }
      case 'arcade_blocks': {
        ctx.globalAlpha = 0.36;
        for (let gx = 0; gx < w; gx += 10) {
          for (let gy = 0; gy < h; gy += 5) {
            const idx = Math.floor(gx / 10 + gy / 5 + time * 5);
            if (idx % 2 === 0) {
              ctx.fillStyle = rb[idx % rb.length];
              ctx.fillRect(x + gx, y + gy, 8, 4);
            }
          }
        }
        break;
      }
      case 'radar_arcs': {
        ctx.globalAlpha = 0.42;
        for (let i = 0; i < 4; i++) {
          const cx = x + ((i + 0.5) / 4) * w;
          const a = time * 4 + i;
          ctx.beginPath();
          ctx.arc(cx, y + h / 2, h * 0.44, a, a + Math.PI * 0.9);
          ctx.stroke();
        }
        break;
      }
      case 'pinwheel_blades': {
        ctx.globalAlpha = 0.42;
        for (let i = 0; i < 6; i++) {
          const cx = x + ((i + 0.5) / 6) * w;
          const cy = y + h / 2;
          for (let b = 0; b < 4; b++) {
            const a = time * 4.5 + (b * Math.PI) / 2;
            ctx.strokeStyle = b % 2 === 0 ? prim : sec;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 4.5);
            ctx.stroke();
          }
        }
        break;
      }
      case 'sine_bars': {
        ctx.globalAlpha = 0.42;
        for (let bx = 2; bx < w; bx += 5) {
          const barH = 2 + Math.floor(((Math.sin(time * 8 + bx * 0.25) + 1) * 0.5) * Math.max(2, h - 3));
          ctx.fillStyle = Math.floor(bx / 5) % 2 === 0 ? prim : sec;
          ctx.fillRect(x + bx, y + Math.floor((h - barH) / 2), 3, barH);
        }
        break;
      }
      case 'isometric_cubes': {
        ctx.globalAlpha = 0.38;
        const off = (time * 18) % 14;
        for (let cx = x - 14 + off; cx < x + w + 14; cx += 14) {
          ctx.fillStyle = prim;
          ctx.fillRect(cx, y + 2, 6, 4);
          ctx.fillStyle = sec;
          ctx.fillRect(cx + 3, y + 5, 6, 4);
        }
        break;
      }
      case 'bowtie_ribbons': {
        ctx.globalAlpha = 0.42;
        const off = (time * 24) % 16;
        for (let cx = x - 16 + off; cx < x + w + 16; cx += 16) {
          ctx.fillStyle = Math.floor(cx / 16) % 2 === 0 ? prim : sec;
          ctx.beginPath();
          ctx.moveTo(cx - 5, y + 2);
          ctx.lineTo(cx + 5, y + h - 2);
          ctx.lineTo(cx + 5, y + 2);
          ctx.lineTo(cx - 5, y + h - 2);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'polka_bounce': {
        ctx.globalAlpha = 0.45;
        for (let i = 0; i < 12; i++) {
          const px = x + ((i + 0.5) / 12) * w;
          const py = y + h * 0.5 + Math.abs(Math.sin(time * 6 + i * 0.6)) * (h * 0.32) - h * 0.16;
          ctx.fillStyle = rb[i % rb.length];
          ctx.beginPath();
          ctx.arc(px, py, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'lightning_zigs': {
        ctx.globalAlpha = 0.48;
        for (let i = 0; i < 5; i++) {
          const lx = x + ((i * 33 + Math.floor(time * 28)) % w);
          ctx.strokeStyle = i % 2 === 0 ? '#facc15' : prim;
          ctx.beginPath();
          ctx.moveTo(lx, y + 1);
          ctx.lineTo(lx + 4, y + h * 0.45);
          ctx.lineTo(lx - 2, y + h * 0.55);
          ctx.lineTo(lx + 3, y + h - 1);
          ctx.stroke();
        }
        break;
      }
      case 'arrow_streams':
      default: {
        ctx.globalAlpha = 0.44;
        const off = (time * 38) % 14;
        for (let ax = x - 14 + off; ax < x + w + 14; ax += 14) {
          ctx.fillStyle = Math.floor(ax / 14) % 2 === 0 ? prim : sec;
          ctx.fillRect(ax, y + Math.floor(h / 2), 6, 1);
          ctx.fillRect(ax + 4, y + Math.floor(h / 2) - 2, 2, 5);
        }
        break;
      }
    }

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.restore();
  }

  // 8-bit pixelated 360-degree upright Y-axis turntable Nike/Adidas/Puma sneakers & sodas (no flat circle spin)
  private draw8BitRotatingItem(
    dctx: CanvasRenderingContext2D,
    kind: TurntableItemKind,
    cx: number,
    cy: number,
    size: number,
    angle: number,
    primaryCol: string,
    accentCol: string
  ) {
    const bufW = 40;
    const bufH = 28;
    if (!this.itemRotBuf || this.itemRotBuf.width !== bufW || this.itemRotBuf.height !== bufH) {
      this.itemRotBuf = document.createElement('canvas');
      this.itemRotBuf.width = bufW;
      this.itemRotBuf.height = bufH;
    }

    const rctx = this.itemRotBuf.getContext('2d');
    if (!rctx) return;

    const { colors } = render360TurntableToPixelGrid(
      kind,
      angle,
      primaryCol,
      accentCol,
      bufW,
      bufH
    );

    rctx.imageSmoothingEnabled = false;
    rctx.clearRect(0, 0, bufW, bufH);
    for (let y = 0; y < bufH; y++) {
      for (let x = 0; x < bufW; x++) {
        const col = colors[y * bufW + x];
        if (!col) continue;
        rctx.fillStyle = col;
        rctx.fillRect(x, y, 1, 1);
      }
    }

    const drawH = size;
    const drawW = drawH * (bufW / bufH);
    const prevSmooth = dctx.imageSmoothingEnabled;
    dctx.imageSmoothingEnabled = false;
    dctx.drawImage(this.itemRotBuf, Math.round(cx - drawW / 2), Math.round(cy - drawH / 2), Math.round(drawW), Math.round(drawH));
    dctx.imageSmoothingEnabled = prevSmooth;
  }

  // Draw crisp normal-sized pixelated text onto a quantized buffer and upscale onto displayCanvas.
  // Never shrinks characters below normal LED size; long strings smoothly marquee-scroll horizontally.
  private drawPixelatedBannerText(
    dctx: CanvasRenderingContext2D,
    text: string,
    clipX: number,
    _clipY: number,
    clipW: number,
    clipH: number,
    drawY: number,
    color: string,
    outlineColor: string,
    scrollOffsetPx?: number,
    pixelStepOverride?: number,
    marqueeTime = 0,
    textAlpha = 1.0
  ) {
    const upper = text
      .normalize('NFC')
      .toUpperCase()
      .replace(/[^A-ZÁÃÉ0-9 .:/!-]/g, ' ');
    const pixelStep = Math.max(2, pixelStepOverride ?? Math.round(clipH / 10.5));
    const bufW = Math.max(48, Math.round(clipW / pixelStep));
    const bufH = Math.max(10, Math.round(clipH / pixelStep));
    if (!this.sloganPixelBuf) this.sloganPixelBuf = document.createElement('canvas');
    if (this.sloganPixelBuf.width !== bufW || this.sloganPixelBuf.height !== bufH) {
      this.sloganPixelBuf.width = bufW;
      this.sloganPixelBuf.height = bufH;
    }
    const pctx = this.sloganPixelBuf.getContext('2d');
    if (!pctx) return;
    pctx.imageSmoothingEnabled = false;
    pctx.clearRect(0, 0, bufW, bufH);

    const baseY = Math.max(1, Math.floor((bufH - 7) / 2));
    const rawTextW = Math.max(5, upper.length * 6 - 1);
    const shouldMarquee = scrollOffsetPx !== undefined || rawTextW > bufW - 4;

    if (shouldMarquee) {
      const activeScroll =
        scrollOffsetPx !== undefined
          ? scrollOffsetPx
          : -Math.floor(marqueeTime * 28);
      const unitW = Math.max(44, rawTextW + 20);
      const off = ((activeScroll % unitW) + unitW) % unitW;
      for (let rx = -unitW + off; rx < bufW + unitW; rx += unitW) {
        drawPixelText(pctx, upper, rx + rawTextW / 2, baseY, 1, color, outlineColor);
      }
    } else {
      drawPixelText(pctx, upper, bufW / 2, baseY, 1, color, outlineColor);
    }

    const prevSmooth = dctx.imageSmoothingEnabled;
    const prevAlpha = dctx.globalAlpha;
    dctx.imageSmoothingEnabled = false;
    dctx.globalAlpha = prevAlpha * textAlpha;
    dctx.drawImage(this.sloganPixelBuf, clipX, drawY, clipW, clipH);
    dctx.globalAlpha = prevAlpha;
    dctx.imageSmoothingEnabled = prevSmooth;
  }

  // High-DPI 12-second brand LED timeline (v3.1.0):
  // 0.0..0.7s   (0.7s): Real brand ad logo holds centered first, then flies straight downward off the LED board (NO 360° item yet)
  // 0.7..2.2s   (1.5s): 360-degree rotating item (middle, behind 30%-transparent text) flies down
  // 2.2..9.2s   (7.0s): 360-degree rotating item in middle behind 30%-transparent text (item/flavor/name/bg color switch every 1.5s)
  // 9.2..10.7s  (1.5s): 360-degree rotating item + 30%-transparent text exit downward (10s showcase)
  // 10.7..11.4s (0.7s): Next brand's real logo flies straight downward first into place
  // 11.4..12.0s (0.6s): Next brand's real logo holds cleanly centered before cycleIdx switches
  private drawHighRes12sBrandAdFlank(
    dctx: CanvasRenderingContext2D,
    stripX: number,
    stripY: number,
    stripW: number,
    stripH: number,
    _sx: number,
    sy: number,
    ad: LedSponsorAd,
    adSlotSeed: number,
    time: number,
    matchSeed = 2627,
    cycleIdx = 0
  ) {
    const { phase, progress } = getBrandAd12sPhase(time);

    dctx.save();
    dctx.beginPath();
    dctx.rect(stripX, stripY, stripW, stripH);
    dctx.clip();

    const drawRealBrandLogo = (centerX: number, centerY: number, logoHeight: number) => {
      const sprite = getBrandLogoSpriteForBrand(ad.brand, ad.brandLogo);
      if (!sprite) return;
      dctx.save();
      const prevSmooth = dctx.imageSmoothingEnabled;
      dctx.imageSmoothingEnabled = true;
      dctx.imageSmoothingQuality = 'high';
      dctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      dctx.shadowBlur = Math.max(3, 3 * sy);

      const aspect = sprite.width / sprite.height;
      const maxW = stripW * 0.78;
      let dh = logoHeight;
      let dw = dh * aspect;
      if (dw > maxW) {
        dw = maxW;
        dh = dw / aspect;
      }
      dctx.drawImage(sprite.canvas, centerX - dw / 2, centerY - dh / 2, dw, dh);
      dctx.imageSmoothingEnabled = prevSmooth;
      dctx.restore();
    };

    const drawSpotBehind = (cx: number, cy: number, areaX: number, areaW: number) => {
      const spotR = stripH * 1.15;
      const spotGrad = dctx.createRadialGradient(cx, cy, spotR * 0.08, cx, cy, spotR);
      spotGrad.addColorStop(0, 'rgba(248, 250, 252, 0.30)');
      spotGrad.addColorStop(0.6, 'rgba(226, 232, 240, 0.10)');
      spotGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      dctx.fillStyle = spotGrad;
      dctx.fillRect(Math.round(areaX), Math.round(stripY), Math.round(areaW), Math.round(stripH));
    };

    const renderZoomedShowcase = (centerY: number) => {
      const brandUpper = ad.brand.toUpperCase();
      const yaw = time * 3.6 + adSlotSeed * 0.9;
      const showcase = resolveDynamicBrandShowcase(ad, matchSeed, adSlotSeed, cycleIdx, time);

      // Special Adidas dual-cleat showcase: 2 360-degree rotating Adidas cleats centered behind 30%-transparent headline
      if (brandUpper === 'ADIDAS') {
        const dualShoeSize = stripH * 2.05;
        const leftShoeX = stripX + stripW * 0.42;
        const rightShoeX = stripX + stripW * 0.58;

        drawSpotBehind(stripX + stripW * 0.5, centerY, stripX + stripW * 0.2, stripW * 0.6);

        this.draw8BitRotatingItem(
          dctx,
          'shoe_adidas_f50',
          leftShoeX,
          centerY,
          dualShoeSize,
          yaw,
          showcase.primaryColor,
          showcase.accentColor
        );

        this.draw8BitRotatingItem(
          dctx,
          'shoe_adidas_predator',
          rightShoeX,
          centerY,
          dualShoeSize,
          yaw + 1.85,
          '#ef4444',
          '#ffffff'
        );

        const textW = stripW * 0.92;
        const textX = stripX + stripW * 0.04;
        const textH = stripH * 0.84;
        this.drawPixelatedBannerText(
          dctx,
          showcase.displayLabel,
          textX,
          stripY,
          textW,
          textH,
          centerY - textH / 2,
          showcase.textColor,
          '#000000',
          undefined,
          Math.max(2, Math.round(textH / 10.5)),
          time,
          LED_SHOWCASE_TEXT_ALPHA
        );
        return;
      }

      const itemKind = showcase.itemKind;
      const isShoeBrand =
        itemKind === 'shoe_nike' ||
        itemKind === 'shoe_adidas_f50' ||
        itemKind === 'shoe_adidas_predator' ||
        itemKind === 'shoe_puma';
      const isBeverage =
        itemKind === 'soda_coca_cola' ||
        itemKind === 'soda_7up' ||
        itemKind === 'soda_code_red' ||
        itemKind === 'soda_kinza' ||
        itemKind === 'soda_can' ||
        itemKind === 'soda_bottle';

      const zoomSize = isBeverage ? stripH * 1.95 : isShoeBrand ? stripH * 2.25 : stripH * 2.0;
      const itemCenterX = stripX + stripW * 0.5;

      drawSpotBehind(itemCenterX, centerY, stripX + stripW * 0.25, stripW * 0.5);

      this.draw8BitRotatingItem(
        dctx,
        itemKind,
        itemCenterX,
        centerY,
        zoomSize,
        yaw,
        showcase.primaryColor,
        showcase.accentColor
      );

      // Normal-sized LED text at 30% transparency drawn ON TOP of the middle 360-degree rotating item
      const nameX = stripX + stripW * 0.04;
      const nameW = stripW * 0.92;
      const nameH = stripH * 0.84;
      const nameTopY = centerY - nameH / 2;

      this.drawPixelatedBannerText(
        dctx,
        showcase.displayLabel,
        nameX,
        stripY,
        nameW,
        nameH,
        nameTopY,
        showcase.textColor,
        '#000000',
        undefined,
        Math.max(2, Math.round(nameH / 10.5)),
        time,
        LED_SHOWCASE_TEXT_ALPHA
      );
    };

    if (phase === 'zoom_logo_drop') {
      // Real brand ad logo holds centered first (0..35%), then flies straight downward off the LED board (35..100%) BEFORE any 360° item appears
      const slideT = progress < 0.35 ? 0 : (progress - 0.35) / 0.65;
      const startY = stripY + stripH * 0.5;
      const endY = stripY + stripH * 1.95;
      const dropY = startY + (endY - startY) * slideT;
      drawRealBrandLogo(stripX + stripW / 2, dropY, stripH * (0.94 + slideT * 0.28));
    } else if (phase === 'shoes_fly_down') {
      const startY = stripY - stripH * 1.05;
      const targetY = stripY + stripH * 0.5;
      const dropY = startY + (targetY - startY) * progress;
      renderZoomedShowcase(dropY);
    } else if (phase === 'shoes_name_hold') {
      renderZoomedShowcase(stripY + stripH * 0.5);
    } else if (phase === 'exit_down') {
      const startY = stripY + stripH * 0.5;
      const endY = stripY + stripH * 2.05;
      const dropY = startY + (endY - startY) * progress;
      renderZoomedShowcase(dropY);
    } else if (phase === 'brand_logo_drop_again') {
      // Next brand's real logo flies straight downward into place FIRST before its 360° items enter
      const startY = stripY - stripH * 0.85;
      const targetY = stripY + stripH / 2;
      const dropY = startY + (targetY - startY) * progress;
      drawRealBrandLogo(stripX + stripW / 2, dropY, stripH * 0.94);
    } else {
      // Holds cleanly centered before zoom_logo_drop begins
      drawRealBrandLogo(stripX + stripW / 2, stripY + stripH / 2, stripH * 0.94);
    }

    dctx.restore();
  }

  // Exclusive to eFootball Stadium ONLY (not the other 15 stadiums):
  // Cobalt blue #00008b bottom flanks matching efootball-2025-color-design-v0-zxmdiknkeymd1_f2d50b57.jpeg:
  // Exact 4 Red, Blue, Green, Orange 3D yellow-edged shapes repeating straight UP,
  // while the companion flat Red, Blue, Green, Orange geometric shapes travel straight DOWN.
  private drawHighResEfootballShapesFlank(
    dctx: CanvasRenderingContext2D,
    stripX: number,
    stripY: number,
    stripW: number,
    stripH: number,
    sx: number,
    sy: number,
    time: number,
    seqOffset: number
  ) {
    dctx.save();
    dctx.beginPath();
    dctx.rect(stripX, stripY, stripW, stripH);
    dctx.clip();

    dctx.fillStyle = '#00008b';
    dctx.fillRect(stripX, stripY, stripW, stripH);

    // Exact Red -> Blue -> Green -> Orange 3D yellow-beveled shapes going UP
    const upCycle: Array<{ kind: 'red_block' | 'blue_prism' | 'green_pill' | 'orange_pill'; col: string }> = [
      { kind: 'red_block', col: '#ff0000' },
      { kind: 'blue_prism', col: '#06b6d4' },
      { kind: 'green_pill', col: '#00e600' },
      { kind: 'orange_pill', col: '#ff7a00' },
    ];
    // Exact companion outer Red / Blue / Green / Orange flat geometric shapes going DOWN
    const downCycle: Array<{ kind: 'red_wedge' | 'blue_bar' | 'green_trap' | 'orange_quad'; col: string; rot: number }> = [
      { kind: 'red_wedge', col: '#ff0000', rot: -0.38 },
      { kind: 'blue_bar', col: '#06b6d4', rot: 0.56 },
      { kind: 'green_trap', col: '#00e600', rot: -0.46 },
      { kind: 'orange_quad', col: '#ff7a00', rot: 0.42 },
    ];

    const colSpacing = Math.max(18 * sx, stripW / 8);
    const numCols = Math.ceil(stripW / colSpacing);
    const period = stripH * 2.2;
    const shapeW = Math.min(colSpacing * 0.66, stripH * 1.15);
    const shapeH = stripH * 0.54;
    const extrude = Math.max(2, shapeH * 0.28);

    for (let c = 0; c < numCols; c++) {
      const cx = stripX + (c + 0.5) * (stripW / numCols);
      const isUp = c % 2 === 0;
      const travel = (time * (isUp ? 28 : 24) * sy + c * period * 0.31) % period;

      for (const phaseOff of [0, period * 0.5]) {
        const modT = (travel + phaseOff) % period;
        const cy = isUp ? stripY + stripH + shapeH - modT : stripY - shapeH + modT;

        dctx.save();
        dctx.translate(cx, cy);
        if (isUp) {
          const spec = upCycle[((c >> 1) + seqOffset) % upCycle.length];
          if (spec.kind === 'red_block') {
            dctx.rotate(-0.55);
            dctx.fillStyle = '#fef000';
            dctx.fillRect(-shapeW * 0.5, -shapeH * 0.5 - extrude * 0.75, shapeW, shapeH + extrude * 0.75);
            dctx.fillStyle = spec.col;
            dctx.fillRect(-shapeW * 0.5, -shapeH * 0.5, shapeW, shapeH);
          } else if (spec.kind === 'blue_prism') {
            dctx.rotate(0.45);
            dctx.fillStyle = '#fef000';
            dctx.fillRect(-shapeW * 0.45, -shapeH * 0.55 - extrude * 0.75, shapeW * 0.9, shapeH + extrude * 0.75);
            dctx.fillStyle = spec.col;
            dctx.fillRect(-shapeW * 0.45, -shapeH * 0.5, shapeW * 0.9, shapeH);
          } else {
            // Green / Orange rounded capsule pill with yellow depth bevel
            dctx.rotate(spec.kind === 'green_pill' ? -0.58 : 0.62);
            dctx.fillStyle = '#fef000';
            dctx.beginPath();
            dctx.roundRect(-shapeW * 0.58, -shapeH * 0.42 + extrude * 0.65, shapeW * 1.16, shapeH * 0.85, shapeH * 0.42);
            dctx.fill();
            dctx.fillStyle = spec.col;
            dctx.beginPath();
            dctx.roundRect(-shapeW * 0.58, -shapeH * 0.45, shapeW * 1.16, shapeH * 0.85, shapeH * 0.42);
            dctx.fill();
          }
        } else {
          const spec = downCycle[((c >> 1) + seqOffset) % downCycle.length];
          dctx.rotate(spec.rot);
          dctx.fillStyle = spec.col;
          if (spec.kind === 'red_wedge') {
            dctx.beginPath();
            dctx.moveTo(-shapeW * 0.56, -shapeH * 0.52);
            dctx.lineTo(shapeW * 0.56, -shapeH * 0.12);
            dctx.lineTo(-shapeW * 0.16, shapeH * 0.54);
            dctx.closePath();
            dctx.fill();
          } else if (spec.kind === 'blue_bar') {
            dctx.fillRect(-shapeW * 0.38, -shapeH * 0.62, shapeW * 0.76, shapeH * 1.24);
          } else if (spec.kind === 'green_trap') {
            dctx.beginPath();
            dctx.moveTo(-shapeW * 0.46, -shapeH * 0.44);
            dctx.lineTo(shapeW * 0.52, -shapeH * 0.28);
            dctx.lineTo(shapeW * 0.34, shapeH * 0.48);
            dctx.lineTo(-shapeW * 0.54, shapeH * 0.32);
            dctx.closePath();
            dctx.fill();
          } else {
            dctx.beginPath();
            dctx.moveTo(-shapeW * 0.48, -shapeH * 0.46);
            dctx.lineTo(shapeW * 0.46, -shapeH * 0.46);
            dctx.lineTo(shapeW * 0.58, shapeH * 0.46);
            dctx.lineTo(-shapeW * 0.36, shapeH * 0.46);
            dctx.closePath();
            dctx.fill();
          }
        }
        dctx.restore();
      }
    }

    dctx.restore();
  }

  private drawHighResTrophyLedContent(
    dctx: CanvasRenderingContext2D,
    stripX: number,
    stripY: number,
    stripW: number,
    stripH: number,
    midX: number,
    midW: number,
    sx: number,
    sy: number,
    time: number,
    competitionId: CompetitionId,
    winner: Team,
    trophyTitle: string
  ) {
    dctx.save();
    dctx.beginPath();
    dctx.rect(stripX, stripY, stripW, stripH);
    dctx.clip();

    const centerY = stripY + stripH / 2;
    const iconSize = Math.round(stripH * 0.94);
    const rotAngle = time * 3.4;

    // 2D rotating trophy icons flanking inside the pitch-side LED board
    const trophyXs = [
      stripX + stripW * 0.08,
      midX - iconSize * 0.85,
      midX + midW + iconSize * 0.85,
      stripX + stripW * 0.92,
    ];
    for (let i = 0; i < trophyXs.length; i++) {
      drawHighResTrophyGraphic(dctx, trophyXs[i], centerY, iconSize, rotAngle + i * 0.7);
    }

    // Competition logo coming DOWN across the pitch-side LED strip every 2.8s
    const logoCycle = (time * 0.45) % 1;
    const logoDropY = stripY - iconSize * 0.65 + (stripH + iconSize * 1.3) * logoCycle;
    const compLogoVariant = competitionId === 'league' ? 'league' : competitionId;
    drawHighResCompetitionLogoAt(
      dctx,
      competitionId,
      compLogoVariant,
      stripX + stripW * 0.22,
      logoDropY,
      iconSize * 1.05,
      'rgba(250, 204, 21, 0.85)'
    );
    drawHighResCompetitionLogoAt(
      dctx,
      competitionId,
      compLogoVariant,
      stripX + stripW * 0.78,
      logoDropY,
      iconSize * 1.05,
      'rgba(250, 204, 21, 0.85)'
    );

    // Draw PIXELATED winner text into nearest-neighbor pixel buffer for both middle and flanks!
    const winText = `CONGRATULATION ${winner.name.toUpperCase()} ${trophyTitle.toUpperCase()}`;
    const drawPixelatedTextArea = (
      areaX: number,
      areaY: number,
      areaW: number,
      areaH: number,
      label: string,
      color: string
    ) => {
      const hasArabic = /[\u0600-\u06FF]/.test(label);
      const pixelStep = Math.max(2, Math.round(areaH / 12));
      const bw = Math.max(40, Math.round(areaW / pixelStep));
      const bh = Math.max(11, Math.round(areaH / pixelStep));
      if (!this.trophyTextPixelBuf) this.trophyTextPixelBuf = document.createElement('canvas');
      if (this.trophyTextPixelBuf.width !== bw || this.trophyTextPixelBuf.height !== bh) {
        this.trophyTextPixelBuf.width = bw;
        this.trophyTextPixelBuf.height = bh;
      }
      const pctx = this.trophyTextPixelBuf.getContext('2d');
      if (!pctx) return;
      pctx.imageSmoothingEnabled = false;
      pctx.clearRect(0, 0, bw, bh);

      if (!hasArabic) {
        const clean = label.normalize('NFC').toUpperCase().replace(/[^A-ZÁÃÉ0-9 .:-]/g, ' ');
        drawPixelText(pctx, clean, bw / 2, Math.max(1, Math.floor((bh - 7) / 2)), 1, color, '#020617', undefined, bw - 4);
      } else {
        let fSize = Math.max(8, Math.round(bh * 0.76));
        pctx.font = `900 ${fSize}px "Press Start 2P", "VT323", "Tajawal", monospace`;
        const mw = pctx.measureText(label).width;
        if (mw > bw - 4 && mw > 0) {
          fSize = Math.max(7, Math.floor((fSize * (bw - 4)) / mw));
          pctx.font = `900 ${fSize}px "Press Start 2P", "VT323", "Tajawal", monospace`;
        }
        pctx.textAlign = 'center';
        pctx.textBaseline = 'middle';
        pctx.lineJoin = 'miter';
        pctx.lineWidth = Math.max(1.8, fSize * 0.2);
        pctx.strokeStyle = '#020617';
        pctx.strokeText(label, bw / 2, bh / 2);
        pctx.fillStyle = color;
        pctx.fillText(label, bw / 2, bh / 2);
      }
      const prev = dctx.imageSmoothingEnabled;
      dctx.imageSmoothingEnabled = false;
      dctx.drawImage(this.trophyTextPixelBuf, areaX, areaY, areaW, areaH);
      dctx.imageSmoothingEnabled = prev;
    };

    const textSlotX = midX + iconSize * 1.1;
    const textSlotW = Math.max(40, midW - iconSize * 2.2);
    drawHighResClubCrest(dctx, winner, midX + iconSize * 0.55, centerY, iconSize);
    drawHighResTrophyGraphic(dctx, midX + midW - iconSize * 0.55, centerY, iconSize, rotAngle);
    const winCol = Math.floor(time * 6) % 2 === 0 ? '#fef08a' : winner.primaryColor || '#facc15';
    drawPixelatedTextArea(textSlotX, stripY, textSlotW, stripH, winText, winCol);

    // Side LED strips: scrolling pixelated Winner Club Name + Tournament + Club Crest
    const flankText = `CONGRATULATION ${winner.shortCode} - ${trophyTitle}`;
    const leftSideW = midX - stripX - iconSize * 1.8;
    const rightSideX = midX + midW + iconSize * 1.8;
    const rightSideW = stripX + stripW - rightSideX;

    for (const seg of [
      { x: stripX + iconSize * 1.4, w: leftSideW },
      { x: rightSideX, w: rightSideW - iconSize * 1.4 },
    ]) {
      if (seg.w < 24) continue;
      dctx.save();
      dctx.beginPath();
      dctx.rect(seg.x, stripY, seg.w, stripH);
      dctx.clip();
      const segW = Math.max(seg.w * 0.95, 160 * sx);
      const scroll = (time * 36 * sx) % segW;
      for (let fx = seg.x - scroll; fx < seg.x + seg.w + segW; fx += segW) {
        drawHighResClubCrest(dctx, winner, fx + iconSize * 0.45, centerY, iconSize * 0.8);
        drawPixelatedTextArea(
          fx + iconSize,
          stripY,
          Math.max(40, segW - iconSize * 1.2),
          stripH,
          flankText,
          Math.floor(time * 8) % 2 === 0 ? '#facc15' : '#ffffff'
        );
      }
      dctx.restore();
    }

    dctx.restore();
  }

  private drawRandomRivalryLedStripBackdrop(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    cfg: RandomRivalryLedConfig,
    time: number
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, cfg.bgPrimary);
    grad.addColorStop(0.5, cfg.bgSecondary);
    grad.addColorStop(1, cfg.bgPrimary);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Kinetic pixel energy sparks
    for (let i = 0; i < 16; i++) {
      const px = x + ((i * 29 + Math.floor(time * cfg.scrollSpeed)) % Math.max(1, w));
      const py = y + ((i * 5 + Math.floor(time * 16)) % Math.max(1, h));
      ctx.fillStyle = i % 2 === 0 ? cfg.accentA : cfg.accentB;
      ctx.fillRect(px, py, 2, 1);
    }
    ctx.restore();
  }

  private drawHighResRandomRivalryFlank(
    dctx: CanvasRenderingContext2D,
    stripX: number,
    stripY: number,
    stripW: number,
    stripH: number,
    sx: number,
    sy: number,
    cfg: RandomRivalryLedConfig,
    time: number,
    slotIdx: number,
    homeTeam: Team,
    awayTeam: Team
  ) {
    dctx.save();
    dctx.beginPath();
    dctx.rect(stripX, stripY, stripW, stripH);
    dctx.clip();

    const mode = slotIdx % 2 === 0 ? cfg.animMode : cfg.secondaryAnimMode;

    // 1. Randomized procedural LED backdrop animation
    if (mode === 'shockwaves') {
      const waveCount = 4;
      for (let w = 0; w < waveCount; w++) {
        const p = (time * 0.95 + w / waveCount + slotIdx * 0.17) % 1;
        const cx = stripX + stripW * (0.2 + ((w * 0.27) % 0.65));
        const r = Math.max(4, p * stripW * 0.36);
        dctx.strokeStyle = w % 2 === 0 ? cfg.accentA : cfg.accentB;
        dctx.globalAlpha = 0.55 * (1 - p);
        dctx.lineWidth = Math.max(2, 1.5 * sy);
        dctx.beginPath();
        dctx.ellipse(cx, stripY + stripH / 2, r, stripH * 0.55 * p + 2, 0, 0, Math.PI * 2);
        dctx.stroke();
      }
    } else if (mode === 'lightning_storm') {
      dctx.globalAlpha = 0.72;
      const bolts = 5;
      for (let b = 0; b < bolts; b++) {
        const phase = Math.floor(time * 7 + b * 3 + slotIdx) % 4;
        if (phase > 1) continue;
        const bx = stripX + ((b * 0.21 + ((Math.floor(time * 2) * 0.13) % 0.2)) * stripW) % stripW;
        dctx.strokeStyle = b % 2 === 0 ? cfg.accentA : '#ffffff';
        dctx.lineWidth = Math.max(2, 1.5 * sx);
        dctx.beginPath();
        dctx.moveTo(bx, stripY);
        dctx.lineTo(bx + 6 * sx, stripY + stripH * 0.45);
        dctx.lineTo(bx - 4 * sx, stripY + stripH * 0.65);
        dctx.lineTo(bx + 5 * sx, stripY + stripH);
        dctx.stroke();
      }
    } else if (mode === 'prism_chevrons') {
      dctx.globalAlpha = 0.46;
      const spacing = Math.max(18 * sx, stripW / 6);
      const scroll = (time * cfg.scrollSpeed * 1.4 * sx) % spacing;
      for (let cx = stripX - spacing + scroll; cx < stripX + stripW + spacing; cx += spacing) {
        dctx.fillStyle = Math.floor(cx / spacing) % 2 === 0 ? cfg.accentA : cfg.accentB;
        dctx.beginPath();
        dctx.moveTo(cx, stripY);
        dctx.lineTo(cx + spacing * 0.45, stripY + stripH / 2);
        dctx.lineTo(cx, stripY + stripH);
        dctx.lineTo(cx - spacing * 0.25, stripY + stripH);
        dctx.lineTo(cx + spacing * 0.2, stripY + stripH / 2);
        dctx.lineTo(cx - spacing * 0.25, stripY);
        dctx.closePath();
        dctx.fill();
      }
    } else if (mode === 'pixel_fireworks') {
      for (let f = 0; f < 4; f++) {
        const prog = (time * 0.85 + f * 0.27 + slotIdx * 0.19) % 1;
        const fx = stripX + stripW * (0.14 + f * 0.24);
        const fy = stripY + stripH * (0.25 + ((f * 37) % 50) / 100);
        const radius = prog * stripH * 1.15;
        dctx.fillStyle = f % 2 === 0 ? cfg.accentA : cfg.accentB;
        dctx.globalAlpha = Math.max(0, 1 - prog);
        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2 + prog * 1.5;
          const px = fx + Math.cos(ang) * radius;
          const py = fy + Math.sin(ang) * radius * 0.7;
          dctx.fillRect(Math.round(px), Math.round(py), Math.max(2, Math.round(2 * sx)), Math.max(2, Math.round(2 * sy)));
        }
      }
    } else if (mode === 'neon_equalizer') {
      dctx.globalAlpha = 0.48;
      const barW = Math.max(4, Math.round(5 * sx));
      const gap = Math.max(2, Math.round(2 * sx));
      for (let bx = stripX; bx < stripX + stripW; bx += barW + gap) {
        const lvl = (Math.sin(time * 9 + bx * 0.08 + slotIdx) + 1) * 0.5;
        const bh = Math.max(3, lvl * stripH * 0.88);
        dctx.fillStyle = Math.floor(bx / (barW + gap)) % 2 === 0 ? cfg.accentA : cfg.accentB;
        dctx.fillRect(bx, stripY + stripH - bh, barW, bh);
      }
    } else {
      // orbit_vortex
      dctx.globalAlpha = 0.52;
      for (let i = 0; i < 10; i++) {
        const ang = time * 3.1 + i * 0.628 + slotIdx;
        const ox = stripX + stripW * 0.5 + Math.cos(ang) * stripW * 0.42;
        const oy = stripY + stripH * 0.5 + Math.sin(ang * 2) * stripH * 0.34;
        dctx.fillStyle = i % 2 === 0 ? cfg.accentA : cfg.accentB;
        dctx.beginPath();
        dctx.arc(ox, oy, Math.max(2.5, 2.2 * sy), 0, Math.PI * 2);
        dctx.fill();
      }
    }

    // 2. Randomized pixel icon + alternating club crests & scrolling randomized derby slogan
    dctx.globalAlpha = 1;
    const centerY = stripY + stripH / 2;
    const iconSize = stripH * 0.72;
    const leftCrestX = stripX + iconSize * 0.68;
    const rightCrestX = stripX + stripW - iconSize * 0.68;

    drawHighResClubCrest(dctx, homeTeam, leftCrestX, centerY, iconSize);
    drawHighResClubCrest(dctx, awayTeam, rightCrestX, centerY, iconSize);

    // Floating randomized pixel icon glyph orbiting gently inside flank strip
    const iconPx = stripX + stripW * (0.5 + Math.sin(time * 1.4 + slotIdx) * 0.3);
    const iconPy = stripY + stripH * (0.28 + Math.abs(Math.sin(time * 2.8 + slotIdx)) * 0.44);
    dctx.save();
    dctx.translate(iconPx, iconPy);
    dctx.rotate(Math.sin(time * 3 + slotIdx) * 0.35);
    dctx.fillStyle = cfg.accentA;
    dctx.strokeStyle = '#020617';
    dctx.lineWidth = Math.max(1.2, sy);
    const r = stripH * 0.24;
    if (cfg.iconKind === 'bolt') {
      dctx.beginPath();
      dctx.moveTo(r * 0.2, -r);
      dctx.lineTo(-r * 0.55, r * 0.1);
      dctx.lineTo(0, r * 0.1);
      dctx.lineTo(-r * 0.2, r);
      dctx.lineTo(r * 0.55, -r * 0.1);
      dctx.lineTo(0, -r * 0.1);
      dctx.closePath();
      dctx.fill();
      dctx.stroke();
    } else if (cfg.iconKind === 'crown') {
      dctx.beginPath();
      dctx.moveTo(-r, r * 0.6);
      dctx.lineTo(-r, -r * 0.5);
      dctx.lineTo(-r * 0.35, 0);
      dctx.lineTo(0, -r * 0.8);
      dctx.lineTo(r * 0.35, 0);
      dctx.lineTo(r, -r * 0.5);
      dctx.lineTo(r, r * 0.6);
      dctx.closePath();
      dctx.fill();
      dctx.stroke();
    } else {
      // star / gem / flame / trophy stylized diamond star
      dctx.beginPath();
      dctx.moveTo(0, -r);
      dctx.lineTo(r * 0.75, 0);
      dctx.lineTo(0, r);
      dctx.lineTo(-r * 0.75, 0);
      dctx.closePath();
      dctx.fill();
      dctx.stroke();
    }
    dctx.restore();

    const textAreaX = leftCrestX + iconSize * 0.65;
    const textAreaW = Math.max(30, rightCrestX - iconSize * 0.65 - textAreaX);
    const textH = stripH * 0.76;
    const scrollPx = Math.floor(time * cfg.scrollSpeed * 0.65);
    this.drawPixelatedBannerText(
      dctx,
      cfg.slogan,
      textAreaX,
      stripY,
      textAreaW,
      textH,
      centerY - textH / 2,
      cfg.textColor,
      '#020617',
      scrollPx,
      Math.max(2, Math.floor(textH / 12))
    );

    dctx.restore();
  }

  private drawPerimeterLedBoards(
    ctx: CanvasRenderingContext2D,
    time: number,
    celebrationBoost: number,
    competitionId: CompetitionId,
    isRivalry: boolean,
    rivalryId: string | null,
    rivalryTitle: string | null,
    matchSeed: number,
    homeTeamName: string,
    awayTeamName: string,
    stadiumId: string,
    stadiumName: string,
    cupRoundLabel?: string,
    isRoadTo38 = false,
    isFinale38 = false,
    isTrophyCeremony = false,
    isUltimateTeam = false
  ) {
    const boardY = 55;
    const boardH = 12;
    const startX = PITCH.left;
    const totalW = PITCH.right - PITCH.left;
    const botY = PITCH.bottom + 7;
    const isEfootball = stadiumId === 'efootball-stadium';

    // LED Frame housing + Upper & Lower LED Layers + Endzone Goal-Line LED frames
    ctx.fillStyle = '#020617';
    ctx.fillRect(startX, 46, totalW, 8);
    ctx.fillRect(startX - 4, boardY - 1, totalW + 8, boardH + 2);
    ctx.fillRect(startX, botY - 1, totalW, 13);
    ctx.fillRect(PITCH.left - 25, PITCH.top + 1, 14, 64);
    ctx.fillRect(PITCH.left - 25, PITCH.bottom - 65, 14, 64);
    ctx.fillRect(PITCH.right + 11, PITCH.top + 1, 14, 64);
    ctx.fillRect(PITCH.right + 11, PITCH.bottom - 65, 14, 64);

    const midW = 168;
    const sideW = Math.floor((totalW - midW) / 2);
    const midX = startX + sideW;
    const rightX = midX + midW;
    const rightW = startX + totalW - rightX;

    if (isTrophyCeremony) {
      this.drawRivalrySpaceLedStrip(ctx, startX, 47, totalW, 7, time, true);
      this.drawRivalrySpaceLedStrip(ctx, startX, boardY, totalW, boardH, time, true);
      this.drawRivalrySpaceLedStrip(ctx, startX, botY, totalW, 11, time, true);
      return;
    }

    drawExtraLedLayerTunnel(ctx, startX, 47, totalW, 7, competitionId, time, cupRoundLabel, false, isRoadTo38, isFinale38);

    const isClasico =
      isRivalry &&
      (rivalryId === 'the-clasico' || (!rivalryId && rivalryTitle === 'THE CLÁSICO')) &&
      competitionId === 'league' &&
      !isRoadTo38 &&
      !isFinale38;
    const isCustomRivalry = isRivalry && !isClasico && !isRoadTo38 && !isFinale38;

    if (isClasico) {
      this.drawRivalrySpaceLedStrip(ctx, startX, boardY, sideW, boardH, time, false);
      drawRivalrySpaceMiddlePanel(ctx, midX, boardY, midW, boardH, time);
      this.drawRivalrySpaceLedStrip(ctx, rightX, boardY, rightW, boardH, time, false);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(midX - 1, boardY, 1, boardH);
      ctx.fillRect(rightX, boardY, 1, boardH);

      if (isEfootball) {
        ctx.fillStyle = '#00008b';
        ctx.fillRect(startX, botY, sideW, 11);
        drawRivalrySpaceMiddlePanel(ctx, midX, botY, midW, 11, time);
        ctx.fillStyle = '#00008b';
        ctx.fillRect(rightX, botY, rightW, 11);
      } else {
        this.drawRivalrySpaceLedStrip(ctx, startX, botY, sideW, 11, time + 0.6, false);
        drawRivalrySpaceMiddlePanel(ctx, midX, botY, midW, 11, time);
        this.drawRivalrySpaceLedStrip(ctx, rightX, botY, rightW, 11, time + 0.6, false);
      }
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(midX - 1, botY, 1, 11);
      ctx.fillRect(rightX, botY, 1, 11);
      return;
    }

    if (isCustomRivalry) {
      const rivCfg = buildRandomRivalryLedConfig(
        rivalryId ?? 'custom-rivalry',
        rivalryTitle ?? 'RIVALRY DERBY',
        homeTeamName,
        awayTeamName,
        matchSeed
      );
      this.drawRandomRivalryLedStripBackdrop(ctx, startX, boardY, sideW, boardH, rivCfg, time);
      this.drawRandomRivalryLedStripBackdrop(ctx, midX, boardY, midW, boardH, rivCfg, time + 0.3);
      this.drawRandomRivalryLedStripBackdrop(ctx, rightX, boardY, rightW, boardH, rivCfg, time + 0.6);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(midX - 1, boardY, 1, boardH);
      ctx.fillRect(rightX, boardY, 1, boardH);

      if (isEfootball) {
        ctx.fillStyle = '#00008b';
        ctx.fillRect(startX, botY, sideW, 11);
        this.drawRandomRivalryLedStripBackdrop(ctx, midX, botY, midW, 11, rivCfg, time + 0.3);
        ctx.fillStyle = '#00008b';
        ctx.fillRect(rightX, botY, rightW, 11);
      } else {
        this.drawRandomRivalryLedStripBackdrop(ctx, startX, botY, sideW, 11, rivCfg, time + 0.45);
        this.drawRandomRivalryLedStripBackdrop(ctx, midX, botY, midW, 11, rivCfg, time + 0.3);
        this.drawRandomRivalryLedStripBackdrop(ctx, rightX, botY, rightW, 11, rivCfg, time + 0.9);
      }
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(midX - 1, botY, 1, 11);
      ctx.fillRect(rightX, botY, 1, 11);
      return;
    }

    const activeAds = getSponsorsForCompetition(competitionId, isUltimateTeam);
    const adCount = activeAds.length;
    const cycleIdx = Math.max(0, Math.floor(time / BRAND_AD_CYCLE_SECONDS));
    const { brandCycleIndex } = resolveBrandAdDisplayState(time, cycleIdx);
    const frameTick = Math.max(0, Math.floor(time * 12));
    const panelSegments = 3;
    const leftPanelW = sideW / panelSegments;
    const rightPanelW = rightW / panelSegments;

    for (let seg = 0; seg < panelSegments; seg++) {
      const tLeftAdIdx = pickRandomSponsorIndex(brandCycleIndex, seg, adCount, matchSeed);
      const tRightAdIdx = pickRandomSponsorIndex(brandCycleIndex, panelSegments + seg, adCount, matchSeed);
      this.draw12sBrandFlankBackdrop(ctx, startX + seg * leftPanelW, boardY, leftPanelW, boardH, activeAds[tLeftAdIdx], tLeftAdIdx + brandCycleIndex * 16 + seg, time, celebrationBoost, frameTick, matchSeed, brandCycleIndex);
      this.draw12sBrandFlankBackdrop(ctx, rightX + seg * rightPanelW, boardY, rightPanelW, boardH, activeAds[tRightAdIdx], tRightAdIdx + brandCycleIndex * 16 + panelSegments + seg, time, celebrationBoost, frameTick, matchSeed, brandCycleIndex);
    }
    drawLedTunnelPanel(ctx, midX, boardY, midW, boardH, competitionId, time, stadiumName, cupRoundLabel, isRoadTo38, isFinale38);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(midX - 1, boardY, 1, boardH);
    ctx.fillRect(rightX, boardY, 1, boardH);

    drawLedTunnelPanel(ctx, midX, botY, midW, 11, competitionId, time, stadiumName, cupRoundLabel, isRoadTo38, isFinale38);

    if (isEfootball) {
      ctx.fillStyle = '#00008b';
      ctx.fillRect(startX, botY, sideW, 11);
      ctx.fillRect(rightX, botY, rightW, 11);
    } else {
      for (let seg = 0; seg < panelSegments; seg++) {
        const bLeftAdIdx = pickRandomSponsorIndex(brandCycleIndex, panelSegments * 2 + seg, adCount, matchSeed);
        const bRightAdIdx = pickRandomSponsorIndex(brandCycleIndex, panelSegments * 3 + seg, adCount, matchSeed);
        this.draw12sBrandFlankBackdrop(ctx, startX + seg * leftPanelW, botY, leftPanelW, 11, activeAds[bLeftAdIdx], bLeftAdIdx + brandCycleIndex * 16 + panelSegments * 2 + seg, time, celebrationBoost, frameTick, matchSeed, brandCycleIndex);
        this.draw12sBrandFlankBackdrop(ctx, rightX + seg * rightPanelW, botY, rightPanelW, 11, activeAds[bRightAdIdx], bRightAdIdx + brandCycleIndex * 16 + panelSegments * 3 + seg, time, celebrationBoost, frameTick, matchSeed, brandCycleIndex);
      }
    }

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(midX - 1, botY, 1, 11);
    ctx.fillRect(rightX, botY, 1, 11);
  }

  private drawPitchLines(ctx: CanvasRenderingContext2D, stadium: StadiumTheme) {
    const pw = PITCH.right - PITCH.left;
    const ph = PITCH.bottom - PITCH.top;

    if (stadium.turfPattern === 'horizontal') {
      const rows = 8;
      const rowH = ph / rows;
      for (let i = 0; i < rows; i++) {
        ctx.fillStyle = i % 2 === 0 ? stadium.turfA : stadium.turfB;
        ctx.fillRect(PITCH.left, Math.round(PITCH.top + i * rowH), pw, Math.ceil(rowH));
      }
    } else if (stadium.turfPattern === 'checker') {
      const cols = 10;
      const rows = 6;
      const cw = pw / cols;
      const ch = ph / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? stadium.turfA : stadium.turfB;
          ctx.fillRect(Math.round(PITCH.left + c * cw), Math.round(PITCH.top + r * ch), Math.ceil(cw), Math.ceil(ch));
        }
      }
    } else {
      const stripeCount = 12;
      const stripeW = pw / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? stadium.turfA : stadium.turfB;
        ctx.fillRect(Math.round(PITCH.left + i * stripeW), PITCH.top, Math.ceil(stripeW), ph);
      }
    }

    // White pitch lines
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1;
    ctx.strokeRect(PITCH.left + 0.5, PITCH.top + 0.5, pw, ph);

    ctx.beginPath();
    ctx.moveTo(PITCH.centerX + 0.5, PITCH.top);
    ctx.lineTo(PITCH.centerX + 0.5, PITCH.bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(PITCH.centerX, PITCH.centerY, PITCH.centerCircleRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(PITCH.centerX - 1, PITCH.centerY - 1, 3, 3);

    ctx.strokeRect(
      PITCH.left + 0.5,
      PITCH.centerY - PITCH.penaltyBoxHalfHeight + 0.5,
      PITCH.penaltyBoxWidth,
      PITCH.penaltyBoxHalfHeight * 2
    );
    ctx.strokeRect(
      PITCH.left + 0.5,
      PITCH.centerY - PITCH.sixYardHalfHeight + 0.5,
      PITCH.sixYardWidth,
      PITCH.sixYardHalfHeight * 2
    );
    ctx.fillRect(PITCH.left + PITCH.penaltySpotOffset - 1, PITCH.centerY - 1, 2, 2);

    ctx.strokeRect(
      PITCH.right - PITCH.penaltyBoxWidth + 0.5,
      PITCH.centerY - PITCH.penaltyBoxHalfHeight + 0.5,
      PITCH.penaltyBoxWidth,
      PITCH.penaltyBoxHalfHeight * 2
    );
    ctx.strokeRect(
      PITCH.right - PITCH.sixYardWidth + 0.5,
      PITCH.centerY - PITCH.sixYardHalfHeight + 0.5,
      PITCH.sixYardWidth,
      PITCH.sixYardHalfHeight * 2
    );
    ctx.fillRect(PITCH.right - PITCH.penaltySpotOffset - 1, PITCH.centerY - 1, 2, 2);

    ctx.beginPath();
    ctx.arc(PITCH.left + PITCH.penaltySpotOffset, PITCH.centerY, 24, -0.68, 0.68);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(PITCH.right - PITCH.penaltySpotOffset, PITCH.centerY, 24, Math.PI - 0.68, Math.PI + 0.68);
    ctx.stroke();

    const corners = [
      { x: PITCH.left, y: PITCH.top, s: 0, e: Math.PI / 2 },
      { x: PITCH.right, y: PITCH.top, s: Math.PI / 2, e: Math.PI },
      { x: PITCH.right, y: PITCH.bottom, s: Math.PI, e: Math.PI * 1.5 },
      { x: PITCH.left, y: PITCH.bottom, s: Math.PI * 1.5, e: Math.PI * 2 },
    ];
    for (const c of corners) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 7, c.s, c.e);
      ctx.stroke();
    }
  }

  private drawGoal(ctx: CanvasRenderingContext2D, side: 'left' | 'right', ripple: number) {
    const top = PITCH.centerY - PITCH.goalHalfHeight;
    const h = PITCH.goalHalfHeight * 2;
    const d = PITCH.goalDepth;
    const bulge = Math.round(Math.sin(ripple * 24) * ripple * 4);
    const gx = side === 'left' ? PITCH.left - d - bulge : PITCH.right;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(gx, top, d + Math.abs(bulge), h);

    ctx.fillStyle = 'rgba(241, 245, 249, 0.45)';
    for (let y = top; y <= top + h; y += 4) {
      ctx.fillRect(gx, y, d + Math.abs(bulge), 1);
    }
    for (let x = gx; x <= gx + d + Math.abs(bulge); x += 4) {
      ctx.fillRect(x, top, 1, h);
    }

    ctx.fillStyle = '#ffffff';
    if (side === 'left') {
      ctx.fillRect(PITCH.left - 2, top - 2, 3, 3);
      ctx.fillRect(PITCH.left - 2, top + h - 1, 3, 3);
      ctx.fillRect(gx, top, d + bulge, 2);
      ctx.fillRect(gx, top + h - 1, d + bulge, 2);
      ctx.fillRect(gx, top, 2, h);
    } else {
      ctx.fillRect(PITCH.right - 1, top - 2, 3, 3);
      ctx.fillRect(PITCH.right - 1, top + h - 1, 3, 3);
      ctx.fillRect(PITCH.right, top, d + bulge, 2);
      ctx.fillRect(PITCH.right, top + h - 1, d + bulge, 2);
      ctx.fillRect(PITCH.right + d + bulge - 2, top, 2, h);
    }
  }

  private drawSetPieceAimArrow(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    angle: number,
    charge: number
  ) {
    const len = 18 + charge * 26;
    const ex = Math.round(bx + Math.cos(angle) * len);
    const ey = Math.round(by + Math.sin(angle) * len);

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.round(bx), Math.round(by));
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(ex - 2, ey - 2, 4, 4);
  }

  private drawPlayer(
    ctx: CanvasRenderingContext2D,
    p: PlayerEntity,
    team: Team,
    isControlled: boolean,
    hasBall: boolean,
    shotCharge: number,
    time: number
  ) {
    const x = Math.round(p.x);
    const y = Math.round(p.y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x - 4, y + 1, 8, 3);

    if (isControlled) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 6, y - 1, 12, 5);
      const bob = Math.sin(time * 9) > 0 ? -1 : 0;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x - 3, y - 19 + bob, 6, 1);
      ctx.fillRect(x - 2, y - 18 + bob, 4, 1);
      ctx.fillRect(x - 1, y - 17 + bob, 2, 1);
    }

    if (p.stunTimer > 0) {
      ctx.fillStyle = '#facc15';
      const sx = Math.round(Math.cos(time * 16) * 4);
      ctx.fillRect(x + sx - 1, y - 15, 2, 2);
      ctx.fillRect(x - sx - 1, y - 15, 2, 2);
    }

    if (p.tackleTimer > 0) {
      const dir = p.facingX >= 0 ? 1 : -1;
      ctx.fillStyle = p.hitFlash > 0 ? '#ffffff' : team.primaryColor;
      ctx.fillRect(x - 6, y - 5, 12, 4);
      ctx.fillStyle = team.secondaryColor;
      ctx.fillRect(x + dir * 4, y - 3, 5, 2);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(x - dir * 5, y - 7, 4, 4);
      return;
    }

    const stride = Math.sin(p.animDist * 0.45) * 2;
    const legA = Math.round(stride);
    const legB = -legA;

    ctx.fillStyle = '#111827';
    ctx.fillRect(x - 3, y - 1 + legA * 0.5, 2, 2);
    ctx.fillRect(x + 1, y - 1 + legB * 0.5, 2, 2);

    ctx.fillStyle = p.hitFlash > 0 ? '#ffffff' : team.secondaryColor;
    ctx.fillRect(x - 3, y - 5, 6, 4);

    const jersey = p.hitFlash > 0
      ? '#ffffff'
      : p.role === 'GK'
      ? p.team === 'home'
        ? '#f97316'
        : '#a855f7'
      : team.primaryColor;
    ctx.fillStyle = jersey;
    ctx.fillRect(x - 4, y - 10, 8, 6);

    ctx.fillStyle = p.hitFlash > 0 ? '#ffffff' : team.trimColor;
    ctx.fillRect(x - 1, y - 10, 2, 5);

    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x - 2, y - 14, 5, 4);
    ctx.fillStyle = p.team === 'home' ? '#1e293b' : '#451a03';
    ctx.fillRect(x - 2, y - 15, 5, 2);

    if (p.isCaptain) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + 4, y - 9, 2, 2);
    }

    if (p.yellowCards > 0) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + 5, y - 14, 2, 3);
    }

    if (isControlled && hasBall && shotCharge > 0.02) {
      const barW = 14;
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - 7, y + 4, barW, 3);
      ctx.fillStyle = shotCharge > 0.75 ? '#ef4444' : '#facc15';
      ctx.fillRect(x - 6, y + 5, Math.round((barW - 2) * shotCharge), 1);
    }
  }

  private drawReferee(
    ctx: CanvasRenderingContext2D,
    ref: { x: number; y: number; cardShown: 'YELLOW' | 'RED' | null; cardTimer: number }
  ) {
    const x = Math.round(ref.x);
    const y = Math.round(ref.y);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x - 3, y + 1, 6, 2);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(x - 3, y - 5, 6, 4);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(x - 3, y - 10, 6, 5);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x - 2, y - 14, 4, 4);

    if (ref.cardShown && ref.cardTimer > 0) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 3, y - 22, 7, 9);
      ctx.fillStyle = ref.cardShown === 'YELLOW' ? '#facc15' : '#ef4444';
      ctx.fillRect(x + 4, y - 21, 5, 7);
    }
  }

  private drawBall(
    ctx: CanvasRenderingContext2D,
    ball: BallEntity,
    competitionId: CompetitionId,
    time: number
  ) {
    for (let i = 0; i < ball.trail.length; i++) {
      const t = ball.trail[i];
      ctx.fillStyle =
        competitionId === 'super_cup'
          ? i % 2 === 0
            ? 'rgba(250, 204, 21, 0.45)'
            : 'rgba(239, 68, 68, 0.45)'
          : 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(Math.round(t.x) - 1, Math.round(t.y - t.z) - 1, 2, 2);
    }

    const bx = Math.round(ball.x);
    const by = Math.round(ball.y);
    const bz = Math.round(ball.z);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.fillRect(bx - 3, by + 1, 6, 2);

    const drawY = by - bz;

    if (competitionId === 'super_cup') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(bx - 3, drawY - 4, 6, 8);
      ctx.fillRect(bx - 4, drawY - 3, 8, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx - 2, drawY - 3, 4, 6);
      ctx.fillRect(bx - 3, drawY - 2, 6, 4);

      const phase = Math.floor((time * 12 + ball.spin) % 4);
      ctx.fillStyle = '#ef4444';
      if (phase % 2 === 0) {
        ctx.fillRect(bx - 2, drawY - 2, 2, 2);
        ctx.fillRect(bx, drawY, 2, 2);
      } else {
        ctx.fillRect(bx, drawY - 2, 2, 2);
        ctx.fillRect(bx - 2, drawY, 2, 2);
      }
      ctx.fillStyle = '#facc15';
      if (phase < 2) {
        ctx.fillRect(bx - 1, drawY - 3, 2, 2);
        ctx.fillRect(bx - 1, drawY + 1, 2, 2);
      } else {
        ctx.fillRect(bx - 3, drawY - 1, 2, 2);
        ctx.fillRect(bx + 1, drawY - 1, 2, 2);
      }
      return;
    }

    if (competitionId === 'anime_cup') {
      ctx.fillStyle = '#090914';
      ctx.fillRect(bx - 3, drawY - 3, 6, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bx - 2, drawY - 2, 4, 4);
      const rb = ['#ef4444', '#38bdf8', '#f472b6', '#22c55e'];
      ctx.fillStyle = rb[Math.floor((time * 8 + ball.spin) % rb.length)];
      ctx.fillRect(bx - 1, drawY - 1, 2, 2);
      return;
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(bx - 3, drawY - 3, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - 2, drawY - 2, 4, 4);
    ctx.fillStyle = '#0f172a';
    const px = Math.floor(ball.spin) % 2 === 0 ? -1 : 0;
    ctx.fillRect(bx + px, drawY - 1, 2, 2);
  }
}
