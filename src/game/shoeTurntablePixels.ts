// Pure 3D voxel -> 8-bit pixel buffer synthesizer for upright 360-degree Y-axis turntable
// rotating Nike, Adidas, Puma sneakers, any-color 360-degree soda cans (Coca-Cola, 7Up, Kinza,
// Code Red + new flavors), and 360-degree rotating items for all non-shoe sponsors.

export type TurntableItemKind =
  | 'soda_can'
  | 'soda_coca_cola'
  | 'soda_7up'
  | 'soda_code_red'
  | 'soda_kinza'
  | 'soda_bottle'
  | 'shoe'
  | 'shoe_nike'
  | 'shoe_adidas'
  | 'shoe_adidas_f50'
  | 'shoe_adidas_predator'
  | 'shoe_puma'
  | 'item_controller'
  | 'item_ball'
  | 'item_trophy'
  | 'item_crown'
  | 'item_chip'
  | 'item_burger'
  | 'item_cup'
  | 'item_gem'
  | 'item_bolt'
  | 'item_star'
  | 'item_airplane';

export interface Voxel {
  x: number;
  y: number;
  z: number;
  color: string;
}

export interface RenderedTurntableBounds {
  width: number;
  height: number;
  filledPixels: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  soleCenterY: number;
  collarCenterY: number;
}

export interface SodaFlavorVariant {
  brand: 'COCA-COLA' | '7UP' | 'KINZA' | 'CODE RED' | 'GENERIC';
  flavorName: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
}

export const SODA_FLAVOR_VARIANTS: Record<'COCA-COLA' | '7UP' | 'KINZA' | 'CODE RED', SodaFlavorVariant[]> = {
  'COCA-COLA': [
    { brand: 'COCA-COLA', flavorName: 'CLASSIC', primaryColor: '#dc2626', accentColor: '#ffffff', textColor: '#ffffff' },
    { brand: 'COCA-COLA', flavorName: 'CHERRY', primaryColor: '#9f1239', accentColor: '#fda4af', textColor: '#fecdd3' },
    { brand: 'COCA-COLA', flavorName: 'VANILLA', primaryColor: '#d97706', accentColor: '#fef3c7', textColor: '#fef08a' },
    { brand: 'COCA-COLA', flavorName: 'LIME FIZZ', primaryColor: '#15803d', accentColor: '#bef264', textColor: '#bef264' },
    { brand: 'COCA-COLA', flavorName: 'ZERO BLACK', primaryColor: '#18181b', accentColor: '#ef4444', textColor: '#f87171' },
    { brand: 'COCA-COLA', flavorName: 'STARLIGHT', primaryColor: '#7e22ce', accentColor: '#f0abfc', textColor: '#f5d0fe' },
    { brand: 'COCA-COLA', flavorName: 'BLUE ICE', primaryColor: '#1d4ed8', accentColor: '#93c5fd', textColor: '#bae6fd' },
    { brand: 'COCA-COLA', flavorName: 'PEACH GOLD', primaryColor: '#ea580c', accentColor: '#fed7aa', textColor: '#fed7aa' },
  ],
  '7UP': [
    { brand: '7UP', flavorName: 'LEMON LIME', primaryColor: '#16a34a', accentColor: '#ef4444', textColor: '#ffffff' },
    { brand: '7UP', flavorName: 'CHERRY LIME', primaryColor: '#be123c', accentColor: '#4ade80', textColor: '#bbf7d0' },
    { brand: '7UP', flavorName: 'BLUEBERRY', primaryColor: '#0284c7', accentColor: '#a3e635', textColor: '#bae6fd' },
    { brand: '7UP', flavorName: 'TROPICAL MANGO', primaryColor: '#f59e0b', accentColor: '#22c55e', textColor: '#fef08a' },
    { brand: '7UP', flavorName: 'GRAPE', primaryColor: '#7c3aed', accentColor: '#bef264', textColor: '#e9d5ff' },
    { brand: '7UP', flavorName: 'WATERMELON', primaryColor: '#e11d48', accentColor: '#86efac', textColor: '#fecdd3' },
    { brand: '7UP', flavorName: 'PINK LEMON', primaryColor: '#ec4899', accentColor: '#fef08a', textColor: '#fbcfe8' },
  ],
  'KINZA': [
    { brand: 'KINZA', flavorName: 'COLA', primaryColor: '#1e3a8a', accentColor: '#ef4444', textColor: '#ffffff' },
    { brand: 'KINZA', flavorName: 'LEMON', primaryColor: '#eab308', accentColor: '#15803d', textColor: '#fef08a' },
    { brand: 'KINZA', flavorName: 'CITRUS', primaryColor: '#16a34a', accentColor: '#fef08a', textColor: '#bbf7d0' },
    { brand: 'KINZA', flavorName: 'ORANGE', primaryColor: '#ea580c', accentColor: '#facc15', textColor: '#fed7aa' },
    { brand: 'KINZA', flavorName: 'BLACK CURRANT', primaryColor: '#6b21a8', accentColor: '#38bdf8', textColor: '#f5d0fe' },
    { brand: 'KINZA', flavorName: 'WATERMELON', primaryColor: '#e11d48', accentColor: '#4ade80', textColor: '#fecdd3' },
    { brand: 'KINZA', flavorName: 'BLUE ICE', primaryColor: '#0369a1', accentColor: '#67e8f9', textColor: '#a5f3fc' },
  ],
  'CODE RED': [
    { brand: 'CODE RED', flavorName: 'ORIGINAL', primaryColor: '#dc2626', accentColor: '#facc15', textColor: '#facc15' },
    { brand: 'CODE RED', flavorName: 'ELECTRIC BLUE', primaryColor: '#0284c7', accentColor: '#38bdf8', textColor: '#7dd3fc' },
    { brand: 'CODE RED', flavorName: 'NEON LIME', primaryColor: '#16a34a', accentColor: '#a3e635', textColor: '#bef264' },
    { brand: 'CODE RED', flavorName: 'CYBER VIOLET', primaryColor: '#7e22ce', accentColor: '#f472b6', textColor: '#f0abfc' },
    { brand: 'CODE RED', flavorName: 'SOLAR GOLD', primaryColor: '#d97706', accentColor: '#fef08a', textColor: '#fef08a' },
    { brand: 'CODE RED', flavorName: 'CRIMSON BERRY', primaryColor: '#9f1239', accentColor: '#fda4af', textColor: '#fda4af' },
    { brand: 'CODE RED', flavorName: 'ARCTIC CYAN', primaryColor: '#0f766e', accentColor: '#5eead4', textColor: '#99f6e4' },
  ],
};

