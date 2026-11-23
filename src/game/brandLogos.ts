export type BrandLogoId =
  | 'jordan'
  | 'nike'
  | 'adidas'
  | 'puma'
  | 'reebok'
  | 'under_armour'
  | 'vans'
  | 'new_balance'
  | 'asics'
  | 'columbia'
  | 'converse'
  | 'kinza'
  | 'code_red'
  | 'coca_cola'
  | 'seven_up';

export const BRAND_LOGO_SHEET_URL =
  '/assets/aistudio/360_F_591801767_EXrW9PH5jT93Yo8XlStk7nYwEFKA47PW_514776c0.jpg';
export const KINZA_LOGO_URL = '/assets/aistudio/images__199999__c9d0a130.png';
export const CODE_RED_LOGO_URL = '/assets/aistudio/images__212121__ba418c6a.jpeg';

const ROW1_IDS: BrandLogoId[] = ['jordan', 'nike', 'adidas', 'puma', 'reebok'];
const ROW2_IDS: BrandLogoId[] = [
  'under_armour',
  'vans',
  'new_balance',
  'asics',
  'columbia',
  'converse',
];

export interface CachedBrandSprite {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const spriteCache = new Map<BrandLogoId, CachedBrandSprite>();
let loadStarted = false;

function extractRowBoxes(
  data: Uint8ClampedArray,
  imgW: number,
  yStart: number,
  yEnd: number,
  expectedCount: number,
  mergeGapPx: number
): Array<{ x: number; y: number; w: number; h: number }> {
  const colHasInk = new Array<boolean>(imgW).fill(false);
  for (let x = 0; x < imgW; x++) {
    for (let y = yStart; y < yEnd; y++) {
      const idx = (y * imgW + x) * 4;
      const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (lum < 210) {
        colHasInk[x] = true;
        break;
      }
    }
  }

  const rawSegs: Array<[number, number]> = [];
  let inSeg = false;
  let segStart = 0;
  for (let x = 0; x < imgW; x++) {
    if (colHasInk[x] && !inSeg) {
      inSeg = true;
      segStart = x;
    } else if (!colHasInk[x] && inSeg) {
      inSeg = false;
      rawSegs.push([segStart, x]);
    }
  }
  if (inSeg) rawSegs.push([segStart, imgW]);

  const merged: Array<[number, number]> = [];
  for (const [a, b] of rawSegs) {
    if (merged.length > 0 && a - merged[merged.length - 1][1] <= mergeGapPx) {
      merged[merged.length - 1][1] = b;
    } else {
      merged.push([a, b]);
    }
  }

  // Fallback to even slices if detection count differs unexpectedly
  const finalSegs =
    merged.length === expectedCount
      ? merged
      : Array.from({ length: expectedCount }, (_, i) => [
          Math.floor((i * imgW) / expectedCount) + 6,
          Math.floor(((i + 1) * imgW) / expectedCount) - 6,
        ] as [number, number]);

  return finalSegs.map(([x0, x1]) => {
    let minY = yEnd;
    let maxY = yStart;
    for (let y = yStart; y < yEnd; y++) {
      for (let x = x0; x < x1; x++) {
        const idx = (y * imgW + x) * 4;
        const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        if (lum < 210) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          break;
        }
      }
    }
    if (maxY < minY) {
      minY = yStart + 6;
      maxY = yEnd - 6;
    }
    const padX0 = Math.max(0, x0 - 3);
    const padY0 = Math.max(yStart, minY - 3);
    const padX1 = Math.min(imgW, x1 + 3);
    const padY1 = Math.min(yEnd - 1, maxY + 3);
    return {
      x: padX0,
      y: padY0,
      w: Math.max(1, padX1 - padX0),
      h: Math.max(1, padY1 - padY0 + 1),
    };
  });
}

function buildSpritesFromImage(img: HTMLImageElement) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w;
  srcCanvas.height = h;
  const sctx = srcCanvas.getContext('2d');
  if (!sctx) return;
  sctx.drawImage(img, 0, 0);

  const imgData = sctx.getImageData(0, 0, w, h);
  const splitY = Math.floor(h * 0.49);

  const row1Boxes = extractRowBoxes(imgData.data, w, 0, splitY, ROW1_IDS.length, 30);
  const row2Boxes = extractRowBoxes(imgData.data, w, splitY, h, ROW2_IDS.length, 24);

  const pairs: Array<{ id: BrandLogoId; box: { x: number; y: number; w: number; h: number } }> = [
    ...ROW1_IDS.map((id, i) => ({ id, box: row1Boxes[i] })),
    ...ROW2_IDS.map((id, i) => ({ id, box: row2Boxes[i] })),
  ];

  // High-resolution smooth antialiased transparent sprites (real & realistic, zero white rectangle)
  const targetH = 72;
  for (const { id, box } of pairs) {
    const aspect = box.w / box.h;
    const drawW = Math.max(48, Math.min(240, Math.round(targetH * aspect)));
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = drawW;
    spriteCanvas.height = targetH;
    const bctx = spriteCanvas.getContext('2d');
    if (!bctx) continue;

    bctx.imageSmoothingEnabled = true;
    bctx.imageSmoothingQuality = 'high';
    bctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, drawW, targetH);

    // Smoothly key out the white background and render crisp bright stadium-LED white logo
    const badgeData = bctx.getImageData(0, 0, drawW, targetH);
    const px = badgeData.data;
    for (let i = 0; i < px.length; i += 4) {
      const lum = (px[i] + px[i + 1] + px[i + 2]) / 3;
      const alpha = Math.max(0, Math.min(255, Math.round((232 - lum) * 3.2)));
      px[i] = 255;
      px[i + 1] = 255;
      px[i + 2] = 255;
      px[i + 3] = alpha;
    }
    bctx.putImageData(badgeData, 0, 0);

    spriteCache.set(id, { canvas: spriteCanvas, width: drawW, height: targetH });
  }
}

