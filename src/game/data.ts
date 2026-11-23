import type { BrandLogoId } from './brandLogos';
import type {
  BenchSlotSpec,
  CameraAngleId,
  CompetitionInfo,
  FormationId,
  GameDifficulty,
  LightingPreset,
  PlayerRole,
  RivalryDefinition,
  SquadSlotSpec,
  StadiumTheme,
  TacticId,
  Team,
} from './types';

export const GAME_VERSION = 'v3.1.0';

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: 'v3.1.0',
    date: 'NOV 23, 2026',
    title: 'THE PITCH UPDATE · LONGER FIELD, THROUGH BALLS, 5 CAMERAS & TOTY/TOTS/FUTTIES',
    highlights: [
      'Significantly extended pitch length with dynamic broadcast camera tracking so goal nets sit far away across midfield from kickoff, paired with expanded wrap-around pitch-side & goal-line perimeter LED boards.',
      'Pitch-side perimeter LED showcase texts are now 30% transparent so every centered 360-degree rotating item remains clearly visible behind them.',
      'Every brand ad cycle now displays its authentic brand logo first before any 360-degree turntable item appears.',
      'Added Through Ball (Q / U / THRU) and Lofted Through Ball (R / I / L.THRU) controls led cleanly into space ahead of attacking runs.',
      'Added 5 selectable Camera Angles in the Pause Menu: Tele Broadcast, Tactical Wide, Pro Dynamic, Goal Net Look, and Pitchside Low.',
      'Added Ultimate Team TOTY & TOTY ICON (90-96-97), TOTS (87-98), and Pink-Background FUTTIES & FUTTIES ICON (93-99) cards, promo packs, plus exclusive Ultimate Team pitch-side perimeter LED ads.',
    ],
  },
  {
    version: 'v3.0.0',
    date: 'NOV 23, 2026',
    title: 'BIGGEST UPDATE EVER · ULTIMATE TEAM, 11V11 IN EVERY MODE & LED REWORK',
    highlights: [
      'Full 11v11 gameplay added across EVERY gamemode (League, King Champion Cup, Super Cup, Anime King Cup, Singleplayer Tournament, Rivalries, and Ultimate Team) with 4-3-3, 4-4-2, 3-5-2, and 4-2-3-1 formations plus 7-player benches.',
      'Launched CAAYVG Ultimate Team mode: animated Pack Openings with Walkout reveals, Bronze/Silver/Gold/TOTW/Hero/Icon cards with full attribute ratings, 11-slot Your Team XI & Chemistry builder, 11-round FUT Draft, and Division Rivals ladder.',
      'Pitch-side perimeter LED brand logos now fly straight downward in 0.7 seconds instead of disappearing.',
      'Every 360-degree turntable item is now centered in the middle of the LED strip behind normal-sized LED texts and lasts for 10 full seconds.',
      'Every 1.5 seconds, the 360-degree rotating items, flavors, names, AND pitch-side LED background colors + 35 random shape patterns switch dynamically.',
    ],
  },
  {
    version: 'v2.9.0',
    date: 'NOV 23, 2026',
    title: '35 NEW LED SHAPE PATTERNS, REAL BRAND LOGOS & 2.1S DYNAMIC SHOWCASES',
    highlights: [
      'Added 35 brand-new randomly generated geometric shape patterns on the pitch-side perimeter LED boards.',
      'Fixed pitch-side perimeter LED text sizes back to full normal height with smooth marquee scrolling for longer names.',
      'Upgraded every pitch-side sponsor slot to display an authentic real brand logo sprite instead of generic club crests.',
      'Real brand logos now fly smoothly straight downward off the pitch-side perimeter LED boards over 1.0 second instead of abruptly disappearing.',
      'Every 2.1 seconds, 360-degree turntable items, flavors, things, colors, and display names randomly switch to fresh combinations.',
    ],
  },
  {
    version: 'v2.6.27',
    date: 'NOV 2026',
    title: '360° ITEMS, NEW SODA FLAVORS, DIFFICULTY & MATCH HUB',
    highlights: [
      'Added full in-game Changelog viewer accessible from the Title Screen and 42-Club Hub.',
      'Non-shoe pitch-side LED sponsors now showcase their own 360-degree turntable 3D items (trophies, balls, controllers, snacks, burgers, cups, crowns, gems, bolts, airplanes) while Nike, Adidas ("F50 OR PREDATOR!"), and Puma exclusively spin their signature shoes.',
      'Added Coca-Cola and 7Up 360-degree turntable soda cans to pitch-side perimeter LED boards alongside Kinza and Code Red ("TAKE THE RIGHT STEPS!").',
      'New flavor editions & any-color 360-degree turntable soda cans for Coca-Cola, 7Up, Kinza, and Code Red across all stadium LED flanks.',
      'Added Difficulty selector (Amateur, Pro, World Class, Legendary) & Match Half Length selector (45S/H up to 180S/H).',
      'Every match rotates to a random stadium across 16 arenas, while Tournament Finals always take place at King Abdullah Sports City Stadium.',
      'CAAYVG League hides Cups & Groups; Tournament modes hide League Fixtures & League Tables.',
      'Updated non-Clásico rivalries (Wii Party Derby, Creator Clash, Toon Showdown, Metro Fire Derby) with per-match randomized LED animations & slogans; Brazil FC vs Glitter Force remains THE CLÁSICO.',
    ],
  },
  {
    version: 'v2.6.0',
    date: 'OCT 2026',
    title: '42 CLUBS, 16 STADIUMS & 3D TURNTABLES',
    highlights: [
      'Expanded to 42 total clubs (21 CAAYVG Premier + 21 Expansion Division) with Top-4 promotion & R38 Grand Finale.',
      'Added King Champion Cup, Super Cup, Anime King Champion Cup, and Singleplayer 16-Team Tournament.',
      'Launched 12-second flank brand LED timeline & 23-second middle competition/bilingual city LED cycle.',
    ],
  },
  {
    version: 'v2.5.0',
    date: 'SEP 2026',
    title: '3D CUTSCENES, REPLAYS & SET PIECES',
    highlights: [
      'Added Three.js 20s 3D Stadium Intro, Goal Celebration cutscenes, Instant Replays, Penalty Shootouts, and Trophy Ceremonies.',
      'Implemented 7v7 arcade pitch physics, formations (2-2-2 / 3-2-1 / 1-3-2 / 2-1-3), and live substitutions.',
    ],
  },
];

export interface DifficultyOption {
  id: GameDifficulty;
  label: string;
  shortLabel: string;
  description: string;
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { id: 'easy', label: 'AMATEUR', shortLabel: 'EASY', description: 'Relaxed AI pace & softer keeper' },
  { id: 'normal', label: 'PRO', shortLabel: 'PRO', description: 'Balanced 8-bit arcade challenge' },
  { id: 'hard', label: 'WORLD CLASS', shortLabel: 'HARD', description: 'Tighter press, sharper shots & quicker GK' },
  { id: 'legendary', label: 'LEGENDARY', shortLabel: 'LEGEND', description: 'Relentless AI pressing & lethal finishing' },
];

export interface MatchLengthOption {
  halfSeconds: number;
  label: string;
  shortLabel: string;
}

export const MATCH_LENGTH_OPTIONS: MatchLengthOption[] = [
  { halfSeconds: 45, label: '90S TOTAL (45S/HALF)', shortLabel: '45S/H' },
  { halfSeconds: 60, label: '2 MIN (60S/HALF)', shortLabel: '60S/H' },
  { halfSeconds: 90, label: '3 MIN (90S/HALF)', shortLabel: '90S/H' },
  { halfSeconds: 120, label: '4 MIN (120S/HALF)', shortLabel: '120S/H' },
  { halfSeconds: 180, label: '6 MIN (180S/HALF)', shortLabel: '180S/H' },
];

export interface CameraAngleOption {
  id: CameraAngleId;
  label: string;
  shortDesc: string;
}

export const CAMERA_ANGLES: CameraAngleOption[] = [
  { id: 'tele_broadcast', label: 'TELE BROADCAST', shortDesc: 'Balanced follow & forward look' },
  { id: 'tactical_wide', label: 'TACTICAL WIDE', shortDesc: 'Zoomed out midfield radar view' },
  { id: 'pro_dynamic', label: 'PRO DYNAMIC', shortDesc: 'Close-up dribble action zoom' },
  { id: 'end_to_end', label: 'GOAL NET LOOK', shortDesc: 'Leads ahead toward attacking goal' },
  { id: 'pitchside_low', label: 'PITCHSIDE LOW', shortDesc: 'Touchline broadcast angle' },
];

export const COMPETITIONS: CompetitionInfo[] = [
  {
    id: 'league',
    title: 'CAAYVG LEAGUE',
    season: '26/27',
    subtitle: '21-Club Championship Season',
    formatLabel: '21 TEAMS · LEAGUE',
    teamCount: 21,
    accentColor: '#34b233',
    badgeTextColor: '#34b233',
    isKnockout: false,
  },
  {
    id: 'king_cup',
    title: 'CAAYVG KING CHAMPION CUP',
    season: '26/27',
    subtitle: '16-Club Knockout Gauntlet',
    formatLabel: '16 TEAMS · KNOCKOUT',
    teamCount: 16,
    accentColor: '#facc15',
    badgeTextColor: '#facc15',
    isKnockout: true,
  },
  {
    id: 'super_cup',
    title: 'CAAYVG SUPER CUP',
    season: '26/27',
    subtitle: 'League Champ vs King Cup Winner',
    formatLabel: 'FINAL · TUNNEL BALL',
    teamCount: 2,
    accentColor: '#ef4444',
    badgeTextColor: '#facc15',
    isKnockout: true,
  },
  {
    id: 'anime_cup',
    title: 'CAAYVG ANIME KING CHAMPION CUP',
    season: '26/27',
    subtitle: '8-Club Cosmic Rainbow Cup',
    formatLabel: '8 TEAMS · COSMIC CUP',
    teamCount: 8,
    accentColor: '#f472b6',
    badgeTextColor: '#fde047',
    isKnockout: true,
  },
];