const ANY_SODA_RAINBOW_PALETTES: Array<{ name: string; primaryColor: string; accentColor: string; textColor: string }> = [
  { name: 'CHERRY POP', primaryColor: '#e11d48', accentColor: '#fef08a', textColor: '#fecdd3' },
  { name: 'BLUE RAZ', primaryColor: '#0284c7', accentColor: '#38bdf8', textColor: '#bae6fd' },
  { name: 'GREEN APPLE', primaryColor: '#16a34a', accentColor: '#bef264', textColor: '#bbf7d0' },
  { name: 'TANGERINE', primaryColor: '#ea580c', accentColor: '#facc15', textColor: '#fed7aa' },
  { name: 'GRAPE SODA', primaryColor: '#7c3aed', accentColor: '#f0abfc', textColor: '#e9d5ff' },
  { name: 'GOLD FIZZ', primaryColor: '#ca8a04', accentColor: '#ffffff', textColor: '#fef08a' },
  { name: 'BERRY PINK', primaryColor: '#db2777', accentColor: '#fbcfe8', textColor: '#fbcfe8' },
  { name: 'TEAL SPLASH', primaryColor: '#0d9488', accentColor: '#99f6e4', textColor: '#ccfbf1' },
];

export function getSodaFlavorVariant(
  brand: string,
  matchSeed = 2627,
  slotSeed = 0,
  cycleIdx = 0,
  fallbackPrimary = '#ef4444',
  fallbackAccent = '#facc15'
): SodaFlavorVariant {
  const b = brand.toUpperCase();
  const mix = Math.abs((matchSeed * 31 + slotSeed * 17 + cycleIdx * 13) | 0);
  if (b === 'COCA-COLA' || b === '7UP' || b === 'KINZA' || b === 'CODE RED') {
    const list = SODA_FLAVOR_VARIANTS[b];
    return list[mix % list.length];
  }
  const rainbow = ANY_SODA_RAINBOW_PALETTES[mix % ANY_SODA_RAINBOW_PALETTES.length];
  return {
    brand: 'GENERIC',
    flavorName: rainbow?.name ?? 'ICE FIZZ',
    primaryColor: rainbow?.primaryColor ?? fallbackPrimary,
    accentColor: rainbow?.accentColor ?? fallbackAccent,
    textColor: rainbow?.textColor ?? '#ffffff',
  };
}

const modelCache = new Map<string, Voxel[]>();

export function getShoeDisplayModelName(
  kind: TurntableItemKind,
  slotIndex = 0
): string {
  if (kind === 'shoe_nike') {
    const nikeNames = ['NIKE AIR JORDAN 1', 'NIKE AIR MAX 90', 'NIKE MERCURIAL'];
    return nikeNames[Math.abs(slotIndex) % nikeNames.length];
  }
  if (kind === 'shoe_adidas_f50') return 'ADIDAS F50';
  if (kind === 'shoe_adidas_predator') return 'ADIDAS PREDATOR';
  if (kind === 'shoe_adidas') {
    const adidasNames = ['ADIDAS PREDATOR', 'ADIDAS F50', 'ADIDAS SUPERSTAR'];
    return adidasNames[Math.abs(slotIndex) % adidasNames.length];
  }
  if (kind === 'shoe_puma') {
    const pumaNames = ['PUMA SUEDE XL', 'PUMA FUTURE 7', 'PUMA KING PRO'];
    return pumaNames[Math.abs(slotIndex) % pumaNames.length];
  }
  if (kind === 'soda_coca_cola') return 'COCA-COLA';
  if (kind === 'soda_7up') return '7UP';
  if (kind === 'soda_code_red') return 'CODE RED';
  if (kind === 'soda_kinza') return 'KINZA COLA';
  if (kind === 'soda_can') return 'ICE FIZZ CAN';
  if (kind === 'soda_bottle') return 'POWER BOTTLE';
  if (kind === 'item_controller') return 'PRO GAMEPAD';
  if (kind === 'item_ball') return 'MATCH BALL';
  if (kind === 'item_trophy') return 'CHAMPION CUP';
  if (kind === 'item_crown') return 'ROYAL CROWN';
  if (kind === 'item_chip') return 'CRUNCH PACK';
  if (kind === 'item_burger') return 'SUPER BENTO';
  if (kind === 'item_cup') return 'FRESH CUP';
  if (kind === 'item_gem') return 'ENERGY GEM';
  if (kind === 'item_bolt') return 'TURBO BOLT';
  if (kind === 'item_star') return 'ALL-STAR ICON';
  if (kind === 'item_airplane') return 'SKY JET';
  return 'PRO GEAR';
}

