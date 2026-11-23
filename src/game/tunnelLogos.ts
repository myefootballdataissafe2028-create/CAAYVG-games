import { COMPETITION_LOGO_URLS, getMiddleLedPhase } from './rules';
import type { CompetitionId, StadiumTheme } from './types';

// Classic 5x7 8-bit pixel font bitmap for crisp pixel-exact rendering
const FONT_5X7: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '01010', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10011', '10101', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

const RAINBOW_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#facc15', // Yellow
  '#22c55e', // Green
  '#38bdf8', // Light Blue
  '#2563eb', // Blue
  '#4f46e5', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
];

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  topY: number,
  scale: number,
  color: string | string[],
  outlineColor?: string,
  backingColor?: string,
  maxWidth?: number
) {
  const upper = text.toUpperCase();
  const charW = 5 * scale;
  const gap = 1 * scale;
  const rawW = Math.max(charW, upper.length * (charW + gap) - gap);
  const startY = Math.round(topY);

  const drawInto = (
    target: CanvasRenderingContext2D,
    baseStartX: number,
    baseStartY: number
  ) => {
    const renderPass = (ox: number, oy: number, forcedColor?: string) => {
      for (let i = 0; i < upper.length; i++) {
        const ch = upper[i];
        const isAcuteA = ch === 'Á';
        const isTildeA = ch === 'Ã';
        const isAcuteE = ch === 'É';
        const baseCh = isAcuteA || isTildeA ? 'A' : isAcuteE ? 'E' : ch;
        const glyph = FONT_5X7[baseCh] ?? FONT_5X7[' '];
        const cx = baseStartX + i * (charW + gap) + ox;
        const fill = forcedColor ?? (Array.isArray(color) ? color[i % color.length] : color);
        target.fillStyle = fill;
        if (isAcuteA || isAcuteE) {
          target.fillRect(cx + 3 * scale, baseStartY - scale + oy, scale, scale);
          target.fillRect(cx + 2 * scale, baseStartY - Math.round(scale * 0.5) + oy, scale, scale);
        } else if (isTildeA) {
          target.fillRect(cx + 1 * scale, baseStartY - scale + oy, scale * 2, scale);
          target.fillRect(cx + 3 * scale, baseStartY - Math.round(scale * 1.4) + oy, scale, scale);
        }
        for (let r = 0; r < 7; r++) {
          const row = glyph[r];
          for (let c = 0; c < 5; c++) {
            if (row[c] === '1') {
              target.fillRect(cx + c * scale, baseStartY + r * scale + oy, scale, scale);
            }
          }
        }
      }
    };

    if (outlineColor) {
      renderPass(-scale, 0, outlineColor);
      renderPass(scale, 0, outlineColor);
      renderPass(0, -scale, outlineColor);
      renderPass(0, scale, outlineColor);
    }
    renderPass(0, 0);
  };

  if (maxWidth && rawW > maxWidth && typeof document !== 'undefined') {
    const fitW = Math.max(10, Math.floor(maxWidth));
    if (backingColor) {
      ctx.fillStyle = backingColor;
      ctx.fillRect(
        Math.round(centerX - fitW / 2) - 2 * scale,
        startY - 1 * scale,
        fitW + 4 * scale,
        7 * scale + 2 * scale
      );
    }
    const pad = scale * 2;
    const tmp = document.createElement('canvas');
    tmp.width = rawW + pad * 2;
    tmp.height = 9 * scale + pad;
    const tctx = tmp.getContext('2d');
    if (tctx) {
      tctx.imageSmoothingEnabled = false;
      drawInto(tctx, pad, scale * 2);
      const prevSmooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        tmp,
        0,
        0,
        tmp.width,
        tmp.height,
        Math.round(centerX - fitW / 2),
        startY - scale * 2,
        fitW,
        tmp.height
      );
      ctx.imageSmoothingEnabled = prevSmooth;
      return;
    }
  }

  const startX = Math.round(centerX - rawW / 2);
  if (backingColor) {
    ctx.fillStyle = backingColor;
    ctx.fillRect(startX - 3 * scale, startY - 1 * scale, rawW + 6 * scale, 7 * scale + 2 * scale);
  }
  drawInto(ctx, startX, startY);
}

// Stars for Anime King Champion Cup cosmic space backdrop
const SPACE_STARS = Array.from({ length: 42 }, (_, i) => ({
  x: ((i * 73 + 19) % 230) + 5,
  y: ((i * 41 + 11) % 125) + 5,
  phase: i * 0.7,
  big: i % 5 === 0,
}));

// Draw radiating concentric circular tunnel onto a pixel buffer
function drawTunnelBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  angleOffset: number,
  mode: CompetitionId,
  time: number
) {
  const numSectors = 24;
  const ringRadii = [0, 22, 32, 44, 58, 76, 98, 126, 165];
  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  const hexToRgb = (hex: string): [number, number, number] => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  const rainbowRgbs = RAINBOW_COLORS.map(hexToRgb);

  for (let y = 0; y < h; y++) {
    const dy = y - cy;
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const rawAngle = Math.atan2(dy, dx);
      // Rotating clockwise (right) fast: subtract angleOffset from atan2 so visual pattern spins clockwise
      const angle = rawAngle - angleOffset;
      const normAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

      let ringIdx = 0;
      for (let r = 0; r < ringRadii.length; r++) {
        if (dist >= ringRadii[r]) ringIdx = r;
      }

      // Alternating half-sector stagger per ring creates the authentic stepped tunnel look
      const sectorFloat = (normAngle / (Math.PI * 2)) * numSectors + (ringIdx % 2 === 1 ? 0.5 : 0);
      const sectorIdx = Math.floor(sectorFloat) % numSectors;
      const isPrimary = sectorIdx % 2 === 0;

      let rgb: [number, number, number];

      if (mode === 'league') {
        // Red and dark navy blue radiating tunnel
        if (ringIdx === 0) {
          rgb = [8, 13, 58];
        } else if (isPrimary) {
          rgb = ringIdx % 2 === 0 ? [200, 12, 12] : [168, 8, 14];
        } else {
          rgb = [8, 14, 58];
        }
      } else if (mode === 'king_cup') {
        // Bright yellow and black radiating tunnel
        if (ringIdx === 0) {
          rgb = [6, 6, 8];
        } else if (isPrimary) {
          rgb = ringIdx >= 6 ? [250, 238, 0] : [235, 220, 0];
        } else {
          rgb = [7, 7, 10];
        }
      } else if (mode === 'super_cup') {
        // Yellow and red radiating tunnel
        if (ringIdx === 0) {
          rgb = [220, 14, 14];
        } else if (isPrimary) {
          rgb = ringIdx % 2 === 0 ? [248, 236, 0] : [255, 200, 0];
        } else {
          rgb = [225, 12, 12];
        }
      } else {
        // Anime King Champion Cup: Black space + rainbow radiating tunnel
        if (ringIdx === 0) {
          rgb = [4, 4, 12];
        } else if (isPrimary) {
          const rbIdx = (Math.floor(sectorIdx / 2) + ringIdx) % rainbowRgbs.length;
          rgb = rainbowRgbs[rbIdx];
        } else {
          rgb = [3, 4, 10];
        }
      }

      const idx = (y * w + x) * 4;
      data[idx] = rgb[0];
      data[idx + 1] = rgb[1];
      data[idx + 2] = rgb[2];
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Sparkling pixel stars in space for Anime King Champion Cup
  if (mode === 'anime_cup') {
    for (const star of SPACE_STARS) {
      const twinkle = Math.sin(time * 6 + star.phase);
      if (twinkle > -0.2) {
        const bright = twinkle > 0.55;
        ctx.fillStyle = bright ? '#ffffff' : '#94a3b8';
        ctx.fillRect(star.x, star.y, 1, 1);
        if (star.big && bright) {
          ctx.fillRect(star.x - 1, star.y, 3, 1);
          ctx.fillRect(star.x, star.y - 1, 1, 3);
        }
      }
    }
  }
}

// 1. CAAYVG League: green pixelated C# crest
function drawLeagueEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const green = '#34b233';
  const darkGreen = '#1b6e20';
  const x = Math.round(cx - 17);
  const y = Math.round(cy - 11);

  // Dark backing shadow
  ctx.fillStyle = '#080e3a';
  ctx.fillRect(x - 1, y - 1, 36, 24);

  ctx.fillStyle = green;
  // C letter on left
  ctx.fillRect(x, y + 2, 4, 18);
  ctx.fillRect(x + 2, y, 12, 4);
  ctx.fillRect(x + 2, y + 18, 12, 4);

  // # symbol interlocked on right
  ctx.fillRect(x + 17, y + 1, 4, 20);
  ctx.fillRect(x + 26, y + 1, 4, 20);
  ctx.fillRect(x + 13, y + 6, 20, 4);
  ctx.fillRect(x + 13, y + 13, 20, 4);

  // Pixel shading bevel
  ctx.fillStyle = darkGreen;
  ctx.fillRect(x + 17, y + 17, 4, 4);
  ctx.fillRect(x + 26, y + 17, 4, 4);
}