// Original 21 teams for the CAAYVG League 26/27
export const LEAGUE_TEAMS: Team[] = [
  { id: 'cgy-united', name: 'CAAYVG United', shortCode: 'CVU', division: 'premier', primaryColor: '#16a34a', secondaryColor: '#0a1440', trimColor: '#facc15', crest: 'shield', attack: 86, defense: 84, speed: 85, homeStadiumId: 'caayvg-bowl' },
  { id: 'metro-blazers', name: 'Metro Blazers', shortCode: 'MTB', division: 'premier', primaryColor: '#dc2626', secondaryColor: '#111827', trimColor: '#ffffff', crest: 'flame', attack: 85, defense: 81, speed: 86, homeStadiumId: 'rage-pit' },
  { id: 'outpost-marathon', name: 'Outpost Marathon', shortCode: 'OPM', division: 'premier', primaryColor: '#eab308', secondaryColor: '#09090b', trimColor: '#fde047', crest: 'target', attack: 88, defense: 82, speed: 84, homeStadiumId: 'caayvg-bowl' },
  { id: 'perimeter-fc', name: 'Perimeter Rovers', shortCode: 'PRV', division: 'premier', primaryColor: '#ef4444', secondaryColor: '#facc15', trimColor: '#ffffff', crest: 'wings', attack: 84, defense: 83, speed: 83, homeStadiumId: 'poofesure-park' },
  { id: 'cryo-archive', name: 'Cryo Archive', shortCode: 'CRY', division: 'premier', primaryColor: '#38bdf8', secondaryColor: '#312e81', trimColor: '#fde047', crest: 'crystal', attack: 87, defense: 85, speed: 88, homeStadiumId: 'snowpeak-dome' },
  { id: 'nova-striker', name: 'Nova Strikers', shortCode: 'NVS', division: 'premier', primaryColor: '#7c3aed', secondaryColor: '#1e1b4b', trimColor: '#f472b6', crest: 'orbit', attack: 83, defense: 79, speed: 85, homeStadiumId: 'cosmic-orbit' },
  { id: 'cobalt-athletic', name: 'Cobalt Athletic', shortCode: 'CBA', division: 'premier', primaryColor: '#2563eb', secondaryColor: '#0f172a', trimColor: '#93c5fd', crest: 'shield', attack: 80, defense: 84, speed: 80 },
  { id: 'iron-forge', name: 'Iron Forge FC', shortCode: 'IRF', division: 'premier', primaryColor: '#52525b', secondaryColor: '#18181b', trimColor: '#f97316', crest: 'crown', attack: 79, defense: 85, speed: 77 },
  { id: 'emerald-harbor', name: 'Emerald Harbor', shortCode: 'EMH', division: 'premier', primaryColor: '#10b981', secondaryColor: '#064e3b', trimColor: '#ecfdf5', crest: 'diamond', attack: 81, defense: 80, speed: 82 },
  { id: 'crimson-dynamo', name: 'Crimson Dynamo', shortCode: 'CRD', division: 'premier', primaryColor: '#991b1b', secondaryColor: '#450a0a', trimColor: '#fbbf24', crest: 'bolt', attack: 82, defense: 78, speed: 81 },
  { id: 'solar-flares', name: 'Solar Flares', shortCode: 'SLF', division: 'premier', primaryColor: '#f97316', secondaryColor: '#7c2d12', trimColor: '#fef08a', crest: 'star', attack: 84, defense: 77, speed: 86 },
  { id: 'pixel-albion', name: 'Pixel Albion', shortCode: 'PXB', division: 'premier', primaryColor: '#0284c7', secondaryColor: '#f8fafc', trimColor: '#0f172a', crest: 'stripes', attack: 78, defense: 81, speed: 79 },
  { id: 'starlight-city', name: 'Starlight City', shortCode: 'SLC', division: 'premier', primaryColor: '#ec4899', secondaryColor: '#500724', trimColor: '#f9a8d4', crest: 'star', attack: 82, defense: 76, speed: 84 },
  { id: 'thunder-vale', name: 'Thunder Vale', shortCode: 'THV', division: 'premier', primaryColor: '#4f46e5', secondaryColor: '#090d26', trimColor: '#fde047', crest: 'bolt', attack: 79, defense: 80, speed: 81 },
  { id: 'amber-lions', name: 'Amber Lions', shortCode: 'AML', division: 'premier', primaryColor: '#d97706', secondaryColor: '#292524', trimColor: '#fde68a', crest: 'crown', attack: 80, defense: 79, speed: 80 },
  { id: 'frostbite-sc', name: 'Frostbite SC', shortCode: 'FRB', division: 'premier', primaryColor: '#06b6d4', secondaryColor: '#083344', trimColor: '#ffffff', crest: 'crystal', attack: 77, defense: 82, speed: 78 },
  { id: 'obsidian-kings', name: 'Obsidian Kings', shortCode: 'OBK', division: 'premier', primaryColor: '#27272a', secondaryColor: '#000000', trimColor: '#facc15', crest: 'crown', attack: 81, defense: 81, speed: 79 },
  { id: 'arcade-wanderers', name: 'Arcade Wanderers', shortCode: 'ACW', division: 'premier', primaryColor: '#84cc16', secondaryColor: '#1a2e05', trimColor: '#ecfccb', crest: 'target', attack: 76, defense: 75, speed: 83 },
  { id: 'velvet-rangers', name: 'Velvet Rangers', shortCode: 'VLR', division: 'premier', primaryColor: '#a855f7', secondaryColor: '#2e1065', trimColor: '#f5d0fe', crest: 'wings', attack: 78, defense: 77, speed: 80 },
  { id: 'granite-port', name: 'Granite Port', shortCode: 'GRP', division: 'premier', primaryColor: '#64748b', secondaryColor: '#0f172a', trimColor: '#38bdf8', crest: 'shield', attack: 74, defense: 80, speed: 75 },
  { id: 'neon-comet', name: 'Neon Comet FC', shortCode: 'NCM', division: 'premier', primaryColor: '#14b8a6', secondaryColor: '#042f2e', trimColor: '#f43f5e', crest: 'orbit', attack: 77, defense: 74, speed: 85 },
];

// 21 Brand-New Expansion Clubs (total = 42 clubs!)
export const EXPANSION_TEAMS: Team[] = [
  { id: 'brazil-fc', name: 'Brazil FC', shortCode: 'BRZ', division: 'expansion', primaryColor: '#facc15', secondaryColor: '#ec4899', trimColor: '#f472b6', crest: 'diamond', attack: 91, defense: 83, speed: 90, homeStadiumId: 'maracana-pixel' },
  { id: 'glitter-force', name: 'Glitter Force', shortCode: 'GLF', division: 'expansion', primaryColor: '#f97316', secondaryColor: '#ea580c', trimColor: '#fed7aa', crest: 'star', attack: 89, defense: 84, speed: 89, homeStadiumId: 'glitter-dome' },
  { id: 'gamer-rage-fc', name: 'Gamer Rage FC', shortCode: 'GMR', division: 'expansion', primaryColor: '#dc2626', secondaryColor: '#09090b', trimColor: '#22d3ee', crest: 'bolt', attack: 87, defense: 79, speed: 88, homeStadiumId: 'rage-pit' },
  { id: 'teen-titans-go', name: 'Teen Titans Go', shortCode: 'TTG', division: 'expansion', primaryColor: '#3b82f6', secondaryColor: '#7c3aed', trimColor: '#facc15', crest: 'shield', attack: 86, defense: 85, speed: 87, homeStadiumId: 'jump-city-tower' },
  { id: 'pghlfilms-fans', name: 'Pghlfilms Fans', shortCode: 'PGH', division: 'expansion', primaryColor: '#22c55e', secondaryColor: '#1e293b', trimColor: '#fde047', crest: 'orbit', attack: 84, defense: 81, speed: 86, homeStadiumId: 'cosmic-orbit' },
  { id: 'avocadoplayz-fc', name: 'Avocadoplayz FC', shortCode: 'AVO', division: 'expansion', primaryColor: '#65a30d', secondaryColor: '#365314', trimColor: '#bef264', crest: 'target', attack: 83, defense: 82, speed: 84, homeStadiumId: 'wii-colosseum' },
  { id: 'barcewiiparty', name: 'Barcewiiparty', shortCode: 'BWP', division: 'expansion', primaryColor: '#1d4ed8', secondaryColor: '#b91c1c', trimColor: '#facc15', crest: 'stripes', attack: 88, defense: 83, speed: 85, homeStadiumId: 'wii-colosseum' },
  { id: 'real-poofesurerid', name: 'Real Poofesurerid', shortCode: 'RPF', division: 'expansion', primaryColor: '#f8fafc', secondaryColor: '#f97316', trimColor: '#facc15', crest: 'crown', attack: 87, defense: 82, speed: 86, homeStadiumId: 'poofesure-park' },
  { id: 'cartoon-fateen', name: 'كرتون فطين', shortCode: 'FTN', division: 'expansion', primaryColor: '#0d9488', secondaryColor: '#fef08a', trimColor: '#ef4444', crest: 'crescent', attack: 85, defense: 84, speed: 85, homeStadiumId: 'fateen-oasis' },
  { id: 'samba-waves', name: 'Samba Waves', shortCode: 'SMW', division: 'expansion', primaryColor: '#059669', secondaryColor: '#fef08a', trimColor: '#ffffff', crest: 'diamond', attack: 82, defense: 78, speed: 85 },
  { id: 'sparkle-hearts', name: 'Sparkle Hearts', shortCode: 'SPH', division: 'expansion', primaryColor: '#ec4899', secondaryColor: '#831843', trimColor: '#fde047', crest: 'star', attack: 81, defense: 79, speed: 84 },
  { id: 'pixel-dojo', name: 'Pixel Dojo', shortCode: 'PXD', division: 'expansion', primaryColor: '#ef4444', secondaryColor: '#ffffff', trimColor: '#111827', crest: 'flame', attack: 83, defense: 80, speed: 82 },
  { id: 'turbo-kart-sc', name: 'Turbo Kart SC', shortCode: 'TKS', division: 'expansion', primaryColor: '#0ea5e9', secondaryColor: '#facc15', trimColor: '#ef4444', crest: 'wings', attack: 80, defense: 78, speed: 88 },
  { id: 'slime-kings', name: 'Slime Kings FC', shortCode: 'SLK', division: 'expansion', primaryColor: '#84cc16', secondaryColor: '#0f172a', trimColor: '#a3e635', crest: 'crown', attack: 79, defense: 82, speed: 78 },
  { id: 'retro-knights', name: 'Retro Knights', shortCode: 'RTK', division: 'expansion', primaryColor: '#6366f1', secondaryColor: '#1e1b4b', trimColor: '#e2e8f0', crest: 'shield', attack: 80, defense: 84, speed: 77 },
  { id: 'hyper-dribble', name: 'Hyper Dribble', shortCode: 'HYD', division: 'expansion', primaryColor: '#f43f5e', secondaryColor: '#4c0519', trimColor: '#fda4af', crest: 'bolt', attack: 84, defense: 75, speed: 89 },
  { id: 'cosmic-phoenix', name: 'Cosmic Phoenix', shortCode: 'CPX', division: 'expansion', primaryColor: '#f97316', secondaryColor: '#3b0764', trimColor: '#fde047', crest: 'flame', attack: 85, defense: 79, speed: 84 },
  { id: 'shadow-ninjas', name: 'Shadow Ninjas', shortCode: 'SHN', division: 'expansion', primaryColor: '#334155', secondaryColor: '#020617', trimColor: '#38bdf8', crest: 'crescent', attack: 81, defense: 83, speed: 86 },
  { id: 'golden-mangos', name: 'Golden Mangos', shortCode: 'GMG', division: 'expansion', primaryColor: '#f59e0b', secondaryColor: '#166534', trimColor: '#fef9c3', crest: 'target', attack: 79, defense: 77, speed: 83 },
  { id: 'galaxy-rangers', name: 'Galaxy Rangers', shortCode: 'GLR', division: 'expansion', primaryColor: '#8b5cf6', secondaryColor: '#09090b', trimColor: '#67e8f9', crest: 'orbit', attack: 82, defense: 81, speed: 82 },
  { id: 'ultra-legends', name: 'Ultra Legends', shortCode: 'ULG', division: 'expansion', primaryColor: '#14b8a6', secondaryColor: '#111827', trimColor: '#facc15', crest: 'wings', attack: 85, defense: 84, speed: 83 },
];