function darkenHex(hex: string, factor: number): string {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  if (clean.length !== 6) return hex;
  const r = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(4, 6), 16) * factor)));
  return `rgb(${r},${g},${b})`;
}

type ShoeKind =
  | 'shoe'
  | 'shoe_nike'
  | 'shoe_adidas'
  | 'shoe_adidas_f50'
  | 'shoe_adidas_predator'
  | 'shoe_puma';

function buildShoeVoxels(
  kind: ShoeKind,
  primaryCol: string,
  accentCol: string
): Voxel[] {
  const key = `v3:${kind}:${primaryCol}:${accentCol}`;
  const cached = modelCache.get(key);
  if (cached) return cached;

  const voxels: Voxel[] = [];
  const put = (x: number, y: number, z: number, color: string) => {
    voxels.push({ x, y, z, color });
  };

  const isAdidasF50 = kind === 'shoe_adidas_f50';
  const isAdidasPredator = kind === 'shoe_adidas_predator';
  const isAnyAdidas = kind === 'shoe_adidas' || isAdidasF50 || isAdidasPredator;

  const upperCol =
    kind === 'shoe_nike'
      ? '#dc2626'
      : isAdidasF50
        ? '#fb923c'
        : isAdidasPredator
          ? '#ef4444'
          : kind === 'shoe_adidas'
            ? '#1d4ed8'
            : kind === 'shoe_puma'
              ? '#e11d48'
              : primaryCol;

  const outsoleCol =
    kind === 'shoe_nike'
      ? '#b91c1c'
      : isAdidasF50
        ? '#1d4ed8'
        : isAdidasPredator
          ? '#f8fafc'
          : kind === 'shoe_adidas'
            ? '#0284c7'
            : kind === 'shoe_puma'
              ? '#facc15'
              : accentCol;

  const markCol =
    kind === 'shoe_nike'
      ? '#09090b'
      : isAdidasF50
        ? '#1d4ed8'
        : '#ffffff';

  for (let z = -7; z <= 7; z++) {
    const halfW = z >= 6 ? 1 : z >= 4 || z <= -6 ? 2 : 3;
    for (let x = -halfW; x <= halfW; x++) {
      if ((isAdidasF50 || isAdidasPredator) && z % 3 !== 0 && Math.abs(x) === halfW) {
        put(x, 0, z, isAdidasF50 ? '#fb923c' : '#f43f5e');
      } else {
        put(x, 0, z, outsoleCol);
      }

      if (isAdidasF50) {
        put(x, 1, z, '#1d4ed8');
        if (z <= 5) put(x, 2, z, z >= 3 ? '#fdba74' : '#fb923c');
      } else if (isAdidasPredator) {
        put(x, 1, z, z <= -2 ? '#e2e8f0' : '#f43f5e');
        if (z <= 5) put(x, 2, z, z <= -4 ? '#f8fafc' : '#ef4444');
      } else {
        put(x, 1, z, '#f8fafc');
        if (z <= 5) put(x, 2, z, '#ffffff');
      }

      if (kind === 'shoe_nike') {
        const isToeWrap = z >= 4;
        const isHeelWrap = z <= -4;
        put(x, 3, z, isToeWrap || isHeelWrap ? upperCol : '#ffffff');
      } else if (isAdidasF50) {
        put(x, 3, z, z >= 5 ? '#fdba74' : upperCol);
      } else if (isAdidasPredator) {
        put(x, 3, z, z <= -5 ? '#f8fafc' : upperCol);
      } else if (kind === 'shoe_adidas') {
        const isShellToe = z >= 5;
        put(x, 3, z, isShellToe ? '#ffffff' : upperCol);
      } else if (kind === 'shoe_puma') {
        put(x, 3, z, z <= -5 ? '#18181b' : upperCol);
      } else {
        put(x, 3, z, upperCol);
      }

      if (z <= 5) {
        if (kind === 'shoe_nike') {
          const isEdgeToe = z >= 4 && Math.abs(x) === halfW;
          const isToeCenter = z >= 3 && Math.abs(x) <= 1;
          const isHeel = z <= -4;
          if (isEdgeToe || isHeel) {
            put(x, 4, z, upperCol);
          } else if (isToeCenter) {
            put(x, 4, z, z >= 4 ? '#ffffff' : '#09090b');
          } else {
            put(x, 4, z, '#ffffff');
          }
        } else if (isAdidasF50) {
          put(x, 4, z, z >= 3 && Math.abs(x) <= 1 ? '#fed7aa' : upperCol);
        } else if (isAdidasPredator) {
          put(x, 4, z, z <= -5 ? '#f8fafc' : upperCol);
        } else if (kind === 'shoe_adidas') {
          if (z >= 4 && Math.abs(x) <= 1) {
            put(x, 4, z, '#ffffff');
          } else {
            put(x, 4, z, upperCol);
          }
        } else {
          put(x, 4, z, z === -7 ? '#09090b' : upperCol);
        }
      }

      if (z <= 2) {
        const maxCollarY = kind === 'shoe_nike' ? 9 : 7;
        for (let y = 5; y <= maxCollarY; y++) {
          const collarMinZ = y >= 8 ? -6 : -7;
          if (z < collarMinZ) continue;
          if (z >= 1 && y >= 8) continue;

          const isInnerOpening = z >= -5 && z <= -2 && Math.abs(x) <= 1 && y >= 6;
          if (isInnerOpening) {
            if (y === 6) put(x, y, z, '#0f172a');
            continue;
          }

          if (z >= 0 && Math.abs(x) <= 1) {
            if (isAdidasF50) {
              put(x, y, z, y % 2 === 0 ? '#fed7aa' : '#fb923c');
            } else if (isAdidasPredator) {
              put(x, y, z, y >= 7 ? '#09090b' : '#ef4444');
            } else if (y === 5 || y === 6) {
              put(x, y, z, (y + z) % 2 === 0 ? '#09090b' : '#ffffff');
            } else if (y === 7 && z <= 1) {
              put(x, y, z, z === 0 ? '#ffffff' : '#09090b');
            } else if (y >= 8 && z === 0) {
              put(x, y, z, kind === 'shoe_nike' ? '#dc2626' : '#ffffff');
            }
            continue;
          }

          if (kind === 'shoe_nike') {
            if (y === 7 && z <= -3) {
              put(x, y, z, '#09090b');
            } else if (z <= -4 || y >= 7 || z >= 1) {
              put(x, y, z, upperCol);
            } else {
              put(x, y, z, '#ffffff');
            }
          } else if (isAdidasPredator && z <= -6 && y >= 6) {
            put(x, y, z, '#09090b');
          } else {
            put(x, y, z, upperCol);
          }
        }
      }
    }
  }

  const paintSide = (sx: number) => {
    if (kind === 'shoe_nike') {
      put(sx, 6, -3, markCol);
      put(sx, 5, -2, markCol);
      put(sx, 4, -1, markCol);
      put(sx, 4, 0, markCol);
      put(sx, 4, 1, markCol);
      put(sx, 5, 2, markCol);
      put(sx, 5, 3, markCol);
      put(sx, 6, 3, markCol);
    } else if (isAnyAdidas) {
      for (const offset of [-3, 0, 3]) {
        put(sx, 3, offset, markCol);
        put(sx, 4, offset, markCol);
        put(sx, 5, offset + 1, markCol);
        put(sx, 6, offset + 1, markCol);
      }
      if (isAdidasF50) {
        put(sx, 3, 5, '#1d4ed8');
        put(sx, 4, 4, '#1e3a8a');
        put(0, 5, -7, '#1d4ed8');
        put(0, 6, -7, '#1d4ed8');
      } else if (isAdidasPredator) {
        put(0, 4, -7, '#ffffff');
        put(0, 5, -7, '#ffffff');
        put(0, 7, -7, '#09090b');
      } else {
        put(0, 6, -7, '#ffffff');
        put(0, 7, -7, '#ffffff');
      }
    } else if (kind === 'shoe_puma') {
      put(sx, 6, -5, markCol);
      put(sx, 6, -4, markCol);
      put(sx, 5, -3, markCol);
      put(sx, 5, -2, markCol);
      put(sx, 4, -1, markCol);
      put(sx, 4, 0, markCol);
      put(sx, 4, 1, markCol);
      put(sx, 4, 2, markCol);
      put(sx, 5, 3, markCol);
      put(0, 5, -7, '#facc15');
      put(0, 6, -7, '#facc15');
    } else {
      put(sx, 4, -1, accentCol);
      put(sx, 4, 0, accentCol);
      put(sx, 4, 1, accentCol);
    }
  };

  paintSide(-3);
  paintSide(3);

  modelCache.set(key, voxels);
  return voxels;
}