// 2. CAAYVG King Champion Cup: super pixelated Outpost Marathon striped orb
function drawKingCupEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const yellow = '#f6eb00';
  const black = '#050505';
  const r = 15;
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);

  // Top & bottom vertical pillars
  ctx.fillStyle = black;
  ctx.fillRect(x0 - 6, y0 - r - 4, 12, r * 2 + 8);
  ctx.fillRect(x0 - r - 7, y0 - 4, (r + 7) * 2, 8);

  ctx.fillStyle = yellow;
  ctx.fillRect(x0 - 4, y0 - r - 3, 8, r * 2 + 6);
  // Left/right wing bars
  ctx.fillRect(x0 - r - 6, y0 - 1, 7, 2);
  ctx.fillRect(x0 + r - 1, y0 - 1, 7, 2);
  ctx.fillRect(x0 - r - 4, y0 - 4, 2, 8);
  ctx.fillRect(x0 + r + 2, y0 - 4, 2, 8);

  // Striped pixel sphere
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 <= r * r) {
        if (d2 >= (r - 1.5) * (r - 1.5)) {
          ctx.fillStyle = black;
        } else if (Math.abs(dx) <= 1 || Math.abs(dy) <= 1) {
          ctx.fillStyle = black;
        } else {
          // Alternating horizontal/diagonal pixel bands inside quadrants
          const stripe = (dx * dy > 0 ? dy : dx) % 3 === 0;
          ctx.fillStyle = stripe ? black : yellow;
        }
        ctx.fillRect(x0 + dx, y0 + dy, 1, 1);
      }
    }
  }
}

// 3. CAAYVG Super Cup: yellow & red Perimeter 3-chevron linked crest
function drawSuperCupEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);

  const drawChevron = (ox: number, color: string, outline: string) => {
    ctx.fillStyle = outline;
    ctx.fillRect(ox - 5, y0 - 11, 8, 22);
    ctx.fillRect(ox - 8, y0 - 5, 6, 10);

    ctx.fillStyle = color;
    ctx.fillRect(ox - 3, y0 - 9, 5, 6);
    ctx.fillRect(ox - 6, y0 - 3, 5, 6);
    ctx.fillRect(ox - 3, y0 + 3, 5, 6);
    // Circular joints
    ctx.fillRect(ox - 1, y0 - 10, 4, 4);
    ctx.fillRect(ox - 1, y0 + 6, 4, 4);
  };

  drawChevron(x0 - 10, '#facc15', '#dc2626');
  drawChevron(x0, '#facc15', '#dc2626');
  drawChevron(x0 + 10, '#facc15', '#dc2626');
}

// 4. CAAYVG Anime King Champion Cup: Cryo Archive glowing yellow snowflake crystal
function drawAnimeCupEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);

  // Crystal-shaped warm yellow pixel glow behind snowflake
  ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
  ctx.fillRect(x0 - 17, y0 - 2, 34, 5);
  ctx.fillRect(x0 - 2, y0 - 15, 5, 30);
  for (let i = -11; i <= 11; i++) {
    ctx.fillRect(x0 + i - 1, y0 + Math.round(i * 0.7) - 1, 4, 4);
    ctx.fillRect(x0 + i - 1, y0 - Math.round(i * 0.7) - 1, 4, 4);
  }

  ctx.fillStyle = '#fef08a';
  // Horizontal spine + end brackets
  ctx.fillRect(x0 - 16, y0 - 1, 32, 3);
  ctx.fillRect(x0 - 16, y0 - 4, 3, 9);
  ctx.fillRect(x0 + 13, y0 - 4, 3, 9);

  // Vertical spine
  ctx.fillRect(x0 - 1, y0 - 14, 3, 28);
  ctx.fillRect(x0 - 4, y0 - 14, 9, 2);
  ctx.fillRect(x0 - 4, y0 + 12, 9, 2);

  // Diagonal crystal arms
  for (let i = -10; i <= 10; i++) {
    ctx.fillRect(x0 + i, y0 + Math.round(i * 0.7), 2, 2);
    ctx.fillRect(x0 + i, y0 - Math.round(i * 0.7), 2, 2);
  }
  // Inner hexagon core
  ctx.fillStyle = '#facc15';
  ctx.fillRect(x0 - 5, y0 - 4, 11, 9);
  ctx.fillStyle = '#090914';
  ctx.fillRect(x0 - 2, y0 - 2, 5, 5);
}

// Pre-allocated offscreen buffer per panel (240x135) for crisp 8-bit scaling
const panelCanvasCache: Partial<Record<CompetitionId, HTMLCanvasElement>> = {};

function getPanelBuffer(id: CompetitionId, w: number, h: number): HTMLCanvasElement {
  let c = panelCanvasCache[id];
  if (!c) {
    c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    panelCanvasCache[id] = c;
  }
  return c;
}

export function renderCompetitionPanel(
  targetCtx: CanvasRenderingContext2D,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  mode: CompetitionId,
  time: number,
  selected: boolean
) {
  const pw = 240;
  const ph = 135;
  const buf = getPanelBuffer(mode, pw, ph);
  const bctx = buf.getContext('2d');
  if (!bctx) return;
  bctx.imageSmoothingEnabled = false;

  // Rotating right fast!
  const angleOffset = time * 2.9;
  const cx = Math.floor(pw / 2);
  const cy = Math.floor(ph * 0.43);

  drawTunnelBackground(bctx, pw, ph, cx, cy, angleOffset, mode, time);

  if (mode === 'league') {
    drawPixelText(bctx, 'CAAYVG LEAGUE', cx, ph - 34, 2, '#34b233', '#070b2b');
    drawPixelText(bctx, '26/27', cx, ph - 17, 2, '#34b233', '#070b2b');
  } else if (mode === 'king_cup') {
    drawPixelText(bctx, 'CAAYVG KING CHAMPION CUP', cx, ph - 31, 1, '#facc15', '#000000', '#050505');
    drawPixelText(bctx, '26/27', cx, ph - 17, 2, '#facc15', '#000000', '#050505');
  } else if (mode === 'super_cup') {
    drawPixelText(bctx, 'CAAYVG SUPER CUP', cx, ph - 31, 1, '#fef08a', '#b91c1c', '#dc2626');
    drawPixelText(bctx, '26/27', cx, ph - 17, 2, '#fef08a', '#b91c1c', '#dc2626');
  } else {
    drawPixelText(bctx, 'CAAYVG ANIME', cx, ph - 41, 1, RAINBOW_COLORS, '#000000', 'rgba(0,0,0,0.75)');
    drawPixelText(bctx, 'KING CHAMPION CUP', cx, ph - 29, 1, RAINBOW_COLORS, '#000000', 'rgba(0,0,0,0.75)');
    drawPixelText(bctx, '26/27', cx, ph - 16, 2, RAINBOW_COLORS, '#000000', 'rgba(0,0,0,0.75)');
  }

  targetCtx.imageSmoothingEnabled = false;
  targetCtx.drawImage(buf, destX, destY, destW, destH);
}

function parseRgbTuple(hex: string): [number, number, number] {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  const n = parseInt(clean.slice(0, 6), 16);
  if (Number.isNaN(n)) return [255, 255, 255];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const RAINBOW_RGBS = RAINBOW_COLORS.map(parseRgbTuple);

interface TunnelPolarLut {
  imgData: ImageData;
  ringIdx: Uint8Array;
  baseSector: Float32Array;
}
const tunnelPolarLutCache = new Map<string, TunnelPolarLut>();

function getTunnelPolarLut(ctx: CanvasRenderingContext2D, w: number, h: number): TunnelPolarLut {
  const key = `${w}x${h}`;
  let cached = tunnelPolarLutCache.get(key);
  if (cached) return cached;

  const total = w * h;
  const ringIdxArr = new Uint8Array(total);
  const baseSectorArr = new Float32Array(total);
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  const maxR = Math.max(w * 0.6, h * 0.8);
  const numSectors = 22;
  const twoPi = Math.PI * 2;
  const yScale = w > h * 3 ? 2.2 : 1.0;

  for (let y = 0; y < h; y++) {
    const dy = (y - cy) * yScale;
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const rIdx = Math.min(7, Math.floor((dist / maxR) * 8));
      const rawAngle = Math.atan2(dy, dx);
      const i = y * w + x;
      ringIdxArr[i] = rIdx;
      baseSectorArr[i] = (rawAngle / twoPi) * numSectors + (rIdx % 2 === 1 ? 0.5 : 0);
    }
  }

  cached = {
    imgData: ctx.createImageData(w, h),
    ringIdx: ringIdxArr,
    baseSector: baseSectorArr,
  };
  tunnelPolarLutCache.set(key, cached);
  return cached;
}

const ALL_SPECTRUM_COLORS = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#38bdf8',
  '#3b82f6',
  '#4f46e5',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#ffffff',
];
const ALL_SPECTRUM_RGBS = ALL_SPECTRUM_COLORS.map(parseRgbTuple);