function buildKinzaSprite(img: HTMLImageElement) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w;
  srcCanvas.height = h;
  const sctx = srcCanvas.getContext('2d');
  if (!sctx) return;
  sctx.drawImage(img, 0, 0);

  const rawData = sctx.getImageData(0, 0, w, h);
  const px = rawData.data;
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
      const dist = Math.hypot(px[idx] - bgR, px[idx + 1] - bgG, px[idx + 2] - bgB);
      if (dist > 34) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      // Smoothly remove solid blue backdrop while preserving realistic white/cyan Kinza artwork
      const alpha = Math.max(0, Math.min(255, Math.round((dist - 22) * 7.5)));
      px[idx + 3] = Math.min(px[idx + 3], alpha);
    }
  }
  sctx.putImageData(rawData, 0, 0);

  if (maxX <= minX || maxY <= minY) {
    minX = 0;
    minY = 0;
    maxX = w - 1;
    maxY = h - 1;
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const targetH = 72;
  const aspect = cropW / cropH;
  const drawW = Math.max(54, Math.min(180, Math.round(targetH * aspect)));
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = drawW;
  spriteCanvas.height = targetH;
  const bctx = spriteCanvas.getContext('2d');
  if (!bctx) return;

  bctx.imageSmoothingEnabled = true;
  bctx.imageSmoothingQuality = 'high';
  bctx.drawImage(srcCanvas, minX, minY, cropW, cropH, 0, 0, drawW, targetH);

  spriteCache.set('kinza', { canvas: spriteCanvas, width: drawW, height: targetH });
}

function buildCodeRedSprite(img: HTMLImageElement) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w;
  srcCanvas.height = h;
  const sctx = srcCanvas.getContext('2d');
  if (!sctx) return;
  sctx.drawImage(img, 0, 0);

  const rawData = sctx.getImageData(0, 0, w, h);
  const px = rawData.data;
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
      const dist = Math.hypot(px[idx] - bgR, px[idx + 1] - bgG, px[idx + 2] - bgB);
      if (dist > 45) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const alpha = Math.max(0, Math.min(255, Math.round((dist - 28) * 6.5)));
      px[idx + 3] = Math.min(px[idx + 3], alpha);
    }
  }
  sctx.putImageData(rawData, 0, 0);

  if (maxX <= minX || maxY <= minY) {
    minX = 0;
    minY = 0;
    maxX = w - 1;
    maxY = h - 1;
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const targetH = 72;
  const aspect = cropW / cropH;
  const drawW = Math.max(54, Math.min(180, Math.round(targetH * aspect)));
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = drawW;
  spriteCanvas.height = targetH;
  const bctx = spriteCanvas.getContext('2d');
  if (!bctx) return;

  bctx.imageSmoothingEnabled = true;
  bctx.imageSmoothingQuality = 'high';
  bctx.drawImage(srcCanvas, minX, minY, cropW, cropH, 0, 0, drawW, targetH);

  spriteCache.set('code_red', { canvas: spriteCanvas, width: drawW, height: targetH });
}

function buildCocaColaAndSevenUpSprites() {
  if (typeof document === 'undefined') return;

  // Authentic Coca-Cola red disc + flowing white wave + italic Spencerian wordmark
  const ccW = 210;
  const ccH = 72;
  const ccCanvas = document.createElement('canvas');
  ccCanvas.width = ccW;
  ccCanvas.height = ccH;
  const cctx = ccCanvas.getContext('2d');
  if (cctx) {
    cctx.fillStyle = '#dc2626';
    cctx.beginPath();
    cctx.arc(36, 36, 29, 0, Math.PI * 2);
    cctx.fill();
    cctx.lineWidth = 2.5;
    cctx.strokeStyle = '#ffffff';
    cctx.stroke();

    cctx.strokeStyle = 'rgba(255,255,255,0.94)';
    cctx.lineWidth = 3.5;
    cctx.beginPath();
    cctx.moveTo(12, 46);
    cctx.bezierCurveTo(26, 36, 46, 52, 60, 42);
    cctx.stroke();

    cctx.font = 'italic 900 28px Georgia, "Times New Roman", serif';
    cctx.textAlign = 'left';
    cctx.textBaseline = 'middle';
    cctx.lineWidth = 4;
    cctx.strokeStyle = '#991b1b';
    cctx.strokeText('Coca-Cola', 72, 36);
    cctx.fillStyle = '#ffffff';
    cctx.fillText('Coca-Cola', 72, 36);

    cctx.strokeStyle = 'rgba(255,255,255,0.9)';
    cctx.lineWidth = 2.5;
    cctx.beginPath();
    cctx.moveTo(74, 54);
    cctx.bezierCurveTo(116, 46, 158, 60, 200, 50);
    cctx.stroke();

    spriteCache.set('coca_cola', { canvas: ccCanvas, width: ccW, height: ccH });
  }

  // Authentic 7Up emerald emblem + bold 7 + iconic crimson bubble + UP
  const suW = 164;
  const suH = 72;
  const suCanvas = document.createElement('canvas');
  suCanvas.width = suW;
  suCanvas.height = suH;
  const uctx = suCanvas.getContext('2d');
  if (uctx) {
    uctx.fillStyle = '#15803d';
    uctx.beginPath();
    uctx.arc(38, 36, 29, 0, Math.PI * 2);
    uctx.fill();
    uctx.lineWidth = 2.5;
    uctx.strokeStyle = '#bef264';
    uctx.stroke();

    uctx.fillStyle = '#ef4444';
    uctx.beginPath();
    uctx.arc(58, 36, 11, 0, Math.PI * 2);
    uctx.fill();
    uctx.lineWidth = 2;
    uctx.strokeStyle = '#ffffff';
    uctx.stroke();

    uctx.font = '900 42px "Impact", "Arial Black", sans-serif';
    uctx.textAlign = 'left';
    uctx.textBaseline = 'middle';
    uctx.lineWidth = 3.5;
    uctx.strokeStyle = '#052e16';
    uctx.strokeText('7', 19, 39);
    uctx.fillStyle = '#ffffff';
    uctx.fillText('7', 19, 39);

    uctx.font = '900 34px "Impact", "Arial Black", sans-serif';
    uctx.strokeText('UP', 76, 38);
    uctx.fillStyle = '#bef264';
    uctx.fillText('UP', 76, 38);
    spriteCache.set('seven_up', { canvas: suCanvas, width: suW, height: suH });
  }
}