type BeverageKind =
  | 'soda_can'
  | 'soda_coca_cola'
  | 'soda_7up'
  | 'soda_code_red'
  | 'soda_kinza'
  | 'soda_bottle';

function buildBeverageVoxels(
  kind: BeverageKind,
  primaryCol: string,
  accentCol: string
): Voxel[] {
  const key = `v4:${kind}:${primaryCol}:${accentCol}`;
  const cached = modelCache.get(key);
  if (cached) return cached;

  const voxels: Voxel[] = [];
  const put = (x: number, y: number, z: number, color: string) => {
    voxels.push({ x, y, z, color });
  };

  // Every soda can uses primaryCol & accentCol dynamically so ANY flavor color works cleanly!
  const bodyCol = primaryCol || '#dc2626';
  const stripeCol = accentCol || '#ffffff';

  if (kind === 'soda_coca_cola') {
    for (let y = 0; y <= 11; y++) {
      const r = y === 0 || y === 11 ? 3 : 4;
      for (let z = -r; z <= r; z++) {
        for (let x = -r; x <= r; x++) {
          const dist = Math.abs(x) + Math.abs(z);
          if (dist > (r === 3 ? 4 : 5)) continue;
          if (y === 0 || y === 11) {
            const isTab = y === 11 && x === 0 && (z === 0 || z === 1);
            put(x, y, z, isTab ? '#09090b' : '#f1f5f9');
          } else {
            // Iconic dynamic ribbon wave wrapping around all 360 degrees
            const waveY = 5 + Math.round(Math.sin((x + z) * 0.7));
            const isScriptStripe = Math.abs(z) >= 2 && (y === waveY || y === 7);
            const isFlavorBand = y === 2 && Math.abs(x + z) % 2 === 0;
            if (isScriptStripe) {
              put(x, y, z, '#ffffff');
            } else if (isFlavorBand) {
              put(x, y, z, stripeCol);
            } else {
              put(x, y, z, bodyCol);
            }
          }
        }
      }
    }
  } else if (kind === 'soda_7up') {
    for (let y = 0; y <= 11; y++) {
      const r = y === 0 || y === 11 ? 3 : 4;
      for (let z = -r; z <= r; z++) {
        for (let x = -r; x <= r; x++) {
          const dist = Math.abs(x) + Math.abs(z);
          if (dist > (r === 3 ? 4 : 5)) continue;
          if (y === 0 || y === 11) {
            const isTab = y === 11 && x === 0 && (z === 0 || z === 1);
            put(x, y, z, isTab ? '#09090b' : '#f1f5f9');
          } else {
            const isFrontBack = Math.abs(z) >= 2;
            const isRedDot = isFrontBack && Math.abs(x) <= 1 && y >= 5 && y <= 6;
            const isWhiteSevenUp =
              isFrontBack &&
              ((x === -2 && y >= 4 && y <= 8) || (x === 2 && y >= 4 && y <= 7) || (y === 8 && x <= -1 && x >= -3));
            const isBubble = (Math.abs(x) >= 3 && (y + x + z) % 3 === 0);
            if (isRedDot) {
              put(x, y, z, stripeCol === '#ffffff' ? '#ef4444' : stripeCol);
            } else if (isWhiteSevenUp) {
              put(x, y, z, '#ffffff');
            } else if (isBubble) {
              put(x, y, z, '#bef264');
            } else {
              put(x, y, z, bodyCol);
            }
          }
        }
      }
    }
  } else if (kind === 'soda_code_red') {
    for (let y = 0; y <= 11; y++) {
      const r = y === 0 || y === 11 ? 3 : 4;
      for (let z = -r; z <= r; z++) {
        for (let x = -r; x <= r; x++) {
          const dist = Math.abs(x) + Math.abs(z);
          if (dist > (r === 3 ? 4 : 5)) continue;
          if (y === 0 || y === 11) {
            const isTab = y === 11 && x === 0 && (z === 0 || z === 1);
            put(x, y, z, isTab ? '#09090b' : '#f1f5f9');
          } else if (y >= 9) {
            const isSloganAccent = y === 9 && (x + z) % 2 === 0;
            const isSloganWhite = y === 10 && Math.abs(x + z) % 3 === 0;
            put(x, y, z, isSloganWhite ? '#ffffff' : isSloganAccent ? stripeCol : '#09090b');
          } else {
            const isFrontBack = Math.abs(z) >= 2;
            const isCoreGlow =
              isFrontBack && Math.abs(x) <= 1 && (y === 5 || y === 6) && Math.abs(z) >= 3;
            const isBlackWordmark =
              isFrontBack &&
              ((y >= 2 && y <= 7 && x === 0) ||
                (y === 4 && Math.abs(x) === 1) ||
                (y === 6 && x === -1) ||
                (y === 3 && x === 1));
            const isLightning =
              (Math.abs(x) >= 2 && (y + Math.abs(x) + z) % 3 === 0) ||
              (Math.abs(z) <= 1 && y >= 2 && y <= 8 && (y % 2 === 0 ? x === 3 : x === -3));

            if (isCoreGlow) {
              put(x, y, z, stripeCol);
            } else if (isBlackWordmark) {
              put(x, y, z, '#09090b');
            } else if (isLightning) {
              put(x, y, z, '#ffffff');
            } else {
              put(x, y, z, bodyCol);
            }
          }
        }
      }
    }
  } else if (kind === 'soda_kinza') {
    for (let y = 0; y <= 11; y++) {
      const r = y === 0 || y === 11 ? 3 : 4;
      for (let z = -r; z <= r; z++) {
        for (let x = -r; x <= r; x++) {
          const dist = Math.abs(x) + Math.abs(z);
          if (dist > (r === 3 ? 4 : 5)) continue;
          if (y === 0 || y === 11) {
            const isTab = y === 11 && x === 0 && (z === 0 || z === 1);
            put(x, y, z, isTab ? '#09090b' : '#f1f5f9');
          } else {
            const isWordmark = Math.abs(z) >= 2 && x === -1 && y >= 2 && y <= 9;
            const isBurstAccent =
              (Math.abs(z) >= 2 && x >= 1 && x <= 2 && y >= 4 && y <= 7) ||
              (Math.abs(x) >= 3 && y >= 5 && y <= 6);
            const isWhiteRay =
              (Math.abs(z) >= 2 && x === 2 && (y === 2 || y === 3 || y === 8 || y === 9)) ||
              (Math.abs(x) >= 3 && (y === 3 || y === 8));

            if (isWordmark || isWhiteRay) {
              put(x, y, z, '#ffffff');
            } else if (isBurstAccent) {
              put(x, y, z, stripeCol);
            } else {
              put(x, y, z, bodyCol);
            }
          }
        }
      }
    }
  } else if (kind === 'soda_can') {
    for (let y = 0; y <= 11; y++) {
      const r = y === 0 || y === 11 ? 3 : 4;
      for (let z = -r; z <= r; z++) {
        for (let x = -r; x <= r; x++) {
          if (Math.abs(x) + Math.abs(z) > (r === 3 ? 4 : 5)) continue;
          const isRim = y === 0 || y === 11;
          const isLabelStripe = y >= 5 && y <= 7 && Math.abs(z) >= 1;
          const isPopTab = y === 11 && x === 0 && z === 1;
          put(
            x,
            y,
            z,
            isPopTab ? '#0f172a' : isRim ? '#e2e8f0' : isLabelStripe ? stripeCol : bodyCol
          );
        }
      }
    }
  } else {
    // soda_bottle
    for (let y = 0; y <= 11; y++) {
      const r = y >= 8 ? 1 : 3;
      for (let z = -r; z <= r; z++) {
        for (let x = -r; x <= r; x++) {
          if (r === 3 && Math.abs(x) === 3 && Math.abs(z) === 3) continue;
          const isCap = y >= 10;
          const isLabel = y >= 3 && y <= 6;
          put(x, y, z, isCap ? stripeCol : isLabel ? '#ffffff' : bodyCol);
        }
      }
    }
  }

  modelCache.set(key, voxels);
  return voxels;
}