export const ALL_TEAMS: Team[] = [...LEAGUE_TEAMS, ...EXPANSION_TEAMS];

export const RIVALRIES: RivalryDefinition[] = [
  {
    id: 'the-clasico',
    title: 'THE CLÁSICO',
    teamAId: 'brazil-fc',
    teamBId: 'glitter-force',
    stadiumId: 'maracana-pixel',
  },
  {
    id: 'wii-clasico',
    title: 'WII PARTY DERBY',
    teamAId: 'barcewiiparty',
    teamBId: 'real-poofesurerid',
    stadiumId: 'wii-colosseum',
  },
  {
    id: 'creator-clasico',
    title: 'CREATOR CLASH',
    teamAId: 'gamer-rage-fc',
    teamBId: 'pghlfilms-fans',
    stadiumId: 'rage-pit',
  },
  {
    id: 'toon-clasico',
    title: 'TOON SHOWDOWN',
    teamAId: 'teen-titans-go',
    teamBId: 'cartoon-fateen',
    stadiumId: 'jump-city-tower',
  },
  {
    id: 'caayvg-clasico',
    title: 'METRO FIRE DERBY',
    teamAId: 'cgy-united',
    teamBId: 'metro-blazers',
    stadiumId: 'caayvg-bowl',
  },
];

// 15 Selectable 8-Bit & Real-Inspired Stadiums
export const STADIUMS: StadiumTheme[] = [
  {
    id: 'caayvg-bowl',
    name: 'CAAYVG Classic Bowl',
    city: 'Pixel City',
    cityDisplay: 'Pixel City - مدينة البكسل',
    skyColor: '#090d1f',
    roofColor: '#111827',
    standColor: '#172036',
    standStripeColor: '#1e293b',
    turfA: '#1b7a32',
    turfB: '#218c3a',
    surroundColor: '#14532d',
    floodlightColor: '#fef9c3',
    turfPattern: 'vertical',
  },
  {
    id: 'maracana-pixel',
    name: 'Maracanã Pixel Arena',
    city: 'Rio',
    cityDisplay: 'Rio - ريو',
    skyColor: '#0c1938',
    roofColor: '#1e3a8a',
    standColor: '#14532d',
    standStripeColor: '#facc15',
    turfA: '#15803d',
    turfB: '#16a34a',
    surroundColor: '#064e3b',
    floodlightColor: '#fef08a',
    turfPattern: 'checker',
  },
  {
    id: 'glitter-dome',
    name: 'Glitter Starlight Dome',
    city: 'Rainbow Town',
    cityDisplay: 'Rainbow Town - مدينة قوس قزح',
    skyColor: '#2e0938',
    roofColor: '#581c87',
    standColor: '#4c0519',
    standStripeColor: '#f472b6',
    turfA: '#198754',
    turfB: '#20a064',
    surroundColor: '#14532d',
    floodlightColor: '#fbcfe8',
    turfPattern: 'horizontal',
  },
  {
    id: 'rage-pit',
    name: 'Rage Pit Stadium',
    city: 'Arcade Core',
    cityDisplay: 'Arcade Core - قلب الأركيد',
    skyColor: '#1c0505',
    roofColor: '#450a0a',
    standColor: '#270707',
    standStripeColor: '#dc2626',
    turfA: '#166534',
    turfB: '#1f7a3f',
    surroundColor: '#0f291e',
    floodlightColor: '#fca5a5',
    turfPattern: 'vertical',
  },
  {
    id: 'jump-city-tower',
    name: 'Jump City Tower Field',
    city: 'Jump City',
    cityDisplay: 'Jump City - مدينة القفز',
    skyColor: '#1e1b4b',
    roofColor: '#312e81',
    standColor: '#1e293b',
    standStripeColor: '#38bdf8',
    turfA: '#1d7845',
    turfB: '#249154',
    surroundColor: '#0f3d24',
    floodlightColor: '#67e8f9',
    turfPattern: 'checker',
  },
  {
    id: 'cosmic-orbit',
    name: 'Cosmic Orbit Arena',
    city: 'Low Orbit',
    cityDisplay: 'Low Orbit - المدار المنخفض',
    skyColor: '#03030c',
    roofColor: '#0f172a',
    standColor: '#111827',
    standStripeColor: '#a855f7',
    turfA: '#0f766e',
    turfB: '#14b8a6',
    surroundColor: '#042f2e',
    floodlightColor: '#e9d5ff',
    turfPattern: 'horizontal',
  },
  {
    id: 'wii-colosseum',
    name: 'Wii Party Colosseum',
    city: 'Wuhu Island',
    cityDisplay: 'Wuhu Island - جزيرة ووهو',
    skyColor: '#0c2d48',
    roofColor: '#1e40af',
    standColor: '#1d4ed8',
    standStripeColor: '#f8fafc',
    turfA: '#15803d',
    turfB: '#22c55e',
    surroundColor: '#166534',
    floodlightColor: '#ffffff',
    turfPattern: 'checker',
  },
  {
    id: 'poofesure-park',
    name: 'Poofesure Hardwood Park',
    city: 'Beef Boss City',
    cityDisplay: 'Beef Boss City - مدينة بيف بوس',
    skyColor: '#271306',
    roofColor: '#431407',
    standColor: '#292524',
    standStripeColor: '#f97316',
    turfA: '#3f6212',
    turfB: '#4d7c0f',
    surroundColor: '#1a2e05',
    floodlightColor: '#fed7aa',
    turfPattern: 'vertical',
  },
  {
    id: 'fateen-oasis',
    name: 'Fateen Oasis Stadium',
    city: 'Oasis Valley',
    cityDisplay: 'Oasis Valley - وادي الواحة',
    skyColor: '#042f2e',
    roofColor: '#115e59',
    standColor: '#134e4a',
    standStripeColor: '#fde047',
    turfA: '#15803d',
    turfB: '#10b981',
    surroundColor: '#064e3b',
    floodlightColor: '#fef08a',
    turfPattern: 'horizontal',
  },
  {
    id: 'snowpeak-dome',
    name: 'Snowpeak Cryo Dome',
    city: 'Cryo Ridge',
    cityDisplay: 'Cryo Ridge - قمة الجليد',
    skyColor: '#082f49',
    roofColor: '#0c4a6e',
    standColor: '#0f172a',
    standStripeColor: '#38bdf8',
    turfA: '#0d7377',
    turfB: '#14919b',
    surroundColor: '#083344',
    floodlightColor: '#bae6fd',
    turfPattern: 'vertical',
  },
  {
    id: 'sunset-harbor',
    name: 'Emerald Harbor Bowl',
    city: 'Harbor Bay',
    cityDisplay: 'Harbor Bay - خليج الميناء',
    skyColor: '#2a0e2e',
    roofColor: '#4a154b',
    standColor: '#1f2937',
    standStripeColor: '#10b981',
    turfA: '#166534',
    turfB: '#15803d',
    surroundColor: '#052e16',
    floodlightColor: '#fde68a',
    turfPattern: 'checker',
  },
  {
    id: 'prince-abdullah-alfaisal',
    name: 'Prince Abdullah Al-Faisal',
    city: 'Jeddah',
    cityDisplay: 'Jeddah - جدة',
    skyColor: '#38bdf8',
    roofColor: '#e2e8f0',
    standColor: '#78350f',
    standStripeColor: '#facc15',
    turfA: '#15803d',
    turfB: '#22c55e',
    surroundColor: '#14532d',
    floodlightColor: '#ffffff',
    turfPattern: 'horizontal',
    imageUrl: '/assets/aistudio/Prince_Abdullah_Al-Faisal_Sports_City_a6572112.jpg',
    archRoofStyle: 'white_canopy',
  },
  {
    id: 'al-jawhara',
    name: 'King Abdullah Sports City Stadium',
    city: 'Jeddah',
    cityDisplay: 'Jeddah - جدة',
    skyColor: '#05050a',
    roofColor: '#94a3b8',
    standColor: '#9a3412',
    standStripeColor: '#fb923c',
    turfA: '#166534',
    turfB: '#22c55e',
    surroundColor: '#064e3b',
    floodlightColor: '#f8fafc',
    turfPattern: 'vertical',
    imageUrl: '/assets/aistudio/Jawhara_Stadium_6659a0b6.jpg',
    archRoofStyle: 'lattice_arch',
  },
  {
    id: 'mohammed-bin-fahd',
    name: 'Prince Mohammed Bin Fahd',
    city: 'Dammam',
    cityDisplay: 'Dammam - الدمام',
    skyColor: '#030712',
    roofColor: '#1f2937',
    standColor: '#1e3a8a',
    standStripeColor: '#60a5fa',
    turfA: '#15803d',
    turfB: '#16a34a',
    surroundColor: '#14532d',
    floodlightColor: '#fde047',
    turfPattern: 'horizontal',
    imageUrl: '/assets/aistudio/Mohammed_Bin_Fahd_Stadium__Dammam__Saudi_Arabia_e68768cd.jpg',
    trackColor: '#7c2d12',
    archRoofStyle: 'track_dome',
  },
  {
    id: 'king-saud-univ',
    name: 'Al-Awwal Park',
    city: 'Riyadh',
    cityDisplay: 'Riyadh - الرياض',
    skyColor: '#bae6fd',
    roofColor: '#cbd5e1',
    standColor: '#ca8a04',
    standStripeColor: '#1e293b',
    turfA: '#16a34a',
    turfB: '#22c55e',
    surroundColor: '#14532d',
    floodlightColor: '#fef9c3',
    turfPattern: 'checker',
    imageUrl: '/assets/aistudio/Entire_King_Saud_University_Stadium_2910f860.jpg',
    archRoofStyle: 'gold_bowl',
  },
  {
    id: 'efootball-stadium',
    name: 'eFootball Stadium',
    city: 'eFootball City',
    cityDisplay: 'eFootball City - ملعب إي فوتبول',
    skyColor: '#00008b',
    roofColor: '#000070',
    standColor: '#020873',
    standStripeColor: '#facc15',
    turfA: '#15803d',
    turfB: '#16a34a',
    surroundColor: '#0b4f26',
    floodlightColor: '#38bdf8',
    turfPattern: 'checker',
    imageUrl: '/assets/aistudio/efootball-2025-color-design-v0-zxmdiknkeymd1_f2d50b57.jpeg',
    archRoofStyle: 'efootball_blocks',
  },
];