export const REAL_BRAND_LOGO_REGISTRY: ReadonlySet<string> = new Set([
  'NIKE',
  'ADIDAS',
  'CODE RED',
  'KINZA',
  'PUMA',
  'JORDAN',
  'REEBOK',
  'UNDER ARMOUR',
  'VANS',
  'NEW BALANCE',
  'ASICS',
  'COLUMBIA',
  'CONVERSE',
  'PEPSI MAX',
  'COCA-COLA',
  'SPRITE',
  'FANTA',
  'MTN DEW',
  '7UP',
  'PRIME',
  'GATORADE',
  'POWERADE',
  'RED BULL',
  'MONSTER',
  'DORITOS',
  'LAYS',
  'PRINGLES',
  'SNICKERS',
  'RAZER',
  'NINTENDO',
  'ARAMCO',
  'STC',
  'SAUDIA',
  'RIYADH AIR',
  'ALMARAI',
  'SUNTOP',
  'VISIT SAUDI',
  'ROSHN',
  'SNACK ATTACK',
  'TURBO KICK',
  'UMBRO',
  'KAPPA',
  'MIZUNO',
  'PLAYSTATION',
  'MASTERCARD',
  'JOMA SPORT',
  'LOTTO',
  'QATAR AIRWAYS',
  'HUBLOT',
  'EA SPORTS',
  'SUPER ENERGY',
  'TROPHY GOLD',
  'APEX CLEATS',
  'CROWN COLA',
  'TURBO MINT',
  'CRYO DRINK',
  'ANIME BENTO',
  'RAMEN X',
  'MOCHI POP',
  'KAWAII SODA',
  'STARLIGHT TEA',
  'CYBER RAMUNE',
  'OTAKU GEAR',
  'NEKO COLA',
  'GALAXY BOBA',
  'TOTY 26',
  'TOTY ICONS',
  'TOTS CHAMPIONS',
  'FUTTIES PINK',
  'FUTTIES ICONS',
  'FUT DRAFT PRO',
  'DIV RIVALS',
  'PACK STORE',
  'UT CHAMPIONS',
  'SBC ELITE',
  'COIN BOOST',
  'ULTIMATE XI',
]);

export function hasRealBrandLogo(brandName: string): boolean {
  return REAL_BRAND_LOGO_REGISTRY.has(brandName.trim().toUpperCase());
}

const namedBrandSpriteCache = new Map<string, CachedBrandSprite>();

function makeBrandSprite(
  width: number,
  height: number,
  painter: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): CachedBrandSprite | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  painter(ctx, width, height);
  return { canvas: c, width, height };
}