type NonShoeItemKind =
  | 'item_controller'
  | 'item_ball'
  | 'item_trophy'
  | 'item_crown'
  | 'item_chip'
  | 'item_burger'
  | 'item_cup'
  | 'item_gem'
  | 'item_bolt'
  | 'item_star'
  | 'item_airplane';

function buildNonShoeItemVoxels(
  kind: NonShoeItemKind,
  primaryCol: string,
  accentCol: string
): Voxel[] {
  const key = `v4:${kind}:${primaryCol}:${accentCol}`;
  const cached = modelCache.get(key);
  if (cached) return cached;

  const voxels: Voxel[] = [];
  const put = (x: number, y: number, z: number, color: string) => {
    voxels.push({ x, y, z, color });
  };

  if (kind === 'item_controller') {
    // 3D gaming gamepad with left/right grips, shoulder triggers, D-pad & action buttons
    for (let y = 1; y <= 7; y++) {
      for (let x = -6; x <= 6; x++) {
        for (let z = -2; z <= 2; z++) {
          const isGrip = y <= 3 && Math.abs(x) >= 3;
          const isBody = y >= 3 && y <= 6;
          const isShoulder = y === 7 && Math.abs(x) >= 2 && Math.abs(x) <= 5 && z <= 0;
          if (!isGrip && !isBody && !isShoulder) continue;
          if (y === 6 && Math.abs(x) <= 1 && Math.abs(z) <= 1) continue;
          const isDpad = y === 5 && x >= -5 && x <= -3 && Math.abs(z) === 2;
          const isBtn = (y === 5 || y === 4) && x >= 3 && x <= 5 && Math.abs(z) === 2;
          const isTrigger = y === 7;
          put(
            x,
            y,
            z,
            isDpad ? '#ffffff' : isBtn ? accentCol : isTrigger ? accentCol : primaryCol
          );
        }
      }
    }
    // Base stand reference voxel layer at y=0 for upright tracking
    for (let x = -4; x <= 4; x += 2) put(x, 0, 0, '#0f172a');
  } else if (kind === 'item_ball') {
    // 3D soccer ball sphere (y: 0..10) with pentagon dark patches
    for (let y = 0; y <= 10; y++) {
      for (let x = -5; x <= 5; x++) {
        for (let z = -5; z <= 5; z++) {
          const d = x * x + (y - 5) * (y - 5) + z * z;
          if (d > 27) continue;
          const isPatch =
            (Math.abs(x) <= 1 && Math.abs(y - 5) <= 1 && Math.abs(z) >= 4) ||
            (Math.abs(z) <= 1 && Math.abs(y - 5) <= 1 && Math.abs(x) >= 4) ||
            (y >= 9 || y <= 1);
          put(x, y, z, isPatch ? '#0f172a' : (x + y + z) % 4 === 0 ? accentCol : '#ffffff');
        }
      }
    }
  } else if (kind === 'item_trophy') {
    // 3D Gold Trophy Cup (pedestal y=0..2, stem y=3..4, chalice + handles y=5..10)
    for (let y = 0; y <= 10; y++) {
      for (let x = -5; x <= 5; x++) {
        for (let z = -3; z <= 3; z++) {
          if (y <= 1 && Math.abs(x) <= 3 && Math.abs(z) <= 2) {
            put(x, y, z, y === 0 ? '#0f172a' : '#78350f');
          } else if (y >= 2 && y <= 4 && Math.abs(x) <= 1 && Math.abs(z) <= 1) {
            put(x, y, z, accentCol);
          } else if (y >= 5 && y <= 10) {
            const cupR = y <= 6 ? 2 : 3;
            const inBowl = Math.abs(x) <= cupR && Math.abs(z) <= cupR;
            const inHandle = (y >= 6 && y <= 9) && (Math.abs(x) === 4 || Math.abs(x) === 5) && Math.abs(z) <= 1;
            if (inBowl || inHandle) {
              put(x, y, z, y === 10 ? '#fef08a' : '#facc15');
            }
          }
        }
      }
    }
  } else if (kind === 'item_crown') {
    // 3D Royal Crown with jeweled spires
    for (let y = 0; y <= 9; y++) {
      for (let x = -5; x <= 5; x++) {
        for (let z = -4; z <= 4; z++) {
          const dist = Math.abs(x) + Math.abs(z);
          if (dist > 6 || (Math.abs(x) < 3 && Math.abs(z) < 2 && y >= 5)) continue;
          if (y <= 4) {
            const isBand = y <= 1;
            const isGem = y === 3 && ((x === 0 && Math.abs(z) >= 3) || (z === 0 && Math.abs(x) >= 4));
            put(x, y, z, isGem ? accentCol : isBand ? '#78350f' : '#facc15');
          } else {
            const isSpike =
              (Math.abs(x) === 4 && z === 0) ||
              (x === 0 && Math.abs(z) === 4) ||
              (x === 0 && z === 0 && y <= 9);
            if (isSpike && (y <= 8 || (x === 0 && z === 0))) {
              put(x, y, z, y >= 8 ? accentCol : '#fde047');
            }
          }
        }
      }
    }
  } else if (kind === 'item_chip') {
    // 3D Snack / Chip Bag (pillow foil pouch)
    for (let y = 0; y <= 11; y++) {
      for (let x = -4; x <= 4; x++) {
        const maxZ = y <= 1 || y >= 10 ? 1 : 2;
        for (let z = -maxZ; z <= maxZ; z++) {
          if (Math.abs(x) === 4 && Math.abs(z) === 2) continue;
          const isSeal = y === 0 || y === 11;
          const isLogo = Math.abs(z) === maxZ && y >= 4 && y <= 7 && Math.abs(x) <= 2;
          put(x, y, z, isSeal ? '#e2e8f0' : isLogo ? accentCol : primaryCol);
        }
      }
    }
  } else if (kind === 'item_burger') {
    // 3D Pixel Burger / Bento Box
    for (let y = 0; y <= 9; y++) {
      const r = y >= 8 ? 3 : 4;
      for (let x = -r; x <= r; x++) {
        for (let z = -r; z <= r; z++) {
          if (Math.abs(x) + Math.abs(z) > (r === 3 ? 4 : 5)) continue;
          if (y <= 2) put(x, y, z, '#f59e0b');
          else if (y <= 4) put(x, y, z, '#78350f');
          else if (y === 5) put(x, y, z, '#facc15');
          else if (y === 6) put(x, y, z, '#22c55e');
          else put(x, y, z, (y === 9 && (x + z) % 2 === 0) ? '#fef3c7' : '#f59e0b');
        }
      }
    }
  } else if (kind === 'item_cup') {
    // 3D Refreshment Cup / Bowl with lid & straw
    for (let y = 0; y <= 11; y++) {
      const r = y >= 9 ? 4 : y >= 4 ? 3 : 2;
      for (let x = -r; x <= r; x++) {
        for (let z = -r; z <= r; z++) {
          if (y >= 10) {
            if (x === 0 && z === 0) put(x, y, z, accentCol);
            continue;
          }
          if (Math.abs(x) + Math.abs(z) > r + 1) continue;
          const isLid = y === 9;
          const isBand = y >= 5 && y <= 7;
          put(x, y, z, isLid ? '#ffffff' : isBand ? accentCol : primaryCol);
        }
      }
    }
  } else if (kind === 'item_gem') {
    // 3D Faceted Diamond / Gem
    for (let y = 0; y <= 10; y++) {
      const r = y <= 5 ? Math.max(1, Math.floor(y * 0.85)) : Math.max(1, Math.floor((10 - y) * 0.95));
      for (let x = -r; x <= r; x++) {
        for (let z = -r; z <= r; z++) {
          if (Math.abs(x) + Math.abs(z) > r + 1) continue;
          const isFacet = y === 5 || Math.abs(x) === r;
          put(x, y, z, isFacet ? '#ffffff' : (y > 5 ? primaryCol : accentCol));
        }
      }
    }
  } else if (kind === 'item_bolt') {
    // 3D Energy Lightning Bolt on base plinth
    for (let x = -2; x <= 2; x++) put(x, 0, 0, '#0f172a');
    for (let y = 1; y <= 10; y++) {
      const shiftX = y >= 6 ? Math.floor((y - 6) * 0.6) : Math.floor((y - 5) * 0.6);
      for (let dx = -1; dx <= 2; dx++) {
        for (let z = -1; z <= 1; z++) {
          put(shiftX + dx, y, z, (y === 5 || y === 6) ? '#ffffff' : primaryCol);
        }
      }
    }
  } else if (kind === 'item_airplane') {
    // 3D Commercial Jet / Airline Plane tilted upward cleanly
    for (let x = -2; x <= 2; x++) put(x, 0, 0, '#0f172a');
    for (let z = -7; z <= 7; z++) {
      // Fuselage
      for (let y = 3; y <= 5; y++) {
        for (let x = -1; x <= 1; x++) {
          if (z >= 6 && Math.abs(x) > 0) continue;
          const isCockpit = z >= 5 && y === 5;
          put(x, y, z, isCockpit ? '#38bdf8' : '#f8fafc');
        }
      }
      // Swept main wings
      if (z >= -2 && z <= 2) {
        const wingSpan = 6 - Math.abs(z);
        for (let x = -wingSpan; x <= wingSpan; x++) {
          put(x, 4, z, Math.abs(x) >= wingSpan - 1 ? accentCol : primaryCol);
        }
      }
      // Vertical tail fin
      if (z <= -4) {
        for (let y = 6; y <= 9; y++) {
          if (y === 9 && z > -6) continue;
          put(0, y, z, accentCol);
        }
      }
    }
  } else {
    // item_star: 3D Championship Star
    for (let x = -2; x <= 2; x++) put(x, 0, 0, '#0f172a');
    for (let y = 1; y <= 10; y++) {
      const distY = Math.abs(y - 5.5);
      const halfX = y >= 8 ? Math.max(1, 10 - y) : y >= 5 ? 5 : y >= 3 ? 3 : 4;
      for (let x = -halfX; x <= halfX; x++) {
        if (y <= 2 && Math.abs(x) <= 1) continue;
        for (let z = -1; z <= 1; z++) {
          const isCore = distY < 2 && Math.abs(x) <= 2;
          put(x, y, z, isCore ? '#ffffff' : primaryCol);
        }
      }
    }
  }

  modelCache.set(key, voxels);
  return voxels;
}