function drawSunburntTunnelPixels(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  mode: CompetitionId,
  time: number,
  variant:
    | 'red_league'
    | 'club_flicker'
    | 'king_yellow'
    | 'super_red_yellow'
    | 'anime_rainbow'
    | 'league_road38_rainbow'
    | 'league_finale38_flicker',
  clubColors?: [string, string, string]
) {
  const lut = getTunnelPolarLut(ctx, w, h);
  const imgData = lut.imgData;
  const data = imgData.data;
  const ringArr = lut.ringIdx;
  const baseSectorArr = lut.baseSector;
  const numSectors = 22;
  // Rotating clockwise (right) fast!
  const sectorShift = (time * 3.6 * numSectors) / (Math.PI * 2);

  const flickerTick = Math.floor(time * 22);
  const allColorTick = Math.floor(time * 26);
  const c0 = parseRgbTuple(clubColors?.[0] ?? '#ef4444');
  const c1 = parseRgbTuple(clubColors?.[1] ?? '#facc15');
  const c2 = parseRgbTuple(clubColors?.[2] ?? '#ffffff');
  const clubA = flickerTick % 3 === 0 ? c0 : flickerTick % 3 === 1 ? c1 : c2;
  const clubB = flickerTick % 2 === 0 ? c1 : c0;
  const clubBDim0 = Math.floor(clubB[0] * 0.32);
  const clubBDim1 = Math.floor(clubB[1] * 0.32);
  const clubBDim2 = Math.floor(clubB[2] * 0.32);

  const total = w * h;
  for (let i = 0; i < total; i++) {
    const ringIdx = ringArr[i];
    const sRaw = Math.floor(baseSectorArr[i] - sectorShift);
    const sectorIdx = ((sRaw % numSectors) + numSectors) % numSectors;
    const isPrimary = (sectorIdx & 1) === 0;
    const ringEven = (ringIdx & 1) === 0;

    let r = 0;
    let g = 0;
    let b = 0;

    if (variant === 'club_flicker') {
      if (isPrimary) {
        const col = ringEven ? clubA : clubB;
        r = col[0];
        g = col[1];
        b = col[2];
      } else if (ringEven) {
        r = clubBDim0;
        g = clubBDim1;
        b = clubBDim2;
      } else {
        r = 12;
        g = 10;
        b = 18;
      }
    } else if (variant === 'red_league') {
      if (isPrimary) {
        if (ringEven) { r = 224; g = 22; b = 24; }
        else { r = 188; g = 32; b = 18; }
      } else if (ringEven) {
        r = 8; g = 16; b = 68;
      } else {
        r = 14; g = 26; b = 92;
      }
    } else if (variant === 'king_yellow') {
      if (isPrimary) {
        if (ringEven) { r = 252; g = 232; b = 0; }
        else { r = 228; g = 178; b = 0; }
      } else if (ringEven) {
        r = 12; g = 10; b = 6;
      } else {
        r = 58; g = 38; b = 4;
      }
    } else if (variant === 'super_red_yellow') {
      if (isPrimary) {
        if (ringEven) { r = 252; g = 228; b = 0; }
        else { r = 245; g = 176; b = 0; }
      } else if (ringEven) {
        r = 218; g = 18; b = 18;
      } else {
        r = 162; g = 12; b = 12;
      }
    } else if (variant === 'league_finale38_flicker') {
      if (isPrimary) {
        const spIdx = (sectorIdx + ringIdx * 2 + allColorTick) % ALL_SPECTRUM_RGBS.length;
        const col = ALL_SPECTRUM_RGBS[spIdx];
        r = col[0];
        g = col[1];
        b = col[2];
      } else if (ringEven) {
        const spIdx2 = (sectorIdx + ringIdx + allColorTick + 5) % ALL_SPECTRUM_RGBS.length;
        const col2 = ALL_SPECTRUM_RGBS[spIdx2];
        r = Math.floor(col2[0] * 0.28);
        g = Math.floor(col2[1] * 0.28);
        b = Math.floor(col2[2] * 0.28);
      } else {
        r = 2; g = 3; b = 12;
      }
    } else if (variant === 'league_road38_rainbow') {
      if (isPrimary) {
        const rbIdx = ((sectorIdx >> 1) + ringIdx) % RAINBOW_RGBS.length;
        const col = RAINBOW_RGBS[rbIdx];
        r = col[0];
        g = col[1];
        b = col[2];
      } else {
        // Deep outer space sectors between rainbow sunburnt rays
        r = 2; g = 3; b = 12;
      }
    } else {
      if (isPrimary) {
        const rbIdx = ((sectorIdx >> 1) + ringIdx) % RAINBOW_RGBS.length;
        const col = RAINBOW_RGBS[rbIdx];
        r = col[0];
        g = col[1];
        b = col[2];
      } else {
        r = 8; g = 6; b = 18;
      }
    }

    const idx = i << 2;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  if (mode === 'anime_cup' || variant === 'league_road38_rainbow' || variant === 'league_finale38_flicker') {
    const starCount = variant === 'league_finale38_flicker' ? 36 : variant === 'league_road38_rainbow' ? 28 : 16;
    for (let i = 0; i < starCount; i++) {
      const sx = (i * 29 + Math.floor(time * 9)) % w;
      const sy =
        (i * 11 +
          (variant === 'league_road38_rainbow' || variant === 'league_finale38_flicker'
            ? Math.floor(time * 5)
            : 3)) %
        h;
      if (Math.sin(time * 8 + i) > -0.1) {
        ctx.fillStyle =
          variant === 'league_finale38_flicker'
            ? ALL_SPECTRUM_COLORS[(i + allColorTick) % ALL_SPECTRUM_COLORS.length]
            : i % 3 === 0
            ? '#fef08a'
            : '#ffffff';
        ctx.fillRect(sx, sy, 1, 1);
      }
    }
  }
}

const ledTunnelCache = new Map<string, HTMLCanvasElement>();
function getLedTunnelBuffer(w: number, h: number): HTMLCanvasElement {
  const key = `${w}x${h}`;
  let c = ledTunnelCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    ledTunnelCache.set(key, c);
  }
  return c;
}

const extraLedTunnelCache = new Map<string, HTMLCanvasElement>();
function getExtraLedTunnelBuffer(w: number, h: number): HTMLCanvasElement {
  const key = `${w}x${h}`;
  let c = extraLedTunnelCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    extraLedTunnelCache.set(key, c);
  }
  return c;
}

export type CompetitionLogoVariant =
  | CompetitionId
  | 'league_clasico'
  | 'league_rainbow'
  | 'league_yellow_glow';

interface CachedCompetitionLogo {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  width: number;
  height: number;
}

const competitionLogoCache = new Map<CompetitionLogoVariant, CachedCompetitionLogo>();
const logoListeners = new Set<() => void>();
let competitionLogoLoadStarted = false;

function buildVariantFromForeground(
  baseCanvas: HTMLCanvasElement,
  isEdgeMask: Uint8Array | null,
  variant: CompetitionLogoVariant
) {
  const w = baseCanvas.width;
  const h = baseCanvas.height;
  const srcCtx = baseCanvas.getContext('2d');
  if (!srcCtx) return;

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d');
  if (!octx) return;

  const srcData = srcCtx.getImageData(0, 0, w, h);
  const dstData = octx.createImageData(w, h);
  const spx = srcData.data;
  const dpx = dstData.data;

  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    const alpha = spx[idx + 3];
    if (alpha === 0) {
      dpx[idx + 3] = 0;
      continue;
    }

    const r = spx[idx];
    const g = spx[idx + 1];
    const b = spx[idx + 2];
    // Preserve intentional black internal markings (e.g. Outpost Marathon inner lettering)
    const lum = r * 0.299 + g * 0.587 + b * 0.114;
    if (lum < 75) {
      dpx[idx] = 8;
      dpx[idx + 1] = 10;
      dpx[idx + 2] = 14;
      dpx[idx + 3] = alpha;
      continue;
    }

    let tr = 250;
    let tg = 204;
    let tb = 21;

    if (variant === 'league') {
      // Pure vivid Green for CAAYVG League (Title Screen + normal League matches)
      tr = 38;
      tg = 204;
      tb = 56;
    } else if (variant === 'league_clasico') {
      // Bright Yellow for Clásico matches on middle LED board
      tr = 255;
      tg = 242;
      tb = 0;
    } else if (variant === 'league_yellow_glow') {
      // Glowing luminous Yellow for Road to Round 38 (Rounds 30..37)
      tr = 254;
      tg = 240;
      tb = 52;
    } else if (variant === 'league_rainbow') {
      // Vivid diagonal Rainbow for Road to Round 38 / Finale 38
      const pxX = i % w;
      const pxY = Math.floor(i / w);
      const t = Math.max(0, Math.min(0.999, (pxX / Math.max(1, w)) * 0.72 + (pxY / Math.max(1, h)) * 0.28));
      const fIdx = t * (RAINBOW_RGBS.length - 1);
      const cA = RAINBOW_RGBS[Math.floor(fIdx)];
      const cB = RAINBOW_RGBS[Math.min(RAINBOW_RGBS.length - 1, Math.floor(fIdx) + 1)];
      const frac = fIdx - Math.floor(fIdx);
      tr = Math.round(cA[0] + (cB[0] - cA[0]) * frac);
      tg = Math.round(cA[1] + (cB[1] - cA[1]) * frac);
      tb = Math.round(cA[2] + (cB[2] - cA[2]) * frac);
    } else if (variant === 'king_cup') {
      // Bright Yellow for King Champion Cup (Title Screen + matches)
      tr = 250;
      tg = 224;
      tb = 0;
    } else if (variant === 'super_cup') {
      // Red & Yellow design for Super Cup: bold Red outline around bright Yellow body
      if (isEdgeMask && isEdgeMask[i] === 1) {
        tr = 228;
        tg = 22;
        tb = 22;
      } else {
        tr = 252;
        tg = 224;
        tb = 0;
      }
    } else {
      // Warm Glowing Yellow for Anime King Champion Cup (Cryo Archive)
      tr = 254;
      tg = 240;
      tb = 96;
    }

    dpx[idx] = tr;
    dpx[idx + 1] = tg;
    dpx[idx + 2] = tb;
    dpx[idx + 3] = alpha;
  }

  octx.putImageData(dstData, 0, 0);

  let dataUrl = '';
  try {
    dataUrl = out.toDataURL('image/png');
  } catch {
    dataUrl = '';
  }

  competitionLogoCache.set(variant, {
    canvas: out,
    dataUrl,
    width: w,
    height: h,
  });
}