export const LIGHTING_PRESETS: LightingPreset[] = [
  { id: 'night_flood', name: 'Night Floodlights', ambientTint: '', floodBeamAlpha: 0.08, skyTint: '' },
  { id: 'golden_sunset', name: 'Golden Sunset', ambientTint: 'rgba(249, 115, 22, 0.12)', floodBeamAlpha: 0.11, skyTint: '#451a03' },
  { id: 'daylight', name: 'Bright Daylight', ambientTint: 'rgba(255, 255, 220, 0.09)', floodBeamAlpha: 0.02, skyTint: '#0284c7' },
  { id: 'neon_cosmic', name: 'Neon Cosmic', ambientTint: 'rgba(139, 92, 246, 0.15)', floodBeamAlpha: 0.14, skyTint: '#1e1b4b' },
  { id: 'storm_dusk', name: 'Stormy Dusk', ambientTint: 'rgba(15, 23, 42, 0.22)', floodBeamAlpha: 0.16, skyTint: '#020617' },
];

export type LedLogoKind =
  | 'can'
  | 'bottle'
  | 'shoe'
  | 'burger'
  | 'chip'
  | 'bolt'
  | 'ball'
  | 'controller'
  | 'cup'
  | 'star'
  | 'crown'
  | 'gem';

export const LED_EXTRA_ANIMATIONS = [
  'laser_sweep',
  'neon_eq',
  'starburst',
  'speed_arcs',
  'plasma_grid',
  'prism_shimmer',
  'confetti_rain',
  'radar_pulse',
  'turbo_stripes',
  'cyber_wave',
] as const;

export type LedExtraAnimationKind = (typeof LED_EXTRA_ANIMATIONS)[number];

export const LED_NEW_SHAPE_PATTERNS = [
  'diamonds_cascade',
  'hex_honeycomb',
  'spinning_triangles',
  'orbit_circles',
  'pixel_stars',
  'zigzag_chevrons',
  'crosshair_grid',
  'falling_tetrominoes',
  'spiral_squares',
  'bouncing_capsules',
  'concentric_rings',
  'sunburst_rays',
  'kaleidoscope_petals',
  'shield_crests',
  'comet_streaks',
  'octagon_pulse',
  'crescent_moons',
  'gear_cogs',
  'crystal_shards',
  'ribbon_helix',
  'halftone_waves',
  'diamond_lattice',
  'heart_spades',
  'pixel_crowns',
  'cyber_brackets',
  'meteor_rain',
  'arcade_blocks',
  'radar_arcs',
  'pinwheel_blades',
  'sine_bars',
  'isometric_cubes',
  'bowtie_ribbons',
  'polka_bounce',
  'lightning_zigs',
  'arrow_streams',
] as const;

export type LedNewShapePatternKind = (typeof LED_NEW_SHAPE_PATTERNS)[number];

export interface LedSponsorAd {
  id: string;
  brand: string;
  tagline: string;
  bgColor: string;
  fgColor: string;
  accentColor: string;
  animStyle: 'scroll' | 'flash' | 'chevron' | 'rainbow' | 'pulse' | 'wave';
  logoKind: LedLogoKind;
  brandLogo?: BrandLogoId;
}

// 13 Uploaded Brand Sponsors + Sodas & Items (30 core + 10 extra animated = 40 for League)
export const LED_SPONSOR_ADS: LedSponsorAd[] = [
  { id: 'lg-nike', brand: 'NIKE', tagline: 'JUST DO IT', bgColor: '#0f172a', fgColor: '#f97316', accentColor: '#ffffff', animStyle: 'flash', logoKind: 'shoe', brandLogo: 'nike' },
  { id: 'lg-adidas', brand: 'ADIDAS', tagline: 'F50 OR PREDATOR!', bgColor: '#050505', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'chevron', logoKind: 'shoe', brandLogo: 'adidas' },
  { id: 'code-red-lg', brand: 'CODE RED', tagline: 'TAKE THE RIGHT STEPS!', bgColor: '#b91c1c', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'pulse', logoKind: 'can', brandLogo: 'code_red' },
  { id: 'kinza-lg', brand: 'KINZA', tagline: 'TASTE THE SPARK!', bgColor: '#1b2f6e', fgColor: '#ffffff', accentColor: '#38bdf8', animStyle: 'wave', logoKind: 'can', brandLogo: 'kinza' },
  { id: 'lg-puma', brand: 'PUMA', tagline: 'FOREVER FASTER', bgColor: '#7f1d1d', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'wave', logoKind: 'shoe', brandLogo: 'puma' },
  { id: 'lg-jordan', brand: 'JORDAN', tagline: 'FLIGHT CLUB', bgColor: '#991b1b', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'pulse', logoKind: 'shoe', brandLogo: 'jordan' },
  { id: 'lg-reebok', brand: 'REEBOK', tagline: 'SPORT CLASSIC', bgColor: '#1e1b4b', fgColor: '#fde047', accentColor: '#38bdf8', animStyle: 'chevron', logoKind: 'star', brandLogo: 'reebok' },
  { id: 'lg-ua', brand: 'UNDER ARMOUR', tagline: 'PROTECT HOUSE', bgColor: '#18181b', fgColor: '#ffffff', accentColor: '#38bdf8', animStyle: 'pulse', logoKind: 'bolt', brandLogo: 'under_armour' },
  { id: 'lg-vans', brand: 'VANS', tagline: 'OFF THE WALL', bgColor: '#b91c1c', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'flash', logoKind: 'shoe', brandLogo: 'vans' },
  { id: 'lg-nb', brand: 'NEW BALANCE', tagline: 'WE GOT NOW', bgColor: '#1e293b', fgColor: '#facc15', accentColor: '#ef4444', animStyle: 'wave', logoKind: 'shoe', brandLogo: 'new_balance' },
  { id: 'lg-asics', brand: 'ASICS', tagline: 'SOUND MIND', bgColor: '#172554', fgColor: '#38bdf8', accentColor: '#ffffff', animStyle: 'pulse', logoKind: 'shoe', brandLogo: 'asics' },
  { id: 'lg-columbia', brand: 'COLUMBIA', tagline: 'TESTED TOUGH', bgColor: '#064e3b', fgColor: '#ffffff', accentColor: '#38bdf8', animStyle: 'chevron', logoKind: 'gem', brandLogo: 'columbia' },
  { id: 'lg-converse', brand: 'CONVERSE', tagline: 'ALL STAR PRO', bgColor: '#111827', fgColor: '#fef08a', accentColor: '#ef4444', animStyle: 'flash', logoKind: 'star', brandLogo: 'converse' },
  { id: 'pepsi-max', brand: 'PEPSI MAX', tagline: 'SODA RUSH', bgColor: '#0a195c', fgColor: '#ffffff', accentColor: '#ef4444', animStyle: 'pulse', logoKind: 'can' },
  { id: 'coca-cola-lg', brand: 'COCA-COLA', tagline: 'TASTE THE FEELING!', bgColor: '#dc2626', fgColor: '#ffffff', accentColor: '#f8fafc', animStyle: 'flash', logoKind: 'can', brandLogo: 'coca_cola' },
  { id: 'sprite-ice', brand: 'SPRITE', tagline: 'LEMON LIME', bgColor: '#15803d', fgColor: '#fef08a', accentColor: '#38bdf8', animStyle: 'wave', logoKind: 'can' },
  { id: 'fanta-pop', brand: 'FANTA', tagline: 'ORANGE BOOM', bgColor: '#c2410c', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'chevron', logoKind: 'bottle' },
  { id: 'mtn-dew', brand: 'MTN DEW', tagline: 'GAMER FUEL', bgColor: '#14532d', fgColor: '#a3e635', accentColor: '#ef4444', animStyle: 'flash', logoKind: 'can' },
  { id: 'seven-up', brand: '7UP', tagline: 'CRISP SODA', bgColor: '#166534', fgColor: '#ffffff', accentColor: '#ef4444', animStyle: 'chevron', logoKind: 'can', brandLogo: 'seven_up' },
  { id: 'prime-hydr', brand: 'PRIME', tagline: 'HYDRATION', bgColor: '#0284c7', fgColor: '#ffffff', accentColor: '#f43f5e', animStyle: 'rainbow', logoKind: 'bottle' },
  { id: 'gatorade-lg', brand: 'GATORADE', tagline: 'THIRST QUENCH', bgColor: '#b45309', fgColor: '#fef08a', accentColor: '#22c55e', animStyle: 'flash', logoKind: 'bolt' },
  { id: 'powerade-lg', brand: 'POWERADE', tagline: 'ION4 POWER', bgColor: '#1e3a8a', fgColor: '#38bdf8', accentColor: '#ffffff', animStyle: 'wave', logoKind: 'bottle' },
  { id: 'red-bull-lg', brand: 'RED BULL', tagline: 'WINGS', bgColor: '#172554', fgColor: '#facc15', accentColor: '#ef4444', animStyle: 'chevron', logoKind: 'can' },
  { id: 'monster-en', brand: 'MONSTER', tagline: 'UNLEASH', bgColor: '#09090b', fgColor: '#4ade80', accentColor: '#a3e635', animStyle: 'pulse', logoKind: 'bolt' },
  { id: 'doritos', brand: 'DORITOS', tagline: 'BOLD NACHO', bgColor: '#991b1b', fgColor: '#facc15', accentColor: '#f97316', animStyle: 'chevron', logoKind: 'chip' },
  { id: 'lays-gold', brand: 'LAYS', tagline: 'CLASSIC SALT', bgColor: '#eab308', fgColor: '#7f1d1d', accentColor: '#ffffff', animStyle: 'pulse', logoKind: 'chip' },
  { id: 'pringles', brand: 'PRINGLES', tagline: 'POP SNACK', bgColor: '#b91c1c', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'wave', logoKind: 'can' },
  { id: 'snickers', brand: 'SNICKERS', tagline: 'PLAY HUNGRY', bgColor: '#292524', fgColor: '#ffffff', accentColor: '#38bdf8', animStyle: 'flash', logoKind: 'chip' },
  { id: 'razer-g', brand: 'RAZER', tagline: 'FOR GAMERS', bgColor: '#052e16', fgColor: '#4ade80', accentColor: '#22c55e', animStyle: 'wave', logoKind: 'controller' },
  { id: 'nintendo', brand: 'NINTENDO', tagline: 'SUPER PLAY', bgColor: '#b91c1c', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'rainbow', logoKind: 'controller' },
  // +10 Extra Animated Pitch-Side LED Sponsors
  { id: 'aramco', brand: 'ARAMCO', tagline: 'POWERING PLAY', bgColor: '#064e3b', fgColor: '#38bdf8', accentColor: '#4ade80', animStyle: 'wave', logoKind: 'gem' },
  { id: 'stc-pay', brand: 'STC', tagline: '5G SPEED', bgColor: '#3b0764', fgColor: '#ffffff', accentColor: '#f43f5e', animStyle: 'pulse', logoKind: 'bolt' },
  { id: 'saudia', brand: 'SAUDIA', tagline: 'FLY TO GLORY', bgColor: '#14532d', fgColor: '#fde047', accentColor: '#ffffff', animStyle: 'chevron', logoKind: 'star' },
  { id: 'riyadh-air', brand: 'RIYADH AIR', tagline: 'FUTURE SKIES', bgColor: '#311042', fgColor: '#e879f9', accentColor: '#facc15', animStyle: 'rainbow', logoKind: 'crown' },
  { id: 'almarai', brand: 'ALMARAI', tagline: 'FRESH ENERGY', bgColor: '#1e3a8a', fgColor: '#ffffff', accentColor: '#34d399', animStyle: 'scroll', logoKind: 'cup' },
  { id: 'suntop', brand: 'SUNTOP', tagline: 'CITRUS BLAST', bgColor: '#ea580c', fgColor: '#fef08a', accentColor: '#22c55e', animStyle: 'flash', logoKind: 'bottle' },
  { id: 'visit-saudi', brand: 'VISIT SAUDI', tagline: 'WELCOME HOME', bgColor: '#0f172a', fgColor: '#facc15', accentColor: '#a855f7', animStyle: 'rainbow', logoKind: 'star' },
  { id: 'roshn', brand: 'ROSHN', tagline: 'LEAGUE PRO', bgColor: '#065f46', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'chevron', logoKind: 'ball' },
  { id: 'snack-att', brand: 'SNACK ATTACK', tagline: 'PIXEL CRUNCH', bgColor: '#7c2d12', fgColor: '#fde047', accentColor: '#ef4444', animStyle: 'pulse', logoKind: 'chip' },
  { id: 'turbo-kick', brand: 'TURBO KICK', tagline: 'STRIKER GEAR', bgColor: '#991b1b', fgColor: '#ffffff', accentColor: '#38bdf8', animStyle: 'wave', logoKind: 'shoe' },
];