/**
 * Renders a 3D upright Y-axis 360-degree turntable voxel item onto a quantized
 * pixel buffer (no Z-plane cartwheel circle spin).
 */
export function render360TurntableToPixelGrid(
  kind: TurntableItemKind,
  yawRad: number,
  primaryCol: string,
  accentCol: string,
  bufW = 40,
  bufH = 28
): { colors: (string | null)[]; bounds: RenderedTurntableBounds } {
  const isShoe =
    kind === 'shoe' ||
    kind === 'shoe_nike' ||
    kind === 'shoe_adidas' ||
    kind === 'shoe_adidas_f50' ||
    kind === 'shoe_adidas_predator' ||
    kind === 'shoe_puma';
  const isBeverage =
    kind === 'soda_can' ||
    kind === 'soda_coca_cola' ||
    kind === 'soda_7up' ||
    kind === 'soda_code_red' ||
    kind === 'soda_kinza' ||
    kind === 'soda_bottle';

  const voxels = isShoe
    ? buildShoeVoxels(kind, primaryCol, accentCol)
    : isBeverage
      ? buildBeverageVoxels(kind, primaryCol, accentCol)
      : buildNonShoeItemVoxels(kind, primaryCol, accentCol);

  const cosY = Math.cos(yawRad);
  const sinY = Math.sin(yawRad);
  const pitch = isShoe ? 0.24 : 0.16;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const scale = isShoe ? (bufH / 28) * 1.92 : (bufH / 28) * 1.92;
  const centerX = bufW / 2 - 0.5;
  const baseY = isShoe ? bufH - 4.2 * (bufH / 28) : bufH - 2.4 * (bufH / 28);

  const len = bufW * bufH;
  const zBuf = new Float32Array(len);
  zBuf.fill(-1e9);
  const colBuf: (string | null)[] = new Array(len).fill(null);

  let soleYSum = 0;
  let soleCount = 0;
  let collarYSum = 0;
  let collarCount = 0;

  for (let i = 0; i < voxels.length; i++) {
    const v = voxels[i];
    const liftedY = isShoe ? v.y + Math.max(0, (-v.z + 7) * 0.06) : v.y;

    const rx = v.x * cosY + v.z * sinY;
    const rz = -v.x * sinY + v.z * cosY;

    const py = liftedY * cosP - rz * sinP;
    const depth = liftedY * sinP + rz * cosP;

    const sx = Math.round(centerX + rx * scale);
    const sy = Math.round(baseY - py * scale);
    if (sx < 1 || sx >= bufW - 1 || sy < 1 || sy >= bufH - 1) continue;

    const idx = sy * bufW + sx;
    if (depth > zBuf[idx]) {
      zBuf[idx] = depth;
      const shadeFactor = depth > 2.2 ? 1.0 : depth > -1.8 ? 0.92 : 0.82;
      colBuf[idx] = shadeFactor === 1.0 ? v.color : darkenHex(v.color, shadeFactor);

      if (v.y <= 1) {
        soleYSum += sy;
        soleCount++;
      } else if (v.y >= 6) {
        collarYSum += sy;
        collarCount++;
      }
    }
  }

  const outBuf = colBuf.slice();
  let filledPixels = 0;
  let minX = bufW;
  let maxX = -1;
  let minY = bufH;
  let maxY = -1;

  for (let y = 1; y < bufH - 1; y++) {
    for (let x = 1; x < bufW - 1; x++) {
      const idx = y * bufW + x;
      if (colBuf[idx] !== null) {
        filledPixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        continue;
      }
      if (
        colBuf[idx - 1] !== null ||
        colBuf[idx + 1] !== null ||
        colBuf[idx - bufW] !== null ||
        colBuf[idx + bufW] !== null
      ) {
        outBuf[idx] = '#020617';
      }
    }
  }

  return {
    colors: outBuf,
    bounds: {
      width: bufW,
      height: bufH,
      filledPixels,
      minX,
      maxX,
      minY,
      maxY,
      soleCenterY: soleCount > 0 ? soleYSum / soleCount : baseY,
      collarCenterY: collarCount > 0 ? collarYSum / collarCount : minY,
    },
  };
}