function buildNamedRealBrandSprites() {
  if (typeof document === 'undefined' || namedBrandSpriteCache.size > 0) return;

  const drawWordmark = (
    ctx: CanvasRenderingContext2D,
    label: string,
    x: number,
    y: number,
    fontSpec: string,
    fill: string,
    stroke = '#020617',
    maxW = 152
  ) => {
    ctx.font = fontSpec;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = stroke;
    ctx.strokeText(label, x, y, maxW);
    ctx.fillStyle = fill;
    ctx.fillText(label, x, y, maxW);
  };

  const entries: Array<[string, CachedBrandSprite | null]> = [
    [
      'NIKE',
      makeBrandSprite(200, 72, (ctx) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(22, 22);
        ctx.bezierCurveTo(10, 42, 22, 56, 46, 46);
        ctx.lineTo(104, 18);
        ctx.lineTo(44, 34);
        ctx.bezierCurveTo(28, 38, 22, 32, 22, 22);
        ctx.closePath();
        ctx.fill();
        drawWordmark(ctx, 'NIKE', 108, 37, 'italic 900 34px "Impact", "Arial Black", sans-serif', '#ffffff', '#020617', 86);
      }),
    ],
    [
      'ADIDAS',
      makeBrandSprite(216, 72, (ctx) => {
        ctx.fillStyle = '#ffffff';
        const bars = [
          [16, 42, 12, 16],
          [32, 30, 12, 28],
          [48, 16, 12, 42],
        ];
        for (const [bx, by, bw, bh] of bars) {
          ctx.save();
          ctx.translate(bx + bw / 2, by + bh / 2);
          ctx.rotate(-0.42);
          ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
          ctx.restore();
        }
        drawWordmark(ctx, 'adidas', 74, 38, '900 34px "Arial Black", sans-serif', '#ffffff', '#020617', 136);
      }),
    ],
    [
      'PUMA',
      makeBrandSprite(206, 72, (ctx) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(14, 48);
        ctx.quadraticCurveTo(32, 28, 56, 20);
        ctx.lineTo(66, 14);
        ctx.lineTo(62, 26);
        ctx.quadraticCurveTo(44, 36, 24, 52);
        ctx.closePath();
        ctx.fill();
        drawWordmark(ctx, 'PUMA', 72, 39, '900 34px "Impact", "Arial Black", sans-serif', '#ffffff', '#020617', 126);
      }),
    ],
    [
      'JORDAN',
      makeBrandSprite(210, 72, (ctx) => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(36, 36, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(36, 19, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(22, 18);
        ctx.lineTo(36, 32);
        ctx.lineTo(48, 22);
        ctx.moveTo(36, 32);
        ctx.lineTo(24, 54);
        ctx.moveTo(36, 32);
        ctx.lineTo(48, 54);
        ctx.stroke();
        drawWordmark(ctx, 'JORDAN', 70, 37, '900 30px "Impact", "Arial Black", sans-serif', '#ffffff', '#020617', 132);
      }),
    ],
    [
      'REEBOK',
      makeBrandSprite(208, 72, (ctx) => {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(36, 12);
        ctx.lineTo(58, 56);
        ctx.lineTo(14, 56);
        ctx.closePath();
        ctx.stroke();
        drawWordmark(ctx, 'Reebok', 68, 37, 'italic 900 30px "Arial Black", sans-serif', '#ffffff', '#7f1d1d', 132);
      }),
    ],
    [
      'UNDER ARMOUR',
      makeBrandSprite(222, 72, (ctx) => {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(36, 24, 18, 0.15, Math.PI - 0.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(36, 48, 18, Math.PI + 0.15, Math.PI * 2 - 0.15);
        ctx.stroke();
        drawWordmark(ctx, 'UNDER ARMOUR', 66, 37, '900 24px "Impact", "Arial Black", sans-serif', '#ffffff', '#020617', 150);
      }),
    ],
    [
      'VANS',
      makeBrandSprite(196, 72, (ctx) => {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(10, 14, 176, 44);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 14, 176, 44);
        drawWordmark(ctx, 'VANS', 46, 37, '900 38px "Impact", "Arial Black", sans-serif', '#ffffff', '#020617', 124);
      }),
    ],
    [
      'NEW BALANCE',
      makeBrandSprite(220, 72, (ctx) => {
        ctx.fillStyle = '#dc2626';
        for (let r = 0; r < 3; r++) {
          ctx.fillRect(10, 22 + r * 10, 22 - r * 3, 5);
        }
        drawWordmark(ctx, 'NB', 34, 37, 'italic 900 36px "Impact", "Arial Black", sans-serif', '#ef4444', '#ffffff', 42);
        drawWordmark(ctx, 'NEW BALANCE', 80, 37, '900 24px "Impact", "Arial Black", sans-serif', '#ffffff', '#020617', 134);
      }),
    ],
    [
      'ASICS',
      makeBrandSprite(194, 72, (ctx) => {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(36, 36, 20, 0.4, Math.PI * 1.9);
        ctx.stroke();
        drawWordmark(ctx, 'asics', 68, 37, 'italic 900 34px "Arial Black", sans-serif', '#38bdf8', '#0f172a', 118);
      }),
    ],
    [
      'COLUMBIA',
      makeBrandSprite(214, 72, (ctx) => {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.strokeRect(18, 18, 22, 22);
        ctx.strokeRect(28, 28, 22, 22);
        drawWordmark(ctx, 'Columbia', 66, 37, '900 28px "Arial Black", sans-serif', '#ffffff', '#0c4a6e', 140);
      }),
    ],
    [
      'CONVERSE',
      makeBrandSprite(218, 72, (ctx) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const r = i % 2 === 0 ? 22 : 9;
          const px = 34 + Math.cos(a) * r;
          const py = 36 + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        drawWordmark(ctx, 'CONVERSE', 64, 37, '900 27px "Impact", "Arial Black", sans-serif', '#ffffff', '#020617', 148);
      }),
    ],
    [
      'KINZA',
      makeBrandSprite(200, 72, (ctx) => {
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.arc(36, 36, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(36, 36);
          ctx.lineTo(36 + Math.cos(a) * 18, 36 + Math.sin(a) * 18);
          ctx.stroke();
        }
        drawWordmark(ctx, 'kinza', 70, 37, '900 34px "Arial Black", sans-serif', '#ffffff', '#1e3a8a', 122);
      }),
    ],
    [
      'CODE RED',
      makeBrandSprite(216, 72, (ctx) => {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(14, 54);
        ctx.lineTo(36, 12);
        ctx.lineTo(58, 54);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(40, 18);
        ctx.lineTo(28, 38);
        ctx.lineTo(36, 38);
        ctx.lineTo(30, 52);
        ctx.lineTo(46, 33);
        ctx.lineTo(38, 33);
        ctx.closePath();
        ctx.fill();
        drawWordmark(ctx, 'CODE RED', 64, 37, 'italic 900 28px "Impact", "Arial Black", sans-serif', '#ef4444', '#ffffff', 144);
      }),
    ],
    [
      'PEPSI MAX',
      makeBrandSprite(226, 72, (ctx) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(36, 36, 27, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(8, 8, 56, 28);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(8, 36, 56, 28);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(6, 40);
        ctx.bezierCurveTo(24, 24, 48, 44, 66, 24);
        ctx.lineTo(66, 38);
        ctx.bezierCurveTo(46, 54, 24, 38, 6, 48);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(36, 36, 27, 0, Math.PI * 2);
        ctx.stroke();
        drawWordmark(ctx, 'PEPSI MAX', 72, 37, 'italic 900 28px "Impact", "Arial Black", sans-serif', '#ffffff', '#0a195c', 146);
      }),
    ],
    [
      'SPRITE',
      makeBrandSprite(196, 72, (ctx) => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2;
          const rad = i % 2 === 0 ? 28 : 14;
          const px = 36 + Math.cos(ang) * rad;
          const py = 36 + Math.sin(ang) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(36, 36, 14, 0, Math.PI * 2);
        ctx.fill();
        drawWordmark(ctx, 'SPRITE', 70, 37, 'italic 900 34px "Impact", "Arial Black", sans-serif', '#fef08a', '#052e16', 118);
      }),
    ],
    [
      'FANTA',
      makeBrandSprite(190, 72, (ctx) => {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(36, 38, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1d4ed8';
        ctx.stroke();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(42, 13, 12, 5, -0.35, 0, Math.PI * 2);
        ctx.fill();
        drawWordmark(ctx, 'FANTA', 70, 38, 'italic 900 34px "Impact", "Arial Black", sans-serif', '#ffffff', '#1e3a8a', 112);
      }),
    ],
    [
      'MTN DEW',
      makeBrandSprite(210, 72, (ctx) => {
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.moveTo(12, 52);
        ctx.lineTo(28, 14);
        ctx.lineTo(62, 20);
        ctx.lineTo(48, 58);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#dc2626';
        ctx.stroke();
        drawWordmark(ctx, 'MTN DEW', 70, 37, 'italic 900 30px "Impact", "Arial Black", sans-serif', '#bef264', '#052e16', 132);
      }),
    ],
    [
      'PRIME',
      makeBrandSprite(188, 72, (ctx) => {
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(14, 12, 18, 48);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(36, 12, 18, 48);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(14, 12, 40, 48);
        drawWordmark(ctx, 'PRIME', 66, 37, '900 34px "Impact", "Arial Black", sans-serif', '#ffffff', '#020617', 114);
      }),
    ],
    [
      'GATORADE',
      makeBrandSprite(226, 72, (ctx) => {
        ctx.font = '900 44px "Impact", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('G', 32, 38);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(40, 10);
        ctx.lineTo(25, 36);
        ctx.lineTo(35, 36);
        ctx.lineTo(28, 62);
        ctx.lineTo(48, 30);
        ctx.lineTo(38, 30);
        ctx.closePath();
        ctx.fill();
        drawWordmark(ctx, 'GATORADE', 60, 38, 'italic 900 28px "Impact", "Arial Black", sans-serif', '#fef08a', '#7c2d12', 156);
      }),
    ],
    [
      'POWERADE',
      makeBrandSprite(226, 72, (ctx) => {
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const x = 35 + Math.cos(a) * 26;
          const y = 36 + Math.sin(a) * 26;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(35, 36, 9, 0, Math.PI * 2);
        ctx.fill();
        drawWordmark(ctx, 'POWERADE', 68, 37, '900 28px "Impact", "Arial Black", sans-serif', '#38bdf8', '#020617', 150);
      }),
    ],
    [
      'RED BULL',
      makeBrandSprite(224, 72, (ctx) => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(40, 36, 17, 0, Math.PI * 2);
        ctx.fill();
        // Twin charging red bull silhouettes
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(10, 40);
        ctx.lineTo(26, 26);
        ctx.lineTo(38, 34);
        ctx.lineTo(26, 46);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(70, 40);
        ctx.lineTo(54, 26);
        ctx.lineTo(42, 34);
        ctx.lineTo(54, 46);
        ctx.closePath();
        ctx.fill();
        drawWordmark(ctx, 'Red Bull', 76, 37, '900 30px "Arial Black", sans-serif', '#ef4444', '#020617', 140);
      }),
    ],
    [
      'MONSTER',
      makeBrandSprite(214, 72, (ctx) => {
        ctx.fillStyle = '#4ade80';
        ctx.strokeStyle = '#a3e635';
        ctx.lineWidth = 1.5;
        for (const ox of [18, 32, 46]) {
          ctx.beginPath();
          ctx.moveTo(ox - 5, 10);
          ctx.lineTo(ox + 6, 14);
          ctx.lineTo(ox + 1, 60);
          ctx.lineTo(ox - 6, 54);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        drawWordmark(ctx, 'MONSTER', 64, 38, '900 28px "Impact", "Arial Black", sans-serif', '#4ade80', '#020617', 142);
      }),
    ],
    [
      'DORITOS',
      makeBrandSprite(210, 72, (ctx) => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(38, 9);
        ctx.lineTo(64, 59);
        ctx.lineTo(12, 53);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(38, 17);
        ctx.lineTo(54, 52);
        ctx.lineTo(20, 48);
        ctx.closePath();
        ctx.fill();
        drawWordmark(ctx, 'Doritos', 68, 38, 'italic 900 32px "Impact", "Arial Black", sans-serif', '#facc15', '#7f1d1d', 134);
      }),
    ],
    [
      'LAYS',
      makeBrandSprite(186, 72, (ctx) => {
        const g = ctx.createRadialGradient(34, 32, 4, 36, 36, 26);
        g.addColorStop(0, '#fef9c3');
        g.addColorStop(1, '#eab308');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(36, 36, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(10, 29, 52, 16);
        drawWordmark(ctx, "LAY'S", 70, 38, 'italic 900 34px "Impact", "Arial Black", sans-serif', '#ffffff', '#991b1b', 108);
      }),
    ],
    [
      'PRINGLES',
      makeBrandSprite(218, 72, (ctx) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(36, 35, 23, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Eyes
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(28, 28, 3, 0, Math.PI * 2);
        ctx.arc(44, 28, 3, 0, Math.PI * 2);
        ctx.fill();
        // Iconic brown mustache
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(26, 40, 11, 5, -0.15, 0, Math.PI * 2);
        ctx.ellipse(46, 40, 11, 5, 0.15, 0, Math.PI * 2);
        ctx.fill();
        // Red bowtie
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(26, 52);
        ctx.lineTo(36, 56);
        ctx.lineTo(26, 60);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(46, 52);
        ctx.lineTo(36, 56);
        ctx.lineTo(46, 60);
        ctx.closePath();
        ctx.fill();
        drawWordmark(ctx, 'PRINGLES', 66, 37, '900 28px "Impact", "Arial Black", sans-serif', '#ffffff', '#7f1d1d', 144);
      }),
    ],
    [
      'SNICKERS',
      makeBrandSprite(222, 72, (ctx) => {
        ctx.save();
        ctx.translate(36, 36);
        ctx.rotate(-0.18);
        ctx.fillStyle = '#3f2e21';
        ctx.fillRect(-26, -15, 52, 30);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 4;
        ctx.strokeRect(-26, -15, 52, 30);
        ctx.restore();
        drawWordmark(ctx, 'SNICKERS', 68, 37, '900 28px "Impact", "Arial Black", sans-serif', '#38bdf8', '#ffffff', 146);
      }),
    ],
    [
      'RAZER',
      makeBrandSprite(200, 72, (ctx) => {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(36, 36, 24, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
          ctx.beginPath();
          ctx.arc(36 + Math.cos(a) * 9, 36 + Math.sin(a) * 9, 8, a, a + Math.PI * 1.15);
          ctx.stroke();
        }
        drawWordmark(ctx, 'RAZER', 68, 37, '900 32px "Impact", "Arial Black", sans-serif', '#4ade80', '#052e16', 124);
      }),
    ],
    [
      'NINTENDO',
      makeBrandSprite(226, 72, (ctx) => {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(8, 12, 210, 48, 24);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.font = '900 32px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Nintendo', 113, 37);
      }),
    ],
    [
      'ARAMCO',
      makeBrandSprite(210, 72, (ctx) => {
        const g = ctx.createLinearGradient(12, 12, 60, 60);
        g.addColorStop(0, '#38bdf8');
        g.addColorStop(1, '#22c55e');
        ctx.fillStyle = g;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = i % 2 === 0 ? 27 : 13;
          const px = 36 + Math.cos(a) * r;
          const py = 36 + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(36, 36, 7, 0, Math.PI * 2);
        ctx.fill();
        drawWordmark(ctx, 'aramco', 68, 37, '900 30px "Arial Black", sans-serif', '#ffffff', '#064e3b', 134);
      }),
    ],
    [
      'STC',
      makeBrandSprite(164, 72, (ctx) => {
        ctx.fillStyle = '#7e22ce';
        ctx.beginPath();
        ctx.roundRect(10, 12, 54, 48, 12);
        ctx.fill();
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(48, 16, 10, 10);
        drawWordmark(ctx, 'stc', 21, 39, '900 28px "Arial Black", sans-serif', '#ffffff', '#3b0764', 44);
        drawWordmark(ctx, 'STC 5G', 72, 37, '900 28px "Impact", "Arial Black", sans-serif', '#ffffff', '#3b0764', 86);
      }),
    ],
    [
      'SAUDIA',
      makeBrandSprite(208, 72, (ctx) => {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(36, 36, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Palm & crossed swords motif
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(22, 48);
        ctx.lineTo(50, 26);
        ctx.moveTo(50, 48);
        ctx.lineTo(22, 26);
        ctx.moveTo(36, 48);
        ctx.lineTo(36, 18);
        ctx.stroke();
        drawWordmark(ctx, 'SAUDIA', 68, 37, '900 30px "Impact", "Arial Black", sans-serif', '#fde047', '#052e16', 132);
      }),
    ],
    [
      'RIYADH AIR',
      makeBrandSprite(230, 72, (ctx) => {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.moveTo(14, 54);
        ctx.quadraticCurveTo(36, 12, 62, 18);
        ctx.quadraticCurveTo(44, 44, 14, 54);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        drawWordmark(ctx, 'RIYADH AIR', 66, 37, '900 26px "Impact", "Arial Black", sans-serif', '#f5d0fe', '#311042', 156);
      }),
    ],
    [
      'ALMARAI',
      makeBrandSprite(212, 72, (ctx) => {
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(36, 36, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(29, 36, 12, 7, -0.5, 0, Math.PI * 2);
        ctx.ellipse(43, 36, 12, 7, 0.5, 0, Math.PI * 2);
        ctx.fill();
        drawWordmark(ctx, 'Almarai', 68, 37, 'italic 900 30px Georgia, serif', '#ffffff', '#1e3a8a', 136);
      }),
    ],
    [
      'SUNTOP',
      makeBrandSprite(200, 72, (ctx) => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(36, 36, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 4;
        ctx.stroke();
        drawWordmark(ctx, 'SUNTOP', 68, 37, '900 30px "Impact", "Arial Black", sans-serif', '#fef08a', '#9a3412', 124);
      }),
    ],
    [
      'VISIT SAUDI',
      makeBrandSprite(228, 72, (ctx) => {
        const cols = ['#ec4899', '#f59e0b', '#10b981', '#38bdf8'];
        cols.forEach((col, i) => {
          ctx.strokeStyle = col;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(14 + i * 10, 50);
          ctx.quadraticCurveTo(22 + i * 10, 14, 34 + i * 8, 26);
          ctx.stroke();
        });
        drawWordmark(ctx, 'Visit Saudi', 68, 37, '900 28px Georgia, serif', '#facc15', '#0f172a', 152);
      }),
    ],
    [
      'ROSHN',
      makeBrandSprite(194, 72, (ctx) => {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(16, 48);
        ctx.lineTo(16, 22);
        ctx.lineTo(36, 12);
        ctx.lineTo(56, 22);
        ctx.lineTo(56, 48);
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.fillRect(30, 30, 12, 18);
        drawWordmark(ctx, 'ROSHN', 66, 37, '900 30px "Impact", "Arial Black", sans-serif', '#ffffff', '#065f46', 120);
      }),
    ],
    [
      'PLAYSTATION',
      makeBrandSprite(232, 72, (ctx) => {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(22, 12, 10, 44);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(38, 25, 13, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.fillRect(10, 46, 52, 8);
        drawWordmark(ctx, 'PlayStation', 68, 37, '900 26px "Arial Black", sans-serif', '#ffffff', '#1e3a8a', 156);
      }),
    ],
    [
      'MASTERCARD',
      makeBrandSprite(228, 72, (ctx) => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(28, 36, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.9)';
        ctx.beginPath();
        ctx.arc(48, 36, 20, 0, Math.PI * 2);
        ctx.fill();
        drawWordmark(ctx, 'mastercard', 74, 37, '900 24px "Arial Black", sans-serif', '#ffffff', '#18181b', 148);
      }),
    ],
    [
      'EA SPORTS',
      makeBrandSprite(216, 72, (ctx) => {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(36, 36, 27, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        drawWordmark(ctx, 'EA', 21, 37, 'italic 900 24px "Impact", sans-serif', '#ffffff', '#020617', 34);
        drawWordmark(ctx, 'EA SPORTS', 68, 37, '900 26px "Impact", "Arial Black", sans-serif', '#fde047', '#020617', 142);
      }),
    ],
    [
      'UMBRO',
      makeBrandSprite(194, 72, (ctx) => {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(36, 12);
        ctx.lineTo(64, 36);
        ctx.lineTo(36, 60);
        ctx.lineTo(8, 36);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(36, 23);
        ctx.lineTo(50, 36);
        ctx.lineTo(36, 49);
        ctx.lineTo(22, 36);
        ctx.closePath();
        ctx.stroke();
        drawWordmark(ctx, 'umbro', 72, 37, '900 28px "Arial Black", sans-serif', '#ffffff', '#09090b', 116);
      }),
    ],
    [
      'KAPPA',
      makeBrandSprite(194, 72, (ctx) => {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(26, 20, 7, 0, Math.PI * 2);
        ctx.arc(46, 20, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(14, 29, 18, 28);
        ctx.fillRect(40, 29, 18, 28);
        drawWordmark(ctx, 'Kappa', 66, 37, '900 30px "Arial Black", sans-serif', '#ffffff', '#7f1d1d', 120);
      }),
    ],
    [
      'MIZUNO',
      makeBrandSprite(202, 72, (ctx) => {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(10, 48);
        ctx.bezierCurveTo(22, 16, 46, 16, 62, 24);
        ctx.bezierCurveTo(44, 32, 28, 44, 14, 52);
        ctx.stroke();
        drawWordmark(ctx, 'Mizuno', 68, 37, 'italic 900 30px "Arial Black", sans-serif', '#ffffff', '#1e3a8a', 128);
      }),
    ],
    [
      'JOMA SPORT',
      makeBrandSprite(216, 72, (ctx) => {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(14, 24);
        ctx.lineTo(56, 14);
        ctx.lineTo(42, 58);
        ctx.lineTo(18, 48);
        ctx.closePath();
        ctx.fill();
        drawWordmark(ctx, 'JOMA', 66, 37, 'italic 900 32px "Impact", "Arial Black", sans-serif', '#fef08a', '#064e3b', 142);
      }),
    ],
    [
      'LOTTO',
      makeBrandSprite(188, 72, (ctx) => {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.strokeRect(14, 18, 26, 26);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(28, 26, 26, 26);
        drawWordmark(ctx, 'lotto', 66, 37, 'italic 900 32px "Arial Black", sans-serif', '#ffffff', '#14532d', 114);
      }),
    ],
    [
      'QATAR AIRWAYS',
      makeBrandSprite(232, 72, (ctx) => {
        ctx.fillStyle = '#831843';
        ctx.beginPath();
        ctx.arc(34, 36, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(28, 48);
        ctx.quadraticCurveTo(32, 22, 46, 16);
        ctx.moveTo(32, 34);
        ctx.quadraticCurveTo(22, 24, 20, 18);
        ctx.stroke();
        drawWordmark(ctx, 'QATAR', 66, 37, '900 30px Georgia, serif', '#ffffff', '#500724', 158);
      }),
    ],
    [
      'HUBLOT',
      makeBrandSprite(200, 72, (ctx) => {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(36, 36, 24, 0, Math.PI * 2);
        ctx.stroke();
        drawWordmark(ctx, 'H', 26, 37, '900 28px "Impact", sans-serif', '#ffffff', '#09090b', 24);
        drawWordmark(ctx, 'HUBLOT', 68, 37, '900 30px "Impact", "Arial Black", sans-serif', '#facc15', '#09090b', 124);
      }),
    ],
  ];

  for (const [key, sprite] of entries) {
    if (sprite) namedBrandSpriteCache.set(key, sprite);
  }

  // Generate clean bespoke monogram & emblem sprites for remaining themed sponsors
  const themedBrands: Array<[string, string, string]> = [
    ['SNACK ATTACK', '#fde047', '#ef4444'],
    ['TURBO KICK', '#38bdf8', '#ef4444'],
    ['SUPER ENERGY', '#facc15', '#ef4444'],
    ['TROPHY GOLD', '#fef08a', '#ca8a04'],
    ['APEX CLEATS', '#facc15', '#b91c1c'],
    ['CROWN COLA', '#facc15', '#dc2626'],
    ['TURBO MINT', '#34d399', '#fef08a'],
    ['CRYO DRINK', '#38bdf8', '#f472b6'],
    ['ANIME BENTO', '#fde047', '#ec4899'],
    ['RAMEN X', '#fef08a', '#ef4444'],
    ['MOCHI POP', '#fbcfe8', '#facc15'],
    ['KAWAII SODA', '#f472b6', '#fde047'],
    ['STARLIGHT TEA', '#a855f7', '#fde047'],
    ['CYBER RAMUNE', '#67e8f9', '#f43f5e'],
    ['OTAKU GEAR', '#f472b6', '#38bdf8'],
    ['NEKO COLA', '#fef08a', '#ec4899'],
    ['GALAXY BOBA', '#67e8f9', '#a855f7'],
    ['TOTY 26', '#facc15', '#2563eb'],
    ['TOTY ICONS', '#fef08a', '#1d4ed8'],
    ['TOTS CHAMPIONS', '#38bdf8', '#facc15'],
    ['FUTTIES PINK', '#f472b6', '#be185d'],
    ['FUTTIES ICONS', '#ec4899', '#facc15'],
    ['FUT DRAFT PRO', '#4ade80', '#059669'],
    ['DIV RIVALS', '#38bdf8', '#1e40af'],
    ['PACK STORE', '#fbbf24', '#b45309'],
    ['UT CHAMPIONS', '#facc15', '#dc2626'],
    ['SBC ELITE', '#e879f9', '#6d28d9'],
    ['COIN BOOST', '#fef08a', '#16a34a'],
    ['ULTIMATE XI', '#facc15', '#db2777'],
  ];

  for (const [brand, c1, c2] of themedBrands) {
    const sprite = makeBrandSprite(226, 72, (ctx) => {
      const grad = ctx.createLinearGradient(10, 10, 58, 62);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(34, 36, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      const initials = brand
        .split(/\s+/)
        .map((w) => w[0] ?? '')
        .join('')
        .slice(0, 2);
      drawWordmark(ctx, initials, 18, 37, '900 22px "Impact", "Arial Black", sans-serif', '#020617', '#ffffff', 34);
      drawWordmark(ctx, brand, 66, 37, '900 26px "Impact", "Arial Black", sans-serif', c1, '#020617', 152);
    });
    if (sprite) namedBrandSpriteCache.set(brand, sprite);
  }
}

export function preloadBrandLogos() {
  if (loadStarted || typeof Image === 'undefined') return;
  loadStarted = true;

  buildCocaColaAndSevenUpSprites();
  buildNamedRealBrandSprites();

  const sheet = new Image();
  sheet.crossOrigin = 'anonymous';
  sheet.onload = () => buildSpritesFromImage(sheet);
  sheet.src = BRAND_LOGO_SHEET_URL;

  const kinzaImg = new Image();
  kinzaImg.crossOrigin = 'anonymous';
  kinzaImg.onload = () => buildKinzaSprite(kinzaImg);
  kinzaImg.src = KINZA_LOGO_URL;

  const codeRedImg = new Image();
  codeRedImg.crossOrigin = 'anonymous';
  codeRedImg.onload = () => buildCodeRedSprite(codeRedImg);
  codeRedImg.src = CODE_RED_LOGO_URL;
}

export function getBrandLogoSprite(id: BrandLogoId): CachedBrandSprite | null {
  if (!loadStarted) preloadBrandLogos();
  return spriteCache.get(id) ?? null;
}

export function getBrandLogoSpriteForBrand(brandName: string, id?: BrandLogoId): CachedBrandSprite | null {
  if (!loadStarted) preloadBrandLogos();
  if (id) {
    const byId = spriteCache.get(id);
    if (byId) return byId;
  }
  const key = brandName.trim().toUpperCase();
  const byName = namedBrandSpriteCache.get(key);
  if (byName) return byName;

  // Immediate crisp fallback emblem if raster sheet is still decoding
  return makeBrandSprite(216, 72, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(34, 36, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '900 28px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#020617';
    ctx.strokeText(key, 66, 37, 142);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(key, 66, 37, 142);
  });
}