export const EXTRA_ANIMATED_SPONSORS: LedSponsorAd[] = LED_SPONSOR_ADS.slice(30);

// Core 14 Cup LED Sponsors featuring all uploaded brand logos
export const CUP_LED_SPONSOR_ADS: LedSponsorAd[] = [
  { id: 'nike', brand: 'NIKE', tagline: 'JUST DO IT', bgColor: '#111827', fgColor: '#f97316', accentColor: '#ffffff', animStyle: 'flash', logoKind: 'shoe', brandLogo: 'nike' },
  { id: 'adidas', brand: 'ADIDAS', tagline: 'F50 OR PREDATOR!', bgColor: '#050505', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'chevron', logoKind: 'shoe', brandLogo: 'adidas' },
  { id: 'code-red', brand: 'CODE RED', tagline: 'TAKE THE RIGHT STEPS!', bgColor: '#b91c1c', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'pulse', logoKind: 'can', brandLogo: 'code_red' },
  { id: 'kinza', brand: 'KINZA', tagline: 'TASTE THE SPARK!', bgColor: '#1b2f6e', fgColor: '#ffffff', accentColor: '#38bdf8', animStyle: 'wave', logoKind: 'can', brandLogo: 'kinza' },
  { id: 'puma', brand: 'PUMA', tagline: 'FOREVER FASTER', bgColor: '#09090b', fgColor: '#f43f5e', accentColor: '#ffffff', animStyle: 'chevron', logoKind: 'shoe', brandLogo: 'puma' },
  { id: 'jordan', brand: 'JORDAN', tagline: 'FLIGHT CLUB', bgColor: '#991b1b', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'pulse', logoKind: 'shoe', brandLogo: 'jordan' },
  { id: 'reebok', brand: 'REEBOK', tagline: 'CLASSIC TURF', bgColor: '#1e1b4b', fgColor: '#fde047', accentColor: '#38bdf8', animStyle: 'wave', logoKind: 'star', brandLogo: 'reebok' },
  { id: 'under-armour', brand: 'UNDER ARMOUR', tagline: 'PROTECT HOUSE', bgColor: '#18181b', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'chevron', logoKind: 'bolt', brandLogo: 'under_armour' },
  { id: 'vans', brand: 'VANS', tagline: 'OFF THE WALL', bgColor: '#7f1d1d', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'flash', logoKind: 'shoe', brandLogo: 'vans' },
  { id: 'new-balance', brand: 'NEW BALANCE', tagline: 'CHAMPION RUN', bgColor: '#27272a', fgColor: '#facc15', accentColor: '#ef4444', animStyle: 'flash', logoKind: 'shoe', brandLogo: 'new_balance' },
  { id: 'asics', brand: 'ASICS', tagline: 'SOUND MIND', bgColor: '#172554', fgColor: '#38bdf8', accentColor: '#ffffff', animStyle: 'pulse', logoKind: 'shoe', brandLogo: 'asics' },
  { id: 'columbia', brand: 'COLUMBIA', tagline: 'TESTED TOUGH', bgColor: '#064e3b', fgColor: '#ffffff', accentColor: '#38bdf8', animStyle: 'chevron', logoKind: 'gem', brandLogo: 'columbia' },
  { id: 'converse', brand: 'CONVERSE', tagline: 'ALL STAR PRO', bgColor: '#0f172a', fgColor: '#fef08a', accentColor: '#ef4444', animStyle: 'pulse', logoKind: 'star', brandLogo: 'converse' },
  { id: 'coca-cola', brand: 'COCA-COLA', tagline: 'TASTE THE FEELING!', bgColor: '#dc2626', fgColor: '#ffffff', accentColor: '#f8fafc', animStyle: 'flash', logoKind: 'can', brandLogo: 'coca_cola' },
  { id: 'seven-up-cup', brand: '7UP', tagline: 'CRISP SODA', bgColor: '#166534', fgColor: '#ffffff', accentColor: '#ef4444', animStyle: 'chevron', logoKind: 'can', brandLogo: 'seven_up' },
  { id: 'gatorade', brand: 'GATORADE', tagline: 'FUEL THE GAME', bgColor: '#c2410c', fgColor: '#fef08a', accentColor: '#22c55e', animStyle: 'flash', logoKind: 'bottle' },
];

// +10 more logos for CAAYVG King Champion Cup
export const KING_CUP_EXTRA_SPONSORS: LedSponsorAd[] = [
  { id: 'umbro', brand: 'UMBRO', tagline: 'DIAMOND PITCH', bgColor: '#09090b', fgColor: '#facc15', accentColor: '#ffffff', animStyle: 'chevron', logoKind: 'gem' },
  { id: 'kappa', brand: 'KAPPA', tagline: 'KING STYLE', bgColor: '#7f1d1d', fgColor: '#fde047', accentColor: '#ffffff', animStyle: 'pulse', logoKind: 'crown' },
  { id: 'mizuno', brand: 'MIZUNO', tagline: 'PRECISION KICK', bgColor: '#1e3a8a', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'wave', logoKind: 'shoe' },
  { id: 'playstation', brand: 'PLAYSTATION', tagline: 'PLAY HAS NO LIMITS', bgColor: '#1d4ed8', fgColor: '#ffffff', accentColor: '#38bdf8', animStyle: 'pulse', logoKind: 'controller' },
  { id: 'mastercard', brand: 'MASTERCARD', tagline: 'PRICELESS CUP', bgColor: '#18181b', fgColor: '#fb923c', accentColor: '#ef4444', animStyle: 'rainbow', logoKind: 'ball' },
  { id: 'joma', brand: 'JOMA SPORT', tagline: 'KING CUP PRO', bgColor: '#064e3b', fgColor: '#fef08a', accentColor: '#34d399', animStyle: 'pulse', logoKind: 'ball' },
  { id: 'lotto', brand: 'LOTTO', tagline: 'ITALIA CLEATS', bgColor: '#14532d', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'flash', logoKind: 'shoe' },
  { id: 'qatar-air', brand: 'QATAR AIRWAYS', tagline: 'OFFICIAL PARTNER', bgColor: '#500724', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'scroll', logoKind: 'crown' },
  { id: 'hublot', brand: 'HUBLOT', tagline: 'MATCH CLOCK', bgColor: '#09090b', fgColor: '#facc15', accentColor: '#94a3b8', animStyle: 'pulse', logoKind: 'crown' },
  { id: 'ea-sports', brand: 'EA SPORTS', tagline: 'IT IS IN GAME', bgColor: '#1e293b', fgColor: '#fde047', accentColor: '#ef4444', animStyle: 'rainbow', logoKind: 'controller' },
];

// +5 more logos for CAAYVG Super Cup
export const SUPER_CUP_EXTRA_SPONSORS: LedSponsorAd[] = [
  { id: 'super-energy', brand: 'SUPER ENERGY', tagline: 'FINAL VOLTAGE', bgColor: '#b91c1c', fgColor: '#fde047', accentColor: '#ffffff', animStyle: 'pulse', logoKind: 'bolt' },
  { id: 'trophy-gold', brand: 'TROPHY GOLD', tagline: 'CHAMPIONS', bgColor: '#854d0e', fgColor: '#fef08a', accentColor: '#ef4444', animStyle: 'flash', logoKind: 'crown' },
  { id: 'apex-cleats', brand: 'APEX CLEATS', tagline: 'SUPER GRIP', bgColor: '#7f1d1d', fgColor: '#ffffff', accentColor: '#facc15', animStyle: 'chevron', logoKind: 'shoe' },
  { id: 'crown-cola', brand: 'CROWN COLA', tagline: 'FINAL SIP', bgColor: '#991b1b', fgColor: '#facc15', accentColor: '#ffffff', animStyle: 'wave', logoKind: 'can' },
  { id: 'turbo-mint', brand: 'TURBO MINT', tagline: 'SUPER FRESH', bgColor: '#b45309', fgColor: '#ffffff', accentColor: '#fef08a', animStyle: 'rainbow', logoKind: 'star' },
];