function buildCompetitionLogoSprite(id: CompetitionId, img: HTMLImageElement) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h || typeof document === 'undefined') return;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w;
  srcCanvas.height = h;
  const sctx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!sctx) return;
  sctx.drawImage(img, 0, 0);

  const imgData = sctx.getImageData(0, 0, w, h);
  const px = imgData.data;

  // Sample top-left background color to remove blue backdrop cleanly while keeping smooth original anti-aliased edges
  const bgR = px[0];
  const bgG = px[1];
  const bgB = px[2];

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = px[idx];
      const g = px[idx + 1];
      const b = px[idx + 2];

      const colorDist = Math.hypot(r - bgR, g - bgG, b - bgB);
      const isStrongBlueBg = b > Math.max(r, g) + 24 && r < 95 && g < 115;

      if (isStrongBlueBg && colorDist < 42) {
        px[idx + 3] = 0;
      } else if (isStrongBlueBg && colorDist < 90) {
        const a = Math.round(((colorDist - 42) / 48) * 255);
        px[idx + 3] = a;
        if (a > 24) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      } else {
        px[idx + 3] = 255;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return;
  sctx.putImageData(imgData, 0, 0);

  const pad = 2;
  const cx0 = Math.max(0, minX - pad);
  const cy0 = Math.max(0, minY - pad);
  const cropW = Math.min(w - cx0, maxX - minX + 1 + pad * 2);
  const cropH = Math.min(h - cy0, maxY - minY + 1 + pad * 2);
  const cropped = document.createElement('canvas');
  cropped.width = cropW;
  cropped.height = cropH;
  const cctx = cropped.getContext('2d', { willReadFrequently: true });
  if (!cctx) return;
  cctx.drawImage(srcCanvas, cx0, cy0, cropW, cropH, 0, 0, cropW, cropH);

  // Compute crisp outer red-rim mask for Super Cup so Perimeter crest is Red around Yellow
  let superEdgeMask: Uint8Array | null = null;
  if (id === 'super_cup') {
    const cData = cctx.getImageData(0, 0, cropW, cropH).data;
    const solid = new Uint8Array(cropW * cropH);
    for (let i = 0; i < cropW * cropH; i++) {
      solid[i] = cData[i * 4 + 3] >= 120 ? 1 : 0;
    }
    superEdgeMask = new Uint8Array(cropW * cropH);
    const rimR = Math.max(3, Math.round(cropH * 0.048));
    const rimR2 = rimR * rimR;
    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const idx = y * cropW + x;
        if (!solid[idx]) continue;
        let nearOutside = false;
        for (let dy = -rimR; dy <= rimR && !nearOutside; dy++) {
          const ny = y + dy;
          for (let dx = -rimR; dx <= rimR; dx++) {
            if (dx * dx + dy * dy > rimR2) continue;
            const nx = x + dx;
            if (nx < 0 || nx >= cropW || ny < 0 || ny >= cropH || !solid[ny * cropW + nx]) {
              nearOutside = true;
              break;
            }
          }
        }
        if (nearOutside) superEdgeMask[idx] = 1;
      }
    }
  }

  buildVariantFromForeground(cropped, superEdgeMask, id);
  if (id === 'league') {
    buildVariantFromForeground(cropped, null, 'league_clasico');
    buildVariantFromForeground(cropped, null, 'league_rainbow');
    buildVariantFromForeground(cropped, null, 'league_yellow_glow');
  }

  for (const cb of logoListeners) cb();
}

export function preloadCompetitionLogos() {
  if (competitionLogoLoadStarted || typeof Image === 'undefined') return;
  competitionLogoLoadStarted = true;
  (Object.keys(COMPETITION_LOGO_URLS) as CompetitionId[]).forEach((id) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => buildCompetitionLogoSprite(id, img);
    img.src = COMPETITION_LOGO_URLS[id];
  });
}

export function getCompetitionLogoDataUrl(variant: CompetitionLogoVariant): string | null {
  if (!competitionLogoLoadStarted) preloadCompetitionLogos();
  return competitionLogoCache.get(variant)?.dataUrl ?? null;
}

export function subscribeCompetitionLogos(cb: () => void): () => void {
  preloadCompetitionLogos();
  logoListeners.add(cb);
  return () => logoListeners.delete(cb);
}