// +10 more logos for CAAYVG Anime King Champion Cup
export const ANIME_CUP_EXTRA_SPONSORS: LedSponsorAd[] = [
  { id: 'cryo-drink', brand: 'CRYO DRINK', tagline: 'COSMIC CHILL', bgColor: '#1e1b4b', fgColor: '#38bdf8', accentColor: '#f472b6', animStyle: 'rainbow', logoKind: 'bottle' },
  { id: 'anime-bento', brand: 'ANIME BENTO', tagline: 'SUPER SNACK', bgColor: '#581c87', fgColor: '#fde047', accentColor: '#ec4899', animStyle: 'pulse', logoKind: 'burger' },
  { id: 'ramen-x', brand: 'RAMEN X', tagline: 'HOT BOWL', bgColor: '#7f1d1d', fgColor: '#fef08a', accentColor: '#38bdf8', animStyle: 'wave', logoKind: 'cup' },
  { id: 'mochi-pop', brand: 'MOCHI POP', tagline: 'SWEET BOOST', bgColor: '#831843', fgColor: '#fbcfe8', accentColor: '#facc15', animStyle: 'rainbow', logoKind: 'star' },
  { id: 'kawaii-soda', brand: 'KAWAII SODA', tagline: 'SPARKLE FIZZ', bgColor: '#4c1d95', fgColor: '#fde047', accentColor: '#f472b6', animStyle: 'flash', logoKind: 'can' },
  { id: 'starlight-tea', brand: 'STARLIGHT TEA', tagline: 'COSMIC LEAF', bgColor: '#0f172a', fgColor: '#a855f7', accentColor: '#fde047', animStyle: 'pulse', logoKind: 'cup' },
  { id: 'cyber-ramune', brand: 'CYBER RAMUNE', tagline: 'MARBLE POP', bgColor: '#083344', fgColor: '#67e8f9', accentColor: '#f43f5e', animStyle: 'wave', logoKind: 'bottle' },
  { id: 'otaku-gear', brand: 'OTAKU GEAR', tagline: 'COSMIC KICKS', bgColor: '#1e1b4b', fgColor: '#f472b6', accentColor: '#38bdf8', animStyle: 'chevron', logoKind: 'shoe' },
  { id: 'neko-cola', brand: 'NEKO COLA', tagline: 'LUCKY CAT', bgColor: '#3b0764', fgColor: '#fef08a', accentColor: '#ec4899', animStyle: 'rainbow', logoKind: 'can' },
  { id: 'galaxy-boba', brand: 'GALAXY BOBA', tagline: 'STAR PEARLS', bgColor: '#09090b', fgColor: '#67e8f9', accentColor: '#a855f7', animStyle: 'pulse', logoKind: 'gem' },
];

// Exclusive Pitch-Side Perimeter LED Ads when playing Ultimate Team modes
export const UT_LED_SPONSOR_ADS: LedSponsorAd[] = [
  { id: 'ut-toty-26', brand: 'TOTY 26', tagline: 'TEAM OF THE YEAR 90-97', bgColor: '#0c1c4e', fgColor: '#facc15', accentColor: '#60a5fa', animStyle: 'flash', logoKind: 'crown' },
  { id: 'ut-toty-icons', brand: 'TOTY ICONS', tagline: 'IMMORTAL LEGENDS 96-97', bgColor: '#1e1b4b', fgColor: '#fef08a', accentColor: '#38bdf8', animStyle: 'pulse', logoKind: 'crown' },
  { id: 'ut-tots-champs', brand: 'TOTS CHAMPIONS', tagline: 'SEASON BEST 87-98', bgColor: '#082f49', fgColor: '#38bdf8', accentColor: '#facc15', animStyle: 'chevron', logoKind: 'star' },
  { id: 'ut-futties-pink', brand: 'FUTTIES PINK', tagline: 'FAN FAVORITES 93-99', bgColor: '#831843', fgColor: '#f9a8d4', accentColor: '#facc15', animStyle: 'rainbow', logoKind: 'gem' },
  { id: 'ut-futties-icons', brand: 'FUTTIES ICONS', tagline: 'PINK RADIANT 95-99', bgColor: '#9d174d', fgColor: '#fef08a', accentColor: '#f472b6', animStyle: 'wave', logoKind: 'crown' },
  { id: 'ut-fut-draft', brand: 'FUT DRAFT PRO', tagline: '11 ROUNDS · BIG REWARDS', bgColor: '#064e3b', fgColor: '#4ade80', accentColor: '#facc15', animStyle: 'chevron', logoKind: 'controller' },
  { id: 'ut-div-rivals', brand: 'DIV RIVALS', tagline: 'ROAD TO ELITE DIV', bgColor: '#172554', fgColor: '#38bdf8', accentColor: '#ffffff', animStyle: 'pulse', logoKind: 'bolt' },
  { id: 'ut-pack-store', brand: 'PACK STORE', tagline: 'WALKOUT TUNNEL FLARE', bgColor: '#451a03', fgColor: '#fde047', accentColor: '#fb923c', animStyle: 'flash', logoKind: 'star' },
  { id: 'ut-champions', brand: 'UT CHAMPIONS', tagline: '11v11 ULTIMATE XI', bgColor: '#18181b', fgColor: '#facc15', accentColor: '#ef4444', animStyle: 'wave', logoKind: 'ball' },
  { id: 'ut-sbc-elite', brand: 'SBC ELITE', tagline: 'CHEMISTRY 33 MAX', bgColor: '#3b0764', fgColor: '#e879f9', accentColor: '#38bdf8', animStyle: 'rainbow', logoKind: 'gem' },
  { id: 'ut-coin-boost', brand: 'COIN BOOST', tagline: 'WIN BONUS +5500', bgColor: '#713f12', fgColor: '#fef08a', accentColor: '#22c55e', animStyle: 'pulse', logoKind: 'cup' },
  { id: 'ut-ultimate-xi', brand: 'ULTIMATE XI', tagline: 'BUILD YOUR DREAM SQUAD', bgColor: '#0f172a', fgColor: '#facc15', accentColor: '#ec4899', animStyle: 'chevron', logoKind: 'crown' },
];

export function getSponsorsForCompetition(
  competitionId: 'league' | 'king_cup' | 'super_cup' | 'anime_cup',
  isUltimateTeam = false
): LedSponsorAd[] {
  if (isUltimateTeam) return UT_LED_SPONSOR_ADS;
  if (competitionId === 'league') return LED_SPONSOR_ADS;
  if (competitionId === 'king_cup') return [...CUP_LED_SPONSOR_ADS, ...KING_CUP_EXTRA_SPONSORS, ...EXTRA_ANIMATED_SPONSORS];
  if (competitionId === 'super_cup') return [...CUP_LED_SPONSOR_ADS, ...SUPER_CUP_EXTRA_SPONSORS, ...EXTRA_ANIMATED_SPONSORS];
  return [...CUP_LED_SPONSOR_ADS, ...ANIME_CUP_EXTRA_SPONSORS, ...EXTRA_ANIMATED_SPONSORS];
}

// Base 11v11 pitch coordinates (4-3-3 Championship shape)
export const BASE_FORMATION_SLOTS: Omit<SquadSlotSpec, 'name' | 'isCaptain'>[] = [
  { slotIndex: 0, number: 1, positionLabel: 'GK', role: 'GK', aiPolicy: 'GK', rx: 0.04, ry: 0 },
  { slotIndex: 1, number: 3, positionLabel: 'LB', role: 'DEF', aiPolicy: 'SWEEPER', rx: 0.17, ry: -0.68 },
  { slotIndex: 2, number: 4, positionLabel: 'CB', role: 'DEF', aiPolicy: 'SWEEPER', rx: 0.15, ry: -0.24 },
  { slotIndex: 3, number: 5, positionLabel: 'CB', role: 'DEF', aiPolicy: 'SWEEPER', rx: 0.15, ry: 0.24 },
  { slotIndex: 4, number: 2, positionLabel: 'RB', role: 'DEF', aiPolicy: 'SWEEPER', rx: 0.17, ry: 0.68 },
  { slotIndex: 5, number: 6, positionLabel: 'CDM', role: 'MID', aiPolicy: 'PLAYMAKER', rx: 0.28, ry: 0 },
  { slotIndex: 6, number: 8, positionLabel: 'CM', role: 'MID', aiPolicy: 'PLAYMAKER', rx: 0.34, ry: -0.44 },
  { slotIndex: 7, number: 7, positionLabel: 'CAM', role: 'MID', aiPolicy: 'PLAYMAKER', rx: 0.34, ry: 0.44 },
  { slotIndex: 8, number: 11, positionLabel: 'LW', role: 'FWD', aiPolicy: 'STRIKER', rx: 0.45, ry: -0.58 },
  { slotIndex: 9, number: 9, positionLabel: 'RW', role: 'FWD', aiPolicy: 'STRIKER', rx: 0.45, ry: 0.58 },
  { slotIndex: 10, number: 10, positionLabel: 'ST', role: 'FWD', aiPolicy: 'STRIKER', rx: 0.48, ry: 0 },
];

type CustomSlotOverride = {
  number?: number;
  positionLabel?: string;
  name: string;
  isCaptain?: boolean;
};

const CUSTOM_LINEUPS: Record<string, CustomSlotOverride[]> = {
  'brazil-fc': [
    { number: 1, positionLabel: 'GK', name: 'Flamingo2019' },
    { number: 3, positionLabel: 'LB', name: 'Samba Left' },
    { number: 5, positionLabel: 'CB', name: 'FLAMINGO2018' },
    { number: 8, positionLabel: 'CB', name: 'RYTH' },
    { number: 2, positionLabel: 'RB', name: 'Rebootedpoppy' },
    { number: 4, positionLabel: 'CDM', name: 'Carioca Six' },
    { number: 6, positionLabel: 'CM', name: 'Vini Pixel' },
    { number: 7, positionLabel: 'CAM', name: 'Joga Maestro' },
    { number: 11, positionLabel: 'LW', name: '3ZLD99' },
    { number: 9, positionLabel: 'RW', name: 'Neon Pelé' },
    { number: 10, positionLabel: 'ST', name: 'Playtime', isCaptain: true },
  ],
  'glitter-force': [
    { number: 1, positionLabel: 'GK', name: 'Glitter Spring' },
    { number: 4, positionLabel: 'LB', name: 'Glitter Spark' },
    { number: 5, positionLabel: 'CB', name: 'Glitter Breeze' },
    { number: 8, positionLabel: 'CB', name: 'Glitter Peace' },
    { number: 2, positionLabel: 'RB', name: 'Ribbon Guard' },
    { number: 6, positionLabel: 'CDM', name: 'Candy Anchor' },
    { number: 15, positionLabel: 'CM', name: 'Prism Charm' },
    { number: 7, positionLabel: 'CAM/CM', name: 'Brandon' },
    { number: 11, positionLabel: 'LW', name: 'Glitter Lucky' },
    { number: 9, positionLabel: 'RW', name: 'Starburst Jet' },
    { number: 14, positionLabel: 'ST', name: 'Glitter Sunny', isCaptain: true },
  ],
  'gamer-rage-fc': [
    { number: 1, positionLabel: 'GK', name: 'LagSpike' },
    { number: 3, positionLabel: 'LB', name: 'FrameDrop' },
    { number: 5, positionLabel: 'CB', name: 'Firewall' },
    { number: 4, positionLabel: 'CB', name: 'Overclock' },
    { number: 2, positionLabel: 'RB', name: 'Buffering' },
    { number: 6, positionLabel: 'CDM', name: 'NoobSlayer' },
    { number: 15, positionLabel: 'CM', name: 'Respawn' },
    { number: 8, positionLabel: 'CAM', name: 'SaltKing' },
    { number: 9, positionLabel: 'LW', name: 'CritHit' },
    { number: 11, positionLabel: 'RW', name: 'ComboBreaker' },
    { number: 10, positionLabel: 'ST', name: 'RageQuit', isCaptain: true },
  ],
  'teen-titans-go': [
    { number: 1, positionLabel: 'GK', name: 'Cyborg' },
    { number: 3, positionLabel: 'LB', name: 'Silkie' },
    { number: 5, positionLabel: 'CB', name: 'BeastBoy' },
    { number: 4, positionLabel: 'CB', name: 'Bumblebee' },
    { number: 2, positionLabel: 'RB', name: 'Aqualad' },
    { number: 6, positionLabel: 'CM', name: 'Raven' },
    { number: 14, positionLabel: 'CM', name: 'Terra' },
    { number: 8, positionLabel: 'CAM', name: 'Starfire' },
    { number: 11, positionLabel: 'LW', name: 'Kid Flash' },
    { number: 9, positionLabel: 'RW', name: 'Speedy' },
    { number: 10, positionLabel: 'ST', name: 'Robin', isCaptain: true },
  ],
  'pghlfilms-fans': [
    { number: 1, positionLabel: 'GK', name: 'Pghl Keeper' },
    { number: 3, positionLabel: 'LB', name: 'BlockShield' },
    { number: 5, positionLabel: 'CB', name: 'BrickWall' },
    { number: 4, positionLabel: 'CB', name: 'StudGuard' },
    { number: 2, positionLabel: 'RB', name: 'LegoHero' },
    { number: 6, positionLabel: 'CDM', name: 'SubSquad' },
    { number: 8, positionLabel: 'CM', name: 'RobloxPro' },
    { number: 7, positionLabel: 'CAM', name: 'ObbyMaster' },
    { number: 9, positionLabel: 'LW', name: 'FilmStar' },
    { number: 11, positionLabel: 'RW', name: 'PixelClip' },
    { number: 10, positionLabel: 'ST', name: 'PGHL Boss', isCaptain: true },
  ],
  'avocadoplayz-fc': [
    { number: 1, positionLabel: 'GK', name: 'GuacKeeper' },
    { number: 3, positionLabel: 'LB', name: 'SeedGuard' },
    { number: 5, positionLabel: 'CB', name: 'GreenShield' },
    { number: 4, positionLabel: 'CB', name: 'HassWall' },
    { number: 2, positionLabel: 'RB', name: 'PitWall' },
    { number: 6, positionLabel: 'CM', name: 'ToastMid' },
    { number: 14, positionLabel: 'CM', name: 'ZestPass' },
    { number: 8, positionLabel: 'CAM', name: 'AvocadoPlayz', isCaptain: true },
    { number: 9, positionLabel: 'LW', name: 'LimeDash' },
    { number: 7, positionLabel: 'RW', name: 'FreshWing' },
    { number: 11, positionLabel: 'ST', name: 'SliceShot' },
  ],
  'barcewiiparty': [
    { number: 1, positionLabel: 'GK', name: 'Mii Keeper' },
    { number: 3, positionLabel: 'LB', name: 'MotionBar' },
    { number: 5, positionLabel: 'CB', name: 'Nunchuk' },
    { number: 4, positionLabel: 'CB', name: 'SensorWall' },
    { number: 2, positionLabel: 'RB', name: 'WiiRemote' },
    { number: 6, positionLabel: 'CM', name: 'DiceKing' },
    { number: 14, positionLabel: 'CM', name: 'MiniGame' },
    { number: 8, positionLabel: 'CAM', name: 'PartyAce', isCaptain: true },
    { number: 9, positionLabel: 'LW', name: 'BoardStar' },
    { number: 7, positionLabel: 'RW', name: 'SpinBonus' },
    { number: 10, positionLabel: 'ST', name: 'TrophyMii' },
  ],
  'real-poofesurerid': [
    { number: 1, positionLabel: 'GK', name: 'Beef Boss', isCaptain: true },
    { number: 3, positionLabel: 'LB', name: 'Dudydude' },
    { number: 5, positionLabel: 'CB', name: 'Matt Wii' },
    { number: 4, positionLabel: 'CB', name: 'Pierre' },
    { number: 2, positionLabel: 'RB', name: 'Toady' },
    { number: 6, positionLabel: 'CM', name: 'Abby' },
    { number: 14, positionLabel: 'CM', name: 'Sakura' },
    { number: 8, positionLabel: 'CAM', name: 'Lucia' },
    { number: 9, positionLabel: 'LW', name: 'Tommy' },
    { number: 11, positionLabel: 'RW', name: 'Alfonso' },
    { number: 10, positionLabel: 'ST', name: 'Elisa' },
  ],
  'cartoon-fateen': [
    { number: 1, positionLabel: 'GK', name: 'Fateen GK' },
    { number: 3, positionLabel: 'LB', name: 'Tariq' },
    { number: 5, positionLabel: 'CB', name: 'Rami' },
    { number: 4, positionLabel: 'CB', name: 'Omar' },
    { number: 2, positionLabel: 'RB', name: 'Zaid' },
    { number: 6, positionLabel: 'CM', name: 'Noor' },
    { number: 14, positionLabel: 'CM', name: 'Bilal' },
    { number: 8, positionLabel: 'CAM', name: 'Sami' },
    { number: 11, positionLabel: 'LW', name: 'Kareem' },
    { number: 9, positionLabel: 'RW', name: 'Hamza' },
    { number: 10, positionLabel: 'ST', name: 'فطين', isCaptain: true },
  ],
  'cgy-united': [
    { number: 1, positionLabel: 'GK', name: 'Victor 8Bit' },
    { number: 3, positionLabel: 'LB', name: 'ByteLeft' },
    { number: 5, positionLabel: 'CB', name: 'CSharp Wall' },
    { number: 4, positionLabel: 'CB', name: 'StackLock' },
    { number: 2, positionLabel: 'RB', name: 'HashTag' },
    { number: 6, positionLabel: 'CDM', name: 'Green Engine' },
    { number: 8, positionLabel: 'CM', name: 'Pixel Ace' },
    { number: 7, positionLabel: 'CAM', name: 'SpriteCore' },
    { number: 9, positionLabel: 'LW', name: 'Tunnel Jet' },
    { number: 11, positionLabel: 'RW', name: 'RenderWing' },
    { number: 10, positionLabel: 'ST', name: 'Captain CAAYVG', isCaptain: true },
  ],
  'metro-blazers': [
    { number: 1, positionLabel: 'GK', name: 'Torch GK' },
    { number: 3, positionLabel: 'LB', name: 'SubwayLock' },
    { number: 5, positionLabel: 'CB', name: 'Steel Rail' },
    { number: 4, positionLabel: 'CB', name: 'EmberWall' },
    { number: 2, positionLabel: 'RB', name: 'Spark Plug' },
    { number: 6, positionLabel: 'CM', name: 'Blaze Six' },
    { number: 14, positionLabel: 'CM', name: 'HeatWave' },
    { number: 8, positionLabel: 'CAM', name: 'Inferno' },
    { number: 11, positionLabel: 'LW', name: 'Red Flash' },
    { number: 9, positionLabel: 'RW', name: 'FlareJet' },
    { number: 10, positionLabel: 'ST', name: 'Metro Star', isCaptain: true },
  ],
  'outpost-marathon': [
    { number: 1, positionLabel: 'GK', name: 'Orb Keeper' },
    { number: 3, positionLabel: 'LB', name: 'Relay Two' },
    { number: 5, positionLabel: 'CB', name: 'Titan Pillar' },
    { number: 4, positionLabel: 'CB', name: 'GateFour' },
    { number: 2, positionLabel: 'RB', name: 'BaseLock' },
    { number: 6, positionLabel: 'CM', name: 'Gold Runner' },
    { number: 14, positionLabel: 'CM', name: 'MileSplit' },
    { number: 8, positionLabel: 'CAM', name: 'Sprint 8' },
    { number: 11, positionLabel: 'LW', name: 'PaceDash' },
    { number: 9, positionLabel: 'RW', name: 'Marathoner' },
    { number: 10, positionLabel: 'ST', name: 'King Orb', isCaptain: true },
  ],
  'perimeter-fc': [
    { number: 1, positionLabel: 'GK', name: 'Chevron GK' },
    { number: 3, positionLabel: 'LB', name: 'EdgeGuard' },
    { number: 5, positionLabel: 'CB', name: 'Border Guard' },
    { number: 4, positionLabel: 'CB', name: 'LineShield' },
    { number: 2, positionLabel: 'RB', name: 'Wing Lock' },
    { number: 6, positionLabel: 'CM', name: 'Triple Vector' },
    { number: 14, positionLabel: 'CM', name: 'AxisMid' },
    { number: 8, positionLabel: 'CAM', name: 'Solar Spin' },
    { number: 11, positionLabel: 'LW', name: 'Super Wing' },
    { number: 9, positionLabel: 'RW', name: 'ApexWing' },
    { number: 10, positionLabel: 'ST', name: 'Rover Ten', isCaptain: true },
  ],
  'cryo-archive': [
    { number: 1, positionLabel: 'GK', name: 'Frost Core' },
    { number: 3, positionLabel: 'LB', name: 'ZeroEdge' },
    { number: 5, positionLabel: 'CB', name: 'Ice Crystal' },
    { number: 4, positionLabel: 'CB', name: 'Permafrost' },
    { number: 2, positionLabel: 'RB', name: 'Glacier' },
    { number: 6, positionLabel: 'CM', name: 'Prism Six' },
    { number: 14, positionLabel: 'CM', name: 'ChillLink' },
    { number: 8, positionLabel: 'CAM', name: 'Aurora' },
    { number: 11, positionLabel: 'LW', name: 'Rainbow Ray' },
    { number: 9, positionLabel: 'RW', name: 'Blizzard' },
    { number: 10, positionLabel: 'ST', name: 'Cryo Nova', isCaptain: true },
  ],
};