// Helper for drawing a competition logo sprite at any rectangle (used in Trophy LED coming-down animation)
export function drawHighResCompetitionLogoAt(
  dctx: CanvasRenderingContext2D,
  mode: CompetitionId,
  variant: CompetitionLogoVariant,
  centerX: number,
  centerY: number,
  maxH: number,
  glowColor?: string
) {
  if (!competitionLogoLoadStarted) preloadCompetitionLogos();
  const sprite = competitionLogoCache.get(variant) ?? competitionLogoCache.get(mode);
  if (!sprite) return;
  const aspect = sprite.width / sprite.height;
  const drawH = maxH;
  const drawW = Math.round(drawH * aspect);
  dctx.save();
  if (glowColor) {
    dctx.shadowColor = glowColor;
    dctx.shadowBlur = 12;
  }
  dctx.imageSmoothingEnabled = true;
  dctx.imageSmoothingQuality = 'high';
  dctx.drawImage(sprite.canvas, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
  dctx.restore();
}

// High-resolution smooth unpixelated very-zoomed-in transparent competition logo
// rendered directly onto the high-DPI display canvas clipped inside the middle LED rect
export function drawHighResLedCompetitionLogoOverlay(
  dctx: CanvasRenderingContext2D,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  mode: CompetitionId,
  time: number,
  isRivalry = false,
  isRoadTo38 = false,
  isFinale38 = false
) {
  const { phase, progress } = getMiddleLedPhase(time);
  if (phase !== 'logo_fly_up_1' && phase !== 'logo_fly_up_2') return;

  if (!competitionLogoLoadStarted) preloadCompetitionLogos();
  const variant: CompetitionLogoVariant =
    isFinale38 && mode === 'league'
      ? 'league_rainbow'
      : isRoadTo38 && mode === 'league'
      ? 'league_yellow_glow'
      : isRivalry && mode === 'league'
      ? 'league_clasico'
      : mode;
  const sprite = competitionLogoCache.get(variant) ?? competitionLogoCache.get(mode);
  if (!sprite) return;

  dctx.save();
  dctx.beginPath();
  dctx.rect(destX, destY, destW, destH);
  dctx.clip();

  // Very zoomed in realistic transparent-background logo flying straight up across the LED board!
  const drawH = Math.max(destH * 2.1, Math.round(destH * 2.75));
  const aspect = sprite.width / sprite.height;
  const drawW = Math.min(Math.round(destW * 0.72), Math.round(drawH * aspect));
  const x = Math.round(destX + (destW - drawW) / 2);
  const startY = destY + destH + 6;
  const endY = destY - drawH - 6;
  const y = Math.round(startY + (endY - startY) * progress);

  if (mode === 'anime_cup' || ((isRoadTo38 || isFinale38) && mode === 'league')) {
    dctx.shadowColor = isFinale38
      ? 'rgba(255, 255, 255, 0.95)'
      : isRoadTo38
      ? 'rgba(250, 204, 21, 0.96)'
      : 'rgba(254, 240, 138, 0.9)';
    dctx.shadowBlur = isRoadTo38 || isFinale38 ? 16 : 10;
  }

  dctx.imageSmoothingEnabled = true;
  dctx.imageSmoothingQuality = 'high';
  dctx.drawImage(sprite.canvas, x, y, drawW, drawH);
  dctx.restore();
}

// Transparent (no backdrop color/box) crisp vector architectural logo per stadium
function drawTransparentStadiumLogo(
  dctx: CanvasRenderingContext2D,
  stadium: StadiumTheme,
  cx: number,
  cy: number,
  size: number
) {
  const r = size * 0.48;
  dctx.save();
  dctx.translate(cx, cy);
  dctx.lineJoin = 'round';
  dctx.lineCap = 'round';

  const outline = (lw = Math.max(1.8, size * 0.08)) => {
    dctx.strokeStyle = '#020617';
    dctx.lineWidth = lw;
    dctx.stroke();
  };

  switch (stadium.id) {
    case 'prince-abdullah-alfaisal': {
      // Sweeping white tension-sail roof canopy + Jeddah sky-blue curve
      dctx.beginPath();
      dctx.moveTo(-r, r * 0.1);
      dctx.quadraticCurveTo(0, -r * 0.95, r, r * 0.1);
      dctx.quadraticCurveTo(0, -r * 0.35, -r, r * 0.1);
      dctx.closePath();
      dctx.fillStyle = '#f8fafc';
      outline();
      dctx.fill();

      dctx.beginPath();
      dctx.ellipse(0, r * 0.38, r * 0.85, r * 0.32, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#0284c7';
      outline(Math.max(1.5, size * 0.06));
      dctx.fill();

      dctx.beginPath();
      dctx.ellipse(0, r * 0.38, r * 0.48, r * 0.14, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#22c55e';
      dctx.fill();
      break;
    }
    case 'al-jawhara': {
      // Al-Jawhara jewel diamond lattice truss bowl
      dctx.beginPath();
      dctx.moveTo(0, -r * 0.92);
      dctx.lineTo(r * 0.96, -r * 0.12);
      dctx.lineTo(r * 0.62, r * 0.72);
      dctx.lineTo(-r * 0.62, r * 0.72);
      dctx.lineTo(-r * 0.96, -r * 0.12);
      dctx.closePath();
      dctx.fillStyle = '#cbd5e1';
      outline();
      dctx.fill();

      dctx.beginPath();
      dctx.moveTo(0, -r * 0.62);
      dctx.lineTo(r * 0.56, r * 0.02);
      dctx.lineTo(0, r * 0.45);
      dctx.lineTo(-r * 0.56, r * 0.02);
      dctx.closePath();
      dctx.fillStyle = '#fb923c';
      dctx.fill();
      break;
    }
    case 'mohammed-bin-fahd': {
      // Terracotta oval athletics track ring + blue canopy stands
      dctx.beginPath();
      dctx.ellipse(0, 0, r * 0.98, r * 0.72, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#9a3412';
      outline();
      dctx.fill();

      dctx.beginPath();
      dctx.ellipse(0, 0, r * 0.64, r * 0.4, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#16a34a';
      dctx.strokeStyle = '#ffffff';
      dctx.lineWidth = Math.max(1.2, size * 0.05);
      dctx.fill();
      dctx.stroke();
      break;
    }
    case 'king-saud-univ': {
      // Royal gold curved canopy bowl + navy fascia trim
      dctx.beginPath();
      dctx.ellipse(0, r * 0.15, r * 0.96, r * 0.66, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#facc15';
      outline();
      dctx.fill();

      dctx.beginPath();
      dctx.ellipse(0, r * 0.12, r * 0.68, r * 0.38, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#0f172a';
      dctx.fill();

      dctx.beginPath();
      dctx.ellipse(0, r * 0.12, r * 0.46, r * 0.22, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#22c55e';
      dctx.fill();
      break;
    }
    case 'maracana-pixel': {
      // Maracanã yellow & green sweeping oval ring
      dctx.beginPath();
      dctx.ellipse(0, r * 0.08, r * 0.98, r * 0.68, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#facc15';
      outline();
      dctx.fill();

      dctx.beginPath();
      dctx.ellipse(0, r * 0.08, r * 0.64, r * 0.38, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#15803d';
      dctx.fill();

      dctx.beginPath();
      dctx.moveTo(0, -r * 0.22);
      dctx.lineTo(r * 0.28, r * 0.08);
      dctx.lineTo(0, r * 0.34);
      dctx.lineTo(-r * 0.28, r * 0.08);
      dctx.closePath();
      dctx.fillStyle = '#38bdf8';
      dctx.fill();
      break;
    }
    case 'glitter-dome': {
      // Faceted starlight rainbow crystal dome
      dctx.beginPath();
      dctx.arc(0, r * 0.12, r * 0.86, Math.PI, 0);
      dctx.lineTo(r * 0.86, r * 0.62);
      dctx.lineTo(-r * 0.86, r * 0.62);
      dctx.closePath();
      dctx.fillStyle = '#f472b6';
      outline();
      dctx.fill();

      // 4-point star spire atop dome
      dctx.beginPath();
      dctx.moveTo(0, -r);
      dctx.lineTo(r * 0.18, -r * 0.28);
      dctx.lineTo(r * 0.42, -r * 0.15);
      dctx.lineTo(r * 0.18, 0);
      dctx.lineTo(0, r * 0.45);
      dctx.lineTo(-r * 0.18, 0);
      dctx.lineTo(-r * 0.42, -r * 0.15);
      dctx.lineTo(-r * 0.18, -r * 0.28);
      dctx.closePath();
      dctx.fillStyle = '#fef08a';
      dctx.fill();
      break;
    }
    case 'rage-pit': {
      // Crimson flame crest & stadium pit
      dctx.beginPath();
      dctx.moveTo(-r * 0.88, r * 0.68);
      dctx.lineTo(-r * 0.72, -r * 0.68);
      dctx.lineTo(-r * 0.22, -r * 0.18);
      dctx.lineTo(0, -r * 0.88);
      dctx.lineTo(r * 0.22, -r * 0.18);
      dctx.lineTo(r * 0.72, -r * 0.68);
      dctx.lineTo(r * 0.88, r * 0.68);
      dctx.closePath();
      dctx.fillStyle = '#ef4444';
      outline();
      dctx.fill();
      break;
    }
    case 'jump-city-tower': {
      // T-Tower skyline silhouette over stadium arch
      dctx.beginPath();
      dctx.moveTo(-r * 0.72, -r * 0.78);
      dctx.lineTo(r * 0.72, -r * 0.78);
      dctx.lineTo(r * 0.72, -r * 0.24);
      dctx.lineTo(r * 0.26, -r * 0.24);
      dctx.lineTo(r * 0.26, r * 0.75);
      dctx.lineTo(-r * 0.26, r * 0.75);
      dctx.lineTo(-r * 0.26, -r * 0.24);
      dctx.lineTo(-r * 0.72, -r * 0.24);
      dctx.closePath();
      dctx.fillStyle = '#38bdf8';
      outline();
      dctx.fill();
      break;
    }
    case 'cosmic-orbit': {
      // Tilted orbital ring & cosmic dome
      dctx.beginPath();
      dctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
      dctx.fillStyle = '#14b8a6';
      outline();
      dctx.fill();

      dctx.beginPath();
      dctx.ellipse(0, 0, r * 0.98, r * 0.32, -0.35, 0, Math.PI * 2);
      dctx.strokeStyle = '#a855f7';
      dctx.lineWidth = Math.max(2.2, size * 0.12);
      dctx.stroke();
      break;
    }
    case 'wii-colosseum': {
      // White & royal blue arched colosseum
      dctx.beginPath();
      dctx.roundRect(-r * 0.9, -r * 0.45, r * 1.8, r * 1.05, r * 0.28);
      dctx.fillStyle = '#f8fafc';
      outline();
      dctx.fill();
      dctx.fillStyle = '#1d4ed8';
      for (const ax of [-r * 0.5, 0, r * 0.5]) {
        dctx.beginPath();
        dctx.arc(ax, r * 0.18, r * 0.18, Math.PI, 0);
        dctx.lineTo(ax + r * 0.18, r * 0.56);
        dctx.lineTo(ax - r * 0.18, r * 0.56);
        dctx.closePath();
        dctx.fill();
      }
      break;
    }
    case 'poofesure-park': {
      // Orange grandstand gable & green diamond turf
      dctx.beginPath();
      dctx.moveTo(0, -r * 0.85);
      dctx.lineTo(r * 0.92, -r * 0.05);
      dctx.lineTo(r * 0.72, r * 0.68);
      dctx.lineTo(-r * 0.72, r * 0.68);
      dctx.lineTo(-r * 0.92, -r * 0.05);
      dctx.closePath();
      dctx.fillStyle = '#f97316';
      outline();
      dctx.fill();
      dctx.fillStyle = '#fef08a';
      dctx.beginPath();
      dctx.moveTo(0, -r * 0.3);
      dctx.lineTo(r * 0.42, r * 0.14);
      dctx.lineTo(0, r * 0.55);
      dctx.lineTo(-r * 0.42, r * 0.14);
      dctx.closePath();
      dctx.fill();
      break;
    }
    case 'fateen-oasis': {
      // Teal stadium arch & golden crescent moon
      dctx.beginPath();
      dctx.ellipse(0, r * 0.3, r * 0.9, r * 0.46, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#14b8a6';
      outline();
      dctx.fill();
      dctx.beginPath();
      dctx.arc(-r * 0.05, -r * 0.34, r * 0.42, 0, Math.PI * 2);
      dctx.fillStyle = '#fde047';
      dctx.fill();
      dctx.beginPath();
      dctx.arc(r * 0.14, -r * 0.4, r * 0.34, 0, Math.PI * 2);
      dctx.fillStyle = '#042f2e';
      dctx.fill();
      break;
    }
    case 'snowpeak-dome': {
      // Frosted cryo crystal mountain dome
      dctx.beginPath();
      dctx.moveTo(-r * 0.92, r * 0.65);
      dctx.lineTo(-r * 0.48, -r * 0.62);
      dctx.lineTo(-r * 0.12, -r * 0.15);
      dctx.lineTo(r * 0.18, -r * 0.85);
      dctx.lineTo(r * 0.92, r * 0.65);
      dctx.closePath();
      dctx.fillStyle = '#38bdf8';
      outline();
      dctx.fill();
      dctx.beginPath();
      dctx.moveTo(r * 0.18, -r * 0.85);
      dctx.lineTo(r * 0.45, -r * 0.25);
      dctx.lineTo(-r * 0.02, -r * 0.3);
      dctx.closePath();
      dctx.fillStyle = '#ffffff';
      dctx.fill();
      break;
    }
    case 'sunset-harbor': {
      // Harbor arch & twin golden flood masts
      dctx.beginPath();
      dctx.ellipse(0, r * 0.22, r * 0.92, r * 0.48, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#10b981';
      outline();
      dctx.fill();
      dctx.fillStyle = '#fde68a';
      dctx.fillRect(-r * 0.56, -r * 0.72, r * 0.16, r * 0.72);
      dctx.fillRect(r * 0.4, -r * 0.72, r * 0.16, r * 0.72);
      break;
    }
    case 'efootball-stadium': {
      // Cobalt-blue arena diamond with red/yellow/cyan/orange/green angled blocks + white core
      dctx.fillStyle = '#ef4444';
      dctx.fillRect(-r * 0.86, -r * 0.78, r * 0.56, r * 0.26);
      dctx.fillStyle = '#38bdf8';
      dctx.fillRect(r * 0.24, -r * 0.78, r * 0.58, r * 0.28);
      dctx.fillStyle = '#f97316';
      dctx.fillRect(-r * 0.88, r * 0.42, r * 0.62, r * 0.28);
      dctx.fillStyle = '#22c55e';
      dctx.fillRect(r * 0.24, r * 0.42, r * 0.62, r * 0.28);
      dctx.fillStyle = '#facc15';
      dctx.fillRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9);
      dctx.beginPath();
      dctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
      dctx.fillStyle = '#00008b';
      outline(Math.max(1.5, size * 0.06));
      dctx.fill();
      dctx.fillStyle = '#ffffff';
      dctx.fillRect(-r * 0.26, -r * 0.1, r * 0.52, r * 0.2);
      break;
    }
    default: {
      // CAAYVG Classic Bowl: iconic pixel bowl + twin bright floodlight pylons
      dctx.beginPath();
      dctx.ellipse(0, r * 0.16, r * 0.94, r * 0.58, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#22c55e';
      outline();
      dctx.fill();

      dctx.beginPath();
      dctx.ellipse(0, r * 0.16, r * 0.58, r * 0.32, 0, 0, Math.PI * 2);
      dctx.fillStyle = '#090d1f';
      dctx.fill();

      dctx.fillStyle = '#fef08a';
      dctx.fillRect(-r * 0.68, -r * 0.78, r * 0.24, r * 0.46);
      dctx.fillRect(r * 0.44, -r * 0.78, r * 0.24, r * 0.46);
      break;
    }
  }

  dctx.restore();
}

const cityPixelCache = new Map<string, HTMLCanvasElement>();
function getCityPixelBuffer(w: number, h: number): HTMLCanvasElement {
  const key = `${w}x${h}`;
  let c = cityPixelCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    cityPixelCache.set(key, c);
  }
  return c;
}

// High-resolution BIG ALL-CAPS PIXELATED bilingual City Name ("PIXEL CITY - مدينة البكسل", "RIO - ريو", etc.)
// + Transparent Stadium Logo (no backdrop box) rendered on high-DPI displayCanvas during city_fly_up / city_hold / early logo_fly_up_2
export function drawHighResLedCityOverlay(
  dctx: CanvasRenderingContext2D,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  mode: CompetitionId,
  time: number,
  stadium: StadiumTheme,
  isRivalry = false,
  isRoadTo38 = false,
  isFinale38 = false
) {
  const { phase, progress } = getMiddleLedPhase(time);
  let yOffset = 0;
  if (phase === 'city_fly_up') {
    // 0.5s: Flies straight upward from bottom edge into center
    yOffset = (1 - progress) * (destH + 6);
  } else if (phase === 'city_hold') {
    // 4.7s: Stays centered on middle perimeter LED board
    yOffset = 0;
  } else if (phase === 'logo_fly_up_2' && progress < 0.36) {
    // Exits straight upward quickly as the competition logo arrives upward
    const exitP = progress / 0.36;
    yOffset = -exitP * (destH + 6);
  } else {
    return;
  }

  // City names are always ALL CAPS
  const label = (stadium.cityDisplay || stadium.city).toUpperCase();
  const logoSize = Math.round(destH * 0.94);
  const gap = Math.max(8, Math.round(destH * 0.24));

  dctx.save();
  dctx.beginPath();
  dctx.rect(destX, destY, destW, destH);
  dctx.clip();

  // Render into a low-res offscreen pixel canvas & upscale with nearest-neighbor so city text is authentically PIXELATED
  const pixelBlock = Math.max(2, Math.round(destH / 12));
  const bufW = Math.max(64, Math.round(destW / pixelBlock));
  const bufH = Math.max(12, Math.round(destH / pixelBlock));
  const cityPixelBuffer = getCityPixelBuffer(bufW, bufH);
  const pctx = cityPixelBuffer.getContext('2d');
  if (!pctx) {
    dctx.restore();
    return;
  }
  pctx.imageSmoothingEnabled = false;
  pctx.clearRect(0, 0, bufW, bufH);

  const logoBufSpace = Math.ceil((logoSize + gap) / pixelBlock);
  const maxTextBufW = Math.max(32, bufW - logoBufSpace - 6);
  let fontSize = Math.max(9, Math.round(bufH * 0.78));
  const buildPixelFont = (sz: number) =>
    `900 ${sz}px "Press Start 2P", "VT323", "Tajawal", "Noto Sans Arabic", monospace`;

  pctx.font = buildPixelFont(fontSize);
  let textBufW = pctx.measureText(label).width;
  if (textBufW > maxTextBufW && textBufW > 0) {
    fontSize = Math.max(7, Math.floor((fontSize * maxTextBufW) / textBufW));
    pctx.font = buildPixelFont(fontSize);
    textBufW = pctx.measureText(label).width;
  }

  const totalGroupBufW = logoBufSpace + textBufW;
  const groupStartBufX = Math.max(2, Math.round((bufW - totalGroupBufW) / 2));
  const centerY = destY + destH / 2 + yOffset;

  // Transparent Stadium Logo on the left (no backdrop colors needed!)
  dctx.save();
  dctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  dctx.shadowBlur = 4;
  drawTransparentStadiumLogo(
    dctx,
    stadium,
    destX + (groupStartBufX + logoSize / (2 * pixelBlock)) * pixelBlock,
    centerY,
    logoSize
  );
  dctx.restore();

  // Draw ALL-CAPS Pixelated City Name into pixel buffer, then nearest-neighbor blit cleanly onto displayCanvas
  const textBufX = groupStartBufX + logoBufSpace + textBufW / 2;
  const textBufY = bufH / 2;
  pctx.textAlign = 'center';
  pctx.textBaseline = 'middle';
  pctx.lineJoin = 'miter';
  pctx.lineWidth = Math.max(1.8, fontSize * 0.2);

  let fillStyle: string | CanvasGradient = '#4ade80';
  let strokeColor = '#052e16';
  if ((isRoadTo38 || isFinale38) && mode === 'league') {
    const grad = pctx.createLinearGradient(textBufX - textBufW / 2, textBufY, textBufX + textBufW / 2, textBufY);
    RAINBOW_COLORS.forEach((col, idx) => {
      grad.addColorStop(idx / (RAINBOW_COLORS.length - 1), col);
    });
    fillStyle = grad;
    strokeColor = '#000000';
  } else if (isRivalry && mode === 'league') {
    fillStyle = '#ffff00';
    strokeColor = '#000000';
  } else if (mode === 'king_cup') {
    fillStyle = '#facc15';
    strokeColor = '#000000';
  } else if (mode === 'super_cup') {
    const grad = pctx.createLinearGradient(textBufX - textBufW / 2, textBufY, textBufX + textBufW / 2, textBufY);
    grad.addColorStop(0.0, '#ef4444');
    grad.addColorStop(0.24, '#ef4444');
    grad.addColorStop(0.26, '#facc15');
    grad.addColorStop(0.5, '#facc15');
    grad.addColorStop(0.52, '#ef4444');
    grad.addColorStop(0.75, '#ef4444');
    grad.addColorStop(0.77, '#facc15');
    grad.addColorStop(1.0, '#facc15');
    fillStyle = grad;
    strokeColor = '#000000';
  } else if (mode === 'anime_cup') {
    const grad = pctx.createLinearGradient(textBufX - textBufW / 2, textBufY, textBufX + textBufW / 2, textBufY);
    RAINBOW_COLORS.forEach((col, idx) => {
      grad.addColorStop(idx / (RAINBOW_COLORS.length - 1), col);
    });
    fillStyle = grad;
    strokeColor = '#000000';
  }

  pctx.strokeStyle = strokeColor;
  pctx.strokeText(label, textBufX, textBufY);
  pctx.fillStyle = fillStyle;
  pctx.fillText(label, textBufX, textBufY);

  const prevSmooth = dctx.imageSmoothingEnabled;
  dctx.imageSmoothingEnabled = false;
  dctx.drawImage(cityPixelBuffer, destX, destY + yOffset, destW, destH);
  dctx.imageSmoothingEnabled = prevSmooth;

  dctx.restore();
}

// Exclusive 1-per-pitch middle LED tunnel panel across all 4 modes (23.0s cycle)
export function drawLedTunnelPanel(
  targetCtx: CanvasRenderingContext2D,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  mode: CompetitionId,
  time: number,
  stadiumName: string,
  cupRoundLabel?: string,
  isRoadTo38 = false,
  isFinale38 = false
) {
  const buf = getLedTunnelBuffer(destW, destH);
  const bctx = buf.getContext('2d');
  if (!bctx) return;
  bctx.imageSmoothingEnabled = false;

  const variant =
    isFinale38 && mode === 'league'
      ? 'league_finale38_flicker'
      : isRoadTo38 && mode === 'league'
      ? 'league_road38_rainbow'
      : mode === 'league'
      ? 'red_league'
      : mode === 'king_cup'
      ? 'king_yellow'
      : mode === 'super_cup'
      ? 'super_red_yellow'
      : 'anime_rainbow';

  drawSunburntTunnelPixels(bctx, destW, destH, mode, time, variant);

  const { phase, progress } = getMiddleLedPhase(time);
  const baseY = Math.max(1, Math.floor((destH - 7) / 2));

  let primaryText = 'CAAYVG LEAGUE';
  let primaryColor: string | string[] = '#4ade80';
  let primaryShadow = '#052e16';
  let stadiumColor: string | string[] = '#4ade80';
  let stadiumShadow = '#052e16';

  if (isFinale38 && mode === 'league') {
    primaryText = 'THE GRAND FINALE 38!';
    const shift = Math.floor(time * 18);
    primaryColor = ALL_SPECTRUM_COLORS.map(
      (_, i) => ALL_SPECTRUM_COLORS[(i + shift) % ALL_SPECTRUM_COLORS.length]
    );
    primaryShadow = '#000000';
    stadiumColor = RAINBOW_COLORS;
    stadiumShadow = '#000000';
  } else if (isRoadTo38 && mode === 'league') {
    primaryText = 'ROAD TO THE ROUND 38!';
    primaryColor = RAINBOW_COLORS;
    primaryShadow = '#000000';
    stadiumColor = RAINBOW_COLORS;
    stadiumShadow = '#000000';
  } else if (mode === 'king_cup') {
    primaryText = cupRoundLabel || 'GRAND FINALE';
    const flickerRed = Math.floor(time * 12) % 2 === 0;
    primaryColor = flickerRed ? '#ef4444' : '#facc15';
    primaryShadow = '#000000';
    stadiumColor = '#facc15';
    stadiumShadow = '#000000';
  } else if (mode === 'super_cup') {
    primaryText = 'CAAYVG SUPER CUP FINAL';
    primaryColor = ['#facc15', '#ef4444'];
    primaryShadow = '#000000';
    stadiumColor = ['#facc15', '#ef4444'];
    stadiumShadow = '#000000';
  } else if (mode === 'anime_cup') {
    primaryText = cupRoundLabel || 'GRAND FINALE';
    primaryColor = RAINBOW_COLORS;
    primaryShadow = '#000000';
    stadiumColor = RAINBOW_COLORS;
    stadiumShadow = '#000000';
  }

  const stadiumLabel = stadiumName
    .normalize('NFC')
    .toUpperCase()
    .replace(/[^A-ZÁÃÉ0-9 .:-]/g, ' ');

  const maxPixelW = destW - 6;
  if (phase === 'primary_hold') {
    drawPixelText(bctx, primaryText, destW / 2, baseY, 1, primaryColor, primaryShadow, undefined, maxPixelW);
  } else if (phase === 'primary_fly_up') {
    const yOff = -Math.round(progress * (destH + 2));
    drawPixelText(bctx, primaryText, destW / 2, baseY + yOff, 1, primaryColor, primaryShadow, undefined, maxPixelW);
  } else if (phase === 'logo_fly_up_1') {
    // High-res unpixelated zoomed-in competition logo is drawn on displayCanvas overlay
  } else if (phase === 'stadium_fly_down') {
    const yUp = Math.round((1 - progress) * (destH + 2));
    drawPixelText(bctx, stadiumLabel, destW / 2, baseY + yUp, 1, stadiumColor, stadiumShadow, undefined, maxPixelW);
  } else if (phase === 'stadium_hold') {
    drawPixelText(bctx, stadiumLabel, destW / 2, baseY, 1, stadiumColor, stadiumShadow, undefined, maxPixelW);
  } else if (phase === 'city_fly_up') {
    // Stadium name flies straight upward out in 0.5s while high-DPI City + Stadium Logo enters upward
    const yOut = -Math.round(progress * (destH + 2));
    drawPixelText(bctx, stadiumLabel, destW / 2, baseY + yOut, 1, stadiumColor, stadiumShadow, undefined, maxPixelW);
  } else if (phase === 'city_hold' || phase === 'logo_fly_up_2') {
    // Big ALL-CAPS Pixelated City + Transparent Stadium Logo and 0.7s straight-up Competition Logo render on displayCanvas overlay
  } else {
    // Primary label comes back upward from bottom into rest position in 1.0s
    const yReturnUp = Math.round((1 - progress) * (destH + 2));
    drawPixelText(bctx, primaryText, destW / 2, baseY + yReturnUp, 1, primaryColor, primaryShadow, undefined, maxPixelW);
  }

  targetCtx.drawImage(buf, destX, destY);
}

// Clásico Rivalry middle LED panel backdrop (deep space + falling twinkling stars; planets & text layered in high-DPI pass)
export function drawRivalrySpaceMiddlePanel(
  targetCtx: CanvasRenderingContext2D,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  time: number
) {
  const buf = getLedTunnelBuffer(destW, destH);
  const bctx = buf.getContext('2d');
  if (!bctx) return;
  bctx.imageSmoothingEnabled = false;

  bctx.fillStyle = '#02020b';
  bctx.fillRect(0, 0, destW, destH);
  for (let i = 0; i < 28; i++) {
    const sx = (i * 29 + Math.floor(time * 8)) % destW;
    const sy = ((i * 5 + Math.floor(time * 14)) % destH);
    const tw = Math.sin(time * 7 + i);
    if (tw > -0.25) {
      bctx.fillStyle = tw > 0.5 ? '#ffffff' : '#94a3b8';
      bctx.fillRect(sx, sy, 1, 1);
    }
  }

  targetCtx.drawImage(buf, destX, destY);
}

// Clásico middle LED text pass (23.0s timeline)
export function drawRivalrySpaceMiddleText(
  ctx: CanvasRenderingContext2D,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  time: number,
  stadiumName: string,
  rivalryTitle: string,
  textColor = '#ffff00'
) {
  const { phase, progress } = getMiddleLedPhase(time);
  const baseY = Math.max(1, Math.floor((destH - 7) / 2));
  const primaryText = (rivalryTitle || 'THE CLÁSICO')
    .normalize('NFC')
    .toUpperCase()
    .replace(/[^A-ZÁÃÉ0-9 .:-]/g, ' ');
  const stadiumLabel = stadiumName
    .normalize('NFC')
    .toUpperCase()
    .replace(/[^A-ZÁÃÉ0-9 .:-]/g, ' ');
  const maxPixelW = destW - 6;

  ctx.save();
  ctx.beginPath();
  ctx.rect(destX, destY, destW, destH);
  ctx.clip();

  if (phase === 'primary_hold') {
    drawPixelText(ctx, primaryText, destX + destW / 2, destY + baseY, 1, textColor, '#000000', undefined, maxPixelW);
  } else if (phase === 'primary_fly_up') {
    const yOff = -Math.round(progress * (destH + 2));
    drawPixelText(ctx, primaryText, destX + destW / 2, destY + baseY + yOff, 1, textColor, '#000000', undefined, maxPixelW);
  } else if (phase === 'logo_fly_up_1') {
    // High-res unpixelated zoomed-in Yellow League logo drawn on displayCanvas overlay
  } else if (phase === 'stadium_fly_down') {
    const yUp = Math.round((1 - progress) * (destH + 2));
    drawPixelText(ctx, stadiumLabel, destX + destW / 2, destY + baseY + yUp, 1, textColor, '#000000', undefined, maxPixelW);
  } else if (phase === 'stadium_hold') {
    drawPixelText(ctx, stadiumLabel, destX + destW / 2, destY + baseY, 1, textColor, '#000000', undefined, maxPixelW);
  } else if (phase === 'city_fly_up') {
    const yOut = -Math.round(progress * (destH + 2));
    drawPixelText(ctx, stadiumLabel, destX + destW / 2, destY + baseY + yOut, 1, textColor, '#000000', undefined, maxPixelW);
  } else if (phase === 'city_hold' || phase === 'logo_fly_up_2') {
    // Big ALL-CAPS Yellow Pixelated City + Transparent Stadium Logo and 0.7s straight-up Competition Logo render on displayCanvas overlay
  } else {
    const yReturnUp = Math.round((1 - progress) * (destH + 2));
    drawPixelText(ctx, primaryText, destX + destW / 2, destY + baseY + yReturnUp, 1, textColor, '#000000', undefined, maxPixelW);
  }

  ctx.restore();
}

// Extra Perimeter LED Layer across all 4 modes:
// League: dark blue & red sunburnt tunnel (or space + rainbow sunburnt tunnel for Rounds 30-38!) | King Cup: black & yellow + tournament round | Super Cup: red & yellow | Anime Cup: rainbow
export function drawExtraLedLayerTunnel(
  targetCtx: CanvasRenderingContext2D,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  mode: CompetitionId,
  time: number,
  cupRoundLabel?: string,
  showTournamentRound?: boolean,
  isRoadTo38 = false,
  isFinale38 = false
) {
  const buf = getExtraLedTunnelBuffer(destW, destH);
  const bctx = buf.getContext('2d');
  if (!bctx) return;
  bctx.imageSmoothingEnabled = false;

  const variant =
    isFinale38 && mode === 'league'
      ? 'league_finale38_flicker'
      : isRoadTo38 && mode === 'league'
      ? 'league_road38_rainbow'
      : mode === 'league'
      ? 'red_league'
      : mode === 'king_cup'
      ? 'king_yellow'
      : mode === 'super_cup'
      ? 'super_red_yellow'
      : 'anime_rainbow';

  drawSunburntTunnelPixels(bctx, destW, destH, mode, time, variant);

  if (showTournamentRound && destH >= 9) {
    if (isFinale38 && mode === 'league') {
      const baseY = Math.max(1, Math.floor((destH - 7) / 2));
      const shift = Math.floor(time * 18);
      const flickCols = ALL_SPECTRUM_COLORS.map(
        (_, i) => ALL_SPECTRUM_COLORS[(i + shift) % ALL_SPECTRUM_COLORS.length]
      );
      drawPixelText(
        bctx,
        'THE GRAND FINALE 38!',
        destW / 2,
        baseY,
        1,
        flickCols,
        '#000000',
        'rgba(2, 3, 14, 0.85)'
      );
    } else if (isRoadTo38 && mode === 'league') {
      const baseY = Math.max(1, Math.floor((destH - 7) / 2));
      drawPixelText(
        bctx,
        'ROAD TO THE ROUND 38!',
        destW / 2,
        baseY,
        1,
        RAINBOW_COLORS,
        '#000000',
        'rgba(2, 3, 14, 0.78)'
      );
    } else if (mode === 'king_cup' || mode === 'anime_cup') {
      const roundText = cupRoundLabel || 'GRAND FINALE';
      const baseY = Math.max(1, Math.floor((destH - 7) / 2));
      if (mode === 'king_cup') {
        const flickerRed = Math.floor(time * 12) % 2 === 0;
        drawPixelText(
          bctx,
          roundText,
          destW / 2,
          baseY,
          1,
          flickerRed ? '#ef4444' : '#facc15',
          '#000000',
          'rgba(0, 0, 0, 0.72)'
        );
      } else {
        drawPixelText(
          bctx,
          roundText,
          destW / 2,
          baseY,
          1,
          RAINBOW_COLORS,
          '#000000',
          'rgba(0, 0, 0, 0.72)'
        );
      }
    }
  }

  targetCtx.drawImage(buf, destX, destY);
}

// High-DPI rotating 3D-shaded Championship Trophy graphic (used inside Trophy Celebration LEDs and center pitch)
export function drawHighResTrophyGraphic(
  dctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotAngle: number
) {
  const spinScale = Math.cos(rotAngle);
  const absScale = Math.max(0.28, Math.abs(spinScale));
  const shimmer = (Math.sin(rotAngle * 2) + 1) * 0.5;

  dctx.save();
  dctx.translate(cx, cy);
  dctx.scale(absScale, 1);

  const r = size * 0.48;
  dctx.lineJoin = 'round';
  dctx.lineCap = 'round';

  // Pedestal base
  dctx.fillStyle = '#78350f';
  dctx.strokeStyle = '#020617';
  dctx.lineWidth = Math.max(1.5, size * 0.06);
  dctx.beginPath();
  dctx.roundRect(-r * 0.62, r * 0.62, r * 1.24, r * 0.34, r * 0.08);
  dctx.fill();
  dctx.stroke();

  // Stem & collar
  const stemGrad = dctx.createLinearGradient(-r * 0.25, 0, r * 0.25, 0);
  stemGrad.addColorStop(0, '#b45309');
  stemGrad.addColorStop(0.5, '#fef08a');
  stemGrad.addColorStop(1, '#ca8a04');
  dctx.fillStyle = stemGrad;
  dctx.beginPath();
  dctx.moveTo(-r * 0.22, r * 0.62);
  dctx.lineTo(-r * 0.14, r * 0.18);
  dctx.lineTo(r * 0.14, r * 0.18);
  dctx.lineTo(r * 0.22, r * 0.62);
  dctx.closePath();
  dctx.fill();
  dctx.stroke();

  // Side trophy handles
  dctx.strokeStyle = '#facc15';
  dctx.lineWidth = Math.max(1.8, size * 0.09);
  dctx.beginPath();
  dctx.arc(-r * 0.65, -r * 0.34, r * 0.32, Math.PI * 0.45, Math.PI * 1.55);
  dctx.stroke();
  dctx.beginPath();
  dctx.arc(r * 0.65, -r * 0.34, r * 0.32, -Math.PI * 0.55, Math.PI * 0.55);
  dctx.stroke();

  // Main golden cup bowl
  const cupGrad = dctx.createLinearGradient(-r * 0.72, -r * 0.85, r * 0.72, r * 0.22);
  cupGrad.addColorStop(0, '#b45309');
  cupGrad.addColorStop(0.32 + shimmer * 0.18, '#fef08a');
  cupGrad.addColorStop(0.62, '#facc15');
  cupGrad.addColorStop(1, '#92400e');

  dctx.fillStyle = cupGrad;
  dctx.strokeStyle = '#020617';
  dctx.lineWidth = Math.max(1.5, size * 0.06);
  dctx.beginPath();
  dctx.moveTo(-r * 0.68, -r * 0.78);
  dctx.lineTo(r * 0.68, -r * 0.78);
  dctx.quadraticCurveTo(r * 0.62, r * 0.05, r * 0.16, r * 0.22);
  dctx.lineTo(-r * 0.16, r * 0.22);
  dctx.quadraticCurveTo(-r * 0.62, r * 0.05, -r * 0.68, -r * 0.78);
  dctx.closePath();
  dctx.fill();
  dctx.stroke();

  // Rim highlight
  dctx.fillStyle = '#fef9c3';
  dctx.fillRect(-r * 0.64, -r * 0.86, r * 1.28, r * 0.14);

  dctx.restore();
}

// High-DPI realistic 3D-shaded metallic club crest shield rendered inside pitch-side LED boards
export function drawHighResClubCrest(
  dctx: CanvasRenderingContext2D,
  team: { primaryColor: string; secondaryColor: string; trimColor: string; crest?: string },
  cx: number,
  cy: number,
  size: number
) {
  const r = size * 0.46;
  const traceShield = (scale = 1) => {
    dctx.beginPath();
    dctx.moveTo(0, -r * 0.94 * scale);
    dctx.lineTo(r * 0.88 * scale, -r * 0.72 * scale);
    dctx.lineTo(r * 0.88 * scale, r * 0.08 * scale);
    dctx.quadraticCurveTo(r * 0.74 * scale, r * 0.76 * scale, 0, r * 1.0 * scale);
    dctx.quadraticCurveTo(-r * 0.74 * scale, r * 0.76 * scale, -r * 0.88 * scale, r * 0.08 * scale);
    dctx.lineTo(-r * 0.88 * scale, -r * 0.72 * scale);
    dctx.closePath();
  };

  dctx.save();
  dctx.translate(cx, cy);
  dctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  dctx.shadowBlur = Math.max(2, size * 0.12);

  // Outer metallic rim bevel
  const trimGrad = dctx.createLinearGradient(-r, -r, r, r);
  trimGrad.addColorStop(0, '#ffffff');
  trimGrad.addColorStop(0.35, team.trimColor || '#facc15');
  trimGrad.addColorStop(0.75, team.trimColor || '#d97706');
  trimGrad.addColorStop(1, '#1e293b');
  traceShield(1.0);
  dctx.fillStyle = trimGrad;
  dctx.fill();
  dctx.strokeStyle = '#020617';
  dctx.lineWidth = Math.max(1.2, size * 0.055);
  dctx.stroke();

  // Inner shield gradient fill + club motif
  dctx.shadowBlur = 0;
  dctx.save();
  traceShield(0.84);
  dctx.clip();

  const bodyGrad = dctx.createLinearGradient(0, -r, 0, r);
  bodyGrad.addColorStop(0, team.primaryColor);
  bodyGrad.addColorStop(0.55, team.primaryColor);
  bodyGrad.addColorStop(1, team.secondaryColor);
  dctx.fillStyle = bodyGrad;
  dctx.fillRect(-r, -r, r * 2, r * 2);

  const crest = team.crest ?? 'shield';
  dctx.fillStyle = team.secondaryColor;
  if (crest === 'stripes') {
    dctx.fillRect(-r * 0.34, -r, r * 0.24, r * 2);
    dctx.fillRect(r * 0.1, -r, r * 0.24, r * 2);
  } else if (crest === 'shield') {
    dctx.fillRect(0, -r, r, r * 2);
  } else if (crest === 'diamond') {
    dctx.beginPath();
    dctx.moveTo(0, -r * 0.56);
    dctx.lineTo(r * 0.48, 0);
    dctx.lineTo(0, r * 0.56);
    dctx.lineTo(-r * 0.48, 0);
    dctx.closePath();
    dctx.fill();
  }

  // Central trim emblem highlight (star / crown / bolt / core)
  dctx.fillStyle = team.trimColor || '#facc15';
  if (crest === 'crown') {
    dctx.beginPath();
    dctx.moveTo(-r * 0.45, r * 0.2);
    dctx.lineTo(-r * 0.45, -r * 0.22);
    dctx.lineTo(-r * 0.18, r * 0.02);
    dctx.lineTo(0, -r * 0.35);
    dctx.lineTo(r * 0.18, r * 0.02);
    dctx.lineTo(r * 0.45, -r * 0.22);
    dctx.lineTo(r * 0.45, r * 0.2);
    dctx.closePath();
    dctx.fill();
  } else if (crest === 'bolt') {
    dctx.beginPath();
    dctx.moveTo(r * 0.08, -r * 0.48);
    dctx.lineTo(-r * 0.28, r * 0.05);
    dctx.lineTo(0, r * 0.05);
    dctx.lineTo(-r * 0.12, r * 0.48);
    dctx.lineTo(r * 0.28, -r * 0.05);
    dctx.lineTo(0, -r * 0.05);
    dctx.closePath();
    dctx.fill();
  } else {
    dctx.beginPath();
    dctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
    dctx.fill();
  }

  // Glossy glass sheen across top half of realistic crest
  const gloss = dctx.createLinearGradient(0, -r, 0, r * 0.15);
  gloss.addColorStop(0, 'rgba(255, 255, 255, 0.48)');
  gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
  dctx.fillStyle = gloss;
  dctx.beginPath();
  dctx.ellipse(0, -r * 0.42, r * 0.9, r * 0.52, 0, 0, Math.PI * 2);
  dctx.fill();
  dctx.restore();

  traceShield(0.84);
  dctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  dctx.lineWidth = Math.max(0.8, size * 0.03);
  dctx.stroke();

  dctx.restore();
}