const FIRST_NAMES_POOL = [
  'Lucas', 'Mateo', 'Kenji', 'Tariq', 'Sora', 'Leo', 'Kai', 'Omar', 'Dante', 'Marco', 'Riku', 'Alex',
  'Zane', 'Nico', 'Haruto', 'Samir', 'Axel', 'Bruno', 'Rafael', 'Koji', 'Emir', 'Yuki',
];
const LAST_NAMES_POOL = [
  'Silva', 'Vega', 'Takahashi', 'Khoury', 'Blaze', 'Sterling', 'Cruz', 'Reyes', 'Sato', 'Mendes',
  'Novak', 'Keller', 'Vance', 'Diallo', 'Morales', 'Fujita', 'Hassan', 'Volkov', 'Costa', 'Park',
];

export function getTeamLineup(team: Team): SquadSlotSpec[] {
  const override = CUSTOM_LINEUPS[team.id];
  const seedBase = team.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  return BASE_FORMATION_SLOTS.map((base, idx) => {
    const custom = override?.[idx];
    if (custom) {
      return {
        ...base,
        number: custom.number ?? base.number,
        positionLabel: custom.positionLabel ?? base.positionLabel,
        name: custom.name,
        isCaptain: Boolean(custom.isCaptain),
      };
    }

    const fn = FIRST_NAMES_POOL[(seedBase + idx * 5) % FIRST_NAMES_POOL.length];
    const ln = LAST_NAMES_POOL[(seedBase + idx * 7) % LAST_NAMES_POOL.length];
    return {
      ...base,
      name: `${fn} ${ln}`,
      isCaptain: idx === 10,
    };
  });
}

export function getPlayerNameForSlot(team: Team, number: number, role: PlayerRole): string {
  const lineup = getTeamLineup(team);
  const found = lineup.find((s) => s.number === number) ?? lineup.find((s) => s.role === role);
  return found ? found.name : `${team.shortCode} #${number}`;
}

export interface FormationDefinition {
  id: FormationId;
  label: string;
  description: string;
  slotPositions: { rx: number; ry: number; role: PlayerRole; aiPolicy: SquadSlotSpec['aiPolicy'] }[];
}

export const FORMATIONS: FormationDefinition[] = [
  {
    id: '4-3-3',
    label: '4-3-3 ATTACK',
    description: '11v11 Championship 4-3-3 wingers',
    slotPositions: [
      { rx: 0.04, ry: 0, role: 'GK', aiPolicy: 'GK' },
      { rx: 0.17, ry: -0.68, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.15, ry: -0.24, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.15, ry: 0.24, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.17, ry: 0.68, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.28, ry: 0, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.34, ry: -0.44, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.34, ry: 0.44, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.45, ry: -0.58, role: 'FWD', aiPolicy: 'STRIKER' },
      { rx: 0.45, ry: 0.58, role: 'FWD', aiPolicy: 'STRIKER' },
      { rx: 0.48, ry: 0, role: 'FWD', aiPolicy: 'STRIKER' },
    ],
  },
  {
    id: '4-4-2',
    label: '4-4-2 CLASSIC',
    description: 'Balanced 11v11 twin-striker diamond',
    slotPositions: [
      { rx: 0.04, ry: 0, role: 'GK', aiPolicy: 'GK' },
      { rx: 0.17, ry: -0.68, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.15, ry: -0.24, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.15, ry: 0.24, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.17, ry: 0.68, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.31, ry: -0.64, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.30, ry: -0.20, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.30, ry: 0.20, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.31, ry: 0.64, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.46, ry: -0.26, role: 'FWD', aiPolicy: 'STRIKER' },
      { rx: 0.46, ry: 0.26, role: 'FWD', aiPolicy: 'STRIKER' },
    ],
  },
  {
    id: '3-5-2',
    label: '3-5-2 CONTROL',
    description: 'Midfield overload & overlapping wingbacks',
    slotPositions: [
      { rx: 0.04, ry: 0, role: 'GK', aiPolicy: 'GK' },
      { rx: 0.16, ry: -0.50, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.14, ry: 0, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.16, ry: 0.50, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.29, ry: -0.72, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.28, ry: -0.24, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.35, ry: 0, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.28, ry: 0.24, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.29, ry: 0.72, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.46, ry: -0.26, role: 'FWD', aiPolicy: 'STRIKER' },
      { rx: 0.46, ry: 0.26, role: 'FWD', aiPolicy: 'STRIKER' },
    ],
  },
  {
    id: '4-2-3-1',
    label: '4-2-3-1 PRESS',
    description: 'Double pivot & triple creative playmakers',
    slotPositions: [
      { rx: 0.04, ry: 0, role: 'GK', aiPolicy: 'GK' },
      { rx: 0.16, ry: -0.68, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.14, ry: -0.22, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.14, ry: 0.22, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.16, ry: 0.68, role: 'DEF', aiPolicy: 'SWEEPER' },
      { rx: 0.26, ry: -0.24, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.26, ry: 0.24, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.38, ry: -0.56, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.38, ry: 0, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.38, ry: 0.56, role: 'MID', aiPolicy: 'PLAYMAKER' },
      { rx: 0.48, ry: 0, role: 'FWD', aiPolicy: 'STRIKER' },
    ],
  },
];

export interface TacticDefinition {
  id: TacticId;
  label: string;
  description: string;
  attackPush: number;
  pressBonus: number;
}

export const TACTICS: TacticDefinition[] = [
  { id: 'balanced', label: 'BALANCED', description: 'Even attack & defense shape', attackPush: 0, pressBonus: 0 },
  { id: 'all_out_attack', label: 'ALL-OUT ATTACK', description: 'Push forwards high up the pitch', attackPush: 0.11, pressBonus: 8 },
  { id: 'high_press', label: 'HIGH PRESS', description: 'Aggressive ball recovery & pace', attackPush: 0.06, pressBonus: 14 },
  { id: 'counter_attack', label: 'COUNTER ATTACK', description: 'Absorb pressure & break fast', attackPush: -0.05, pressBonus: 6 },
  { id: 'park_the_bus', label: 'PARK THE BUS', description: 'Compact low defensive block', attackPush: -0.1, pressBonus: -4 },
];

const CUSTOM_BENCHES: Record<string, { number: number; positionLabel: string; name: string; role: PlayerRole }[]> = {
  'brazil-fc': [
    { number: 12, positionLabel: 'GK', name: 'Taffarel 8Bit', role: 'GK' },
    { number: 13, positionLabel: 'DEF', name: 'Carlos Pixel', role: 'DEF' },
    { number: 14, positionLabel: 'DEF', name: 'Cafu Dash', role: 'DEF' },
    { number: 15, positionLabel: 'MID', name: 'Joga Ace', role: 'MID' },
    { number: 17, positionLabel: 'MID', name: 'Samba Dash', role: 'MID' },
    { number: 18, positionLabel: 'FWD', name: 'Adriano Bolt', role: 'FWD' },
    { number: 19, positionLabel: 'ST', name: 'Ronaldo R9X', role: 'FWD' },
  ],
  'glitter-force': [
    { number: 12, positionLabel: 'GK', name: 'Candy Keeper', role: 'GK' },
    { number: 13, positionLabel: 'DEF', name: 'Pop Guard', role: 'DEF' },
    { number: 15, positionLabel: 'DEF', name: 'Mirror Shield', role: 'DEF' },
    { number: 16, positionLabel: 'MID', name: 'Ulric Dash', role: 'MID' },
    { number: 18, positionLabel: 'MID', name: 'Rascal Trick', role: 'MID' },
    { number: 20, positionLabel: 'FWD', name: 'Aura Spark', role: 'FWD' },
    { number: 19, positionLabel: 'ST', name: 'Royal Candy', role: 'FWD' },
  ],
};

export function getTeamBench(team: Team): BenchSlotSpec[] {
  const custom = CUSTOM_BENCHES[team.id];
  const seedBase = team.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const template: { number: number; positionLabel: string; role: PlayerRole; aiPolicy: BenchSlotSpec['aiPolicy'] }[] = [
    { number: 12, positionLabel: 'GK', role: 'GK', aiPolicy: 'GK' },
    { number: 13, positionLabel: 'DEF', role: 'DEF', aiPolicy: 'SWEEPER' },
    { number: 14, positionLabel: 'DEF', role: 'DEF', aiPolicy: 'SWEEPER' },
    { number: 15, positionLabel: 'MID', role: 'MID', aiPolicy: 'PLAYMAKER' },
    { number: 17, positionLabel: 'MID', role: 'MID', aiPolicy: 'PLAYMAKER' },
    { number: 18, positionLabel: 'FWD', role: 'FWD', aiPolicy: 'STRIKER' },
    { number: 19, positionLabel: 'ST', role: 'FWD', aiPolicy: 'STRIKER' },
  ];
  return template.map((tpl, idx) => {
    const ov = custom?.[idx];
    if (ov) {
      return {
        slotIndex: idx,
        number: ov.number,
        positionLabel: ov.positionLabel,
        name: ov.name,
        role: ov.role,
        aiPolicy: tpl.aiPolicy,
      };
    }
    const fn = FIRST_NAMES_POOL[(seedBase + idx * 9 + 3) % FIRST_NAMES_POOL.length];
    const ln = LAST_NAMES_POOL[(seedBase + idx * 11 + 5) % LAST_NAMES_POOL.length];
    return {
      slotIndex: idx,
      number: tpl.number,
      positionLabel: tpl.positionLabel,
      name: `${fn} ${ln}`,
      role: tpl.role,
      aiPolicy: tpl.aiPolicy,
    };
  });
}
