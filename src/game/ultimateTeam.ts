import { FORMATIONS } from './data';
import type { FormationId, PlayerRole, SquadSlotSpec, Team } from './types';

export type UtCardRarity =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'totw'
  | 'hero'
  | 'icon'
  | 'toty'
  | 'toty_icon'
  | 'tots'
  | 'futties'
  | 'futties_icon';

export interface UtPlayerCard {
  id: string;
  name: string;
  positionLabel: string;
  role: PlayerRole;
  ovr: number;
  rarity: UtCardRarity;
  clubId: string;
  clubName: string;
  nation: string;
  number: number;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  colorA: string;
  colorB: string;
  quickSellCoins: number;
}

export type UtPackId =
  | 'bronze_pack'
  | 'silver_pack'
  | 'gold_premium'
  | 'icon_mega'
  | 'toty_tots_pack'
  | 'futties_pack';

export interface UtPackDefinition {
  id: UtPackId;
  name: string;
  subtitle: string;
  costCoins: number;
  cardCount: number;
  minOvr: number;
  guaranteedRarity: UtCardRarity;
  accentColor: string;
  bgGradient: string;
}

export interface UtPackOpenResult {
  packId: UtPackId;
  cards: UtPlayerCard[];
  walkoutCard: UtPlayerCard;
  duplicateIds: string[];
  duplicateRefundCoins: number;
}

export interface UtDraftSession {
  id: string;
  formation: '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';
  round: number; // 0..11 (11 completed)
  pickedCardIds: string[];
  currentChoices: UtPlayerCard[];
  completedMatches: number;
  wins: number;
}

export interface UtRivalsState {
  division: number; // 10 down to 1, 0 = Elite
  points: number;
  wins: number;
  draws: number;
  losses: number;
  winStreak: number;
  weeklyClaimedTier: number; // 0 none, 1 Rank III, 2 Rank II, 3 Rank I
}

export interface UltimateTeamState {
  coins: number;
  clubName: string;
  formation: '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';
  ownedCardIds: string[];
  activeSquadCardIds: string[]; // 11 card IDs matching starting XI
  unopenedPacks: UtPackId[];
  rivals: UtRivalsState;
  draft: UtDraftSession | null;
  packsOpenedCount: number;
}

export const UT_FORMATIONS: Array<'4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1'> = [
  '4-3-3',
  '4-4-2',
  '3-5-2',
  '4-2-3-1',
];

export const UT_PACKS: UtPackDefinition[] = [
  {
    id: 'bronze_pack',
    name: 'BRONZE STARTER PACK',
    subtitle: '5 Club Cards · 1 Guaranteed 68+ Starter',
    costCoins: 1500,
    cardCount: 5,
    minOvr: 64,
    guaranteedRarity: 'bronze',
    accentColor: '#cd7f32',
    bgGradient: 'linear-gradient(135deg, #451a03 0%, #92400e 100%)',
  },
  {
    id: 'silver_pack',
    name: 'SILVER PRO PACK',
    subtitle: '5 Club Cards · Guaranteed 75+ Silver/Gold',
    costCoins: 3500,
    cardCount: 5,
    minOvr: 70,
    guaranteedRarity: 'silver',
    accentColor: '#cbd5e1',
    bgGradient: 'linear-gradient(135deg, #1e293b 0%, #64748b 100%)',
  },
  {
    id: 'gold_premium',
    name: 'GOLD PREMIUM PACK',
    subtitle: '5 Club Cards · High TOTW & Hero Odds',
    costCoins: 7500,
    cardCount: 5,
    minOvr: 78,
    guaranteedRarity: 'gold',
    accentColor: '#facc15',
    bgGradient: 'linear-gradient(135deg, #713f12 0%, #eab308 100%)',
  },
  {
    id: 'icon_mega',
    name: 'ICON & HERO MEGA PACK',
    subtitle: '5 Elite Cards · Guaranteed 87+ Walkout!',
    costCoins: 15000,
    cardCount: 5,
    minOvr: 84,
    guaranteedRarity: 'hero',
    accentColor: '#38bdf8',
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #0284c7 55%, #facc15 100%)',
  },
  {
    id: 'toty_tots_pack',
    name: 'TOTY & TOTS ELITE PACK',
    subtitle: '5 Star Cards · Guaranteed 90-98 TOTY / TOTY ICON / TOTS!',
    costCoins: 22000,
    cardCount: 5,
    minOvr: 87,
    guaranteedRarity: 'toty',
    accentColor: '#facc15',
    bgGradient: 'linear-gradient(135deg, #091540 0%, #1d4ed8 60%, #facc15 100%)',
  },
  {
    id: 'futties_pack',
    name: 'FUTTIES PINK MEGA PACK',
    subtitle: '5 End-Game Cards · Guaranteed 93-99 FUTTIES / FUTTIES ICON!',
    costCoins: 28000,
    cardCount: 5,
    minOvr: 93,
    guaranteedRarity: 'futties',
    accentColor: '#ec4899',
    bgGradient: 'linear-gradient(135deg, #831843 0%, #db2777 55%, #f472b6 100%)',
  },
];

export const UT_CARD_CATALOG: UtPlayerCard[] = [
  // FUTTIES ICON CARDS (Pink + Gold, 93-99)
  {
    id: 'ut-futties-icon-playtime',
    name: 'Playtime',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 99,
    rarity: 'futties_icon',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 10,
    pac: 99,
    sho: 99,
    pas: 96,
    dri: 99,
    def: 54,
    phy: 91,
    colorA: '#ec4899',
    colorB: '#facc15',
    quickSellCoins: 24000,
  },
  {
    id: 'ut-futties-icon-sunny',
    name: 'Glitter Sunny',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 98,
    rarity: 'futties_icon',
    clubId: 'glitter-force',
    clubName: 'Glitter Force',
    nation: 'RNB',
    number: 14,
    pac: 98,
    sho: 98,
    pas: 94,
    dri: 97,
    def: 52,
    phy: 92,
    colorA: '#ec4899',
    colorB: '#facc15',
    quickSellCoins: 21000,
  },
  {
    id: 'ut-futties-icon-caayvg',
    name: 'CAAYVG Prime',
    positionLabel: 'CAM',
    role: 'MID',
    ovr: 97,
    rarity: 'futties_icon',
    clubId: 'caayvg-united',
    clubName: 'CAAYVG United',
    nation: 'CYG',
    number: 10,
    pac: 97,
    sho: 95,
    pas: 98,
    dri: 98,
    def: 76,
    phy: 88,
    colorA: '#ec4899',
    colorB: '#facc15',
    quickSellCoins: 19500,
  },
  {
    id: 'ut-futties-icon-robin',
    name: 'Robin Legend',
    positionLabel: 'CF',
    role: 'FWD',
    ovr: 95,
    rarity: 'futties_icon',
    clubId: 'teen-titans-go',
    clubName: 'Teen Titans Go',
    nation: 'TWN',
    number: 10,
    pac: 96,
    sho: 95,
    pas: 93,
    dri: 96,
    def: 60,
    phy: 86,
    colorA: '#ec4899',
    colorB: '#facc15',
    quickSellCoins: 16500,
  },

  // FUTTIES CARDS (Pink background, 93-99)
  {
    id: 'ut-futties-3zld99',
    name: '3ZLD99',
    positionLabel: 'LW',
    role: 'FWD',
    ovr: 99,
    rarity: 'futties',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 11,
    pac: 99,
    sho: 97,
    pas: 95,
    dri: 99,
    def: 50,
    phy: 85,
    colorA: '#db2777',
    colorB: '#f9a8d4',
    quickSellCoins: 22000,
  },
  {
    id: 'ut-futties-ragequit',
    name: 'RageQuit',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 98,
    rarity: 'futties',
    clubId: 'gamer-rage-fc',
    clubName: 'Gamer Rage FC',
    nation: 'GMR',
    number: 10,
    pac: 98,
    sho: 99,
    pas: 91,
    dri: 97,
    def: 49,
    phy: 92,
    colorA: '#db2777',
    colorB: '#f9a8d4',
    quickSellCoins: 20000,
  },
  {
    id: 'ut-futties-starfire',
    name: 'Starfire',
    positionLabel: 'CAM',
    role: 'MID',
    ovr: 97,
    rarity: 'futties',
    clubId: 'teen-titans-go',
    clubName: 'Teen Titans Go',
    nation: 'TWN',
    number: 8,
    pac: 97,
    sho: 96,
    pas: 97,
    dri: 97,
    def: 68,
    phy: 88,
    colorA: '#db2777',
    colorB: '#f9a8d4',
    quickSellCoins: 18500,
  },
  {
    id: 'ut-futties-brandon',
    name: 'Brandon',
    positionLabel: 'CM',
    role: 'MID',
    ovr: 96,
    rarity: 'futties',
    clubId: 'glitter-force',
    clubName: 'Glitter Force',
    nation: 'RNB',
    number: 7,
    pac: 94,
    sho: 93,
    pas: 98,
    dri: 97,
    def: 85,
    phy: 90,
    colorA: '#db2777',
    colorB: '#f9a8d4',
    quickSellCoins: 17000,
  },
  {
    id: 'ut-futties-ryth',
    name: 'RYTH',
    positionLabel: 'CB',
    role: 'DEF',
    ovr: 95,
    rarity: 'futties',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 8,
    pac: 93,
    sho: 72,
    pas: 89,
    dri: 86,
    def: 97,
    phy: 96,
    colorA: '#db2777',
    colorB: '#f9a8d4',
    quickSellCoins: 15500,
  },
  {
    id: 'ut-futties-flamingo-gk',
    name: 'Flamingo2019',
    positionLabel: 'GK',
    role: 'GK',
    ovr: 93,
    rarity: 'futties',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 1,
    pac: 93,
    sho: 92,
    pas: 90,
    dri: 94,
    def: 92,
    phy: 93,
    colorA: '#db2777',
    colorB: '#f9a8d4',
    quickSellCoins: 14000,
  },

  // TOTY ICON CARDS (90-96-97)
  {
    id: 'ut-toty-icon-playtime',
    name: 'Playtime TOTY',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 97,
    rarity: 'toty_icon',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 10,
    pac: 98,
    sho: 97,
    pas: 93,
    dri: 99,
    def: 49,
    phy: 87,
    colorA: '#1d4ed8',
    colorB: '#facc15',
    quickSellCoins: 19000,
  },
  {
    id: 'ut-toty-icon-sunny',
    name: 'Sunny TOTY Icon',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 96,
    rarity: 'toty_icon',
    clubId: 'glitter-force',
    clubName: 'Glitter Force',
    nation: 'RNB',
    number: 14,
    pac: 96,
    sho: 96,
    pas: 92,
    dri: 95,
    def: 50,
    phy: 90,
    colorA: '#1d4ed8',
    colorB: '#facc15',
    quickSellCoins: 17500,
  },
  {
    id: 'ut-toty-icon-cyborg',
    name: 'Cyborg TOTY Icon',
    positionLabel: 'GK',
    role: 'GK',
    ovr: 94,
    rarity: 'toty_icon',
    clubId: 'teen-titans-go',
    clubName: 'Teen Titans Go',
    nation: 'TWN',
    number: 1,
    pac: 94,
    sho: 93,
    pas: 91,
    dri: 95,
    def: 94,
    phy: 96,
    colorA: '#1d4ed8',
    colorB: '#facc15',
    quickSellCoins: 15500,
  },
  {
    id: 'ut-toty-icon-abby',
    name: 'Abby TOTY Icon',
    positionLabel: 'CM',
    role: 'MID',
    ovr: 92,
    rarity: 'toty_icon',
    clubId: 'real-poofesurerid',
    clubName: 'Real Poofesurerid',
    nation: 'WII',
    number: 8,
    pac: 91,
    sho: 90,
    pas: 94,
    dri: 93,
    def: 84,
    phy: 88,
    colorA: '#1d4ed8',
    colorB: '#facc15',
    quickSellCoins: 13500,
  },

  // TOTY CARDS (90-96-97)
  {
    id: 'ut-toty-3zld99',
    name: '3ZLD99 TOTY',
    positionLabel: 'LW',
    role: 'FWD',
    ovr: 97,
    rarity: 'toty',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 11,
    pac: 99,
    sho: 95,
    pas: 93,
    dri: 98,
    def: 46,
    phy: 82,
    colorA: '#1e3a8a',
    colorB: '#fde047',
    quickSellCoins: 18000,
  },
  {
    id: 'ut-toty-neon-pele',
    name: 'Neon Pelé TOTY',
    positionLabel: 'RW',
    role: 'FWD',
    ovr: 96,
    rarity: 'toty',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 9,
    pac: 97,
    sho: 96,
    pas: 92,
    dri: 97,
    def: 48,
    phy: 84,
    colorA: '#1e3a8a',
    colorB: '#fde047',
    quickSellCoins: 16500,
  },
  {
    id: 'ut-toty-partyace',
    name: 'PartyAce TOTY',
    positionLabel: 'CAM',
    role: 'MID',
    ovr: 95,
    rarity: 'toty',
    clubId: 'barcewiiparty',
    clubName: 'Barcewiiparty',
    nation: 'WII',
    number: 8,
    pac: 94,
    sho: 93,
    pas: 97,
    dri: 96,
    def: 72,
    phy: 84,
    colorA: '#1e3a8a',
    colorB: '#fde047',
    quickSellCoins: 15000,
  },
  {
    id: 'ut-toty-flamingo2018',
    name: 'FLAMINGO2018 TOTY',
    positionLabel: 'CB',
    role: 'DEF',
    ovr: 94,
    rarity: 'toty',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 5,
    pac: 91,
    sho: 68,
    pas: 86,
    dri: 83,
    def: 96,
    phy: 95,
    colorA: '#1e3a8a',
    colorB: '#fde047',
    quickSellCoins: 14000,
  },
  {
    id: 'ut-toty-rebootedpoppy',
    name: 'Rebootedpoppy TOTY',
    positionLabel: 'RB',
    role: 'DEF',
    ovr: 92,
    rarity: 'toty',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 2,
    pac: 95,
    sho: 75,
    pas: 89,
    dri: 88,
    def: 92,
    phy: 89,
    colorA: '#1e3a8a',
    colorB: '#fde047',
    quickSellCoins: 12000,
  },
  {
    id: 'ut-toty-joga',
    name: 'Joga Maestro TOTY',
    positionLabel: 'CAM',
    role: 'MID',
    ovr: 90,
    rarity: 'toty',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 7,
    pac: 90,
    sho: 89,
    pas: 94,
    dri: 93,
    def: 65,
    phy: 79,
    colorA: '#1e3a8a',
    colorB: '#fde047',
    quickSellCoins: 10500,
  },

  // TOTS CARDS (87-98)
  {
    id: 'ut-tots-ragequit',
    name: 'RageQuit TOTS',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 98,
    rarity: 'tots',
    clubId: 'gamer-rage-fc',
    clubName: 'Gamer Rage FC',
    nation: 'GMR',
    number: 10,
    pac: 98,
    sho: 98,
    pas: 90,
    dri: 96,
    def: 47,
    phy: 91,
    colorA: '#0369a1',
    colorB: '#facc15',
    quickSellCoins: 19000,
  },
  {
    id: 'ut-tots-lucky',
    name: 'Glitter Lucky TOTS',
    positionLabel: 'LW',
    role: 'FWD',
    ovr: 96,
    rarity: 'tots',
    clubId: 'glitter-force',
    clubName: 'Glitter Force',
    nation: 'RNB',
    number: 11,
    pac: 97,
    sho: 95,
    pas: 92,
    dri: 97,
    def: 46,
    phy: 83,
    colorA: '#0369a1',
    colorB: '#facc15',
    quickSellCoins: 16000,
  },
  {
    id: 'ut-tots-pghlboss',
    name: 'PGHL Boss TOTS',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 94,
    rarity: 'tots',
    clubId: 'pghlfilms-fans',
    clubName: 'Pghlfilms Fans',
    nation: 'BLK',
    number: 10,
    pac: 94,
    sho: 95,
    pas: 87,
    dri: 93,
    def: 44,
    phy: 90,
    colorA: '#0369a1',
    colorB: '#facc15',
    quickSellCoins: 13500,
  },
  {
    id: 'ut-tots-raven',
    name: 'Raven TOTS',
    positionLabel: 'CM',
    role: 'MID',
    ovr: 92,
    rarity: 'tots',
    clubId: 'teen-titans-go',
    clubName: 'Teen Titans Go',
    nation: 'TWN',
    number: 6,
    pac: 89,
    sho: 90,
    pas: 95,
    dri: 93,
    def: 84,
    phy: 85,
    colorA: '#0369a1',
    colorB: '#facc15',
    quickSellCoins: 11000,
  },
  {
    id: 'ut-tots-breeze',
    name: 'Glitter Breeze TOTS',
    positionLabel: 'CB',
    role: 'DEF',
    ovr: 90,
    rarity: 'tots',
    clubId: 'glitter-force',
    clubName: 'Glitter Force',
    nation: 'RNB',
    number: 5,
    pac: 88,
    sho: 64,
    pas: 84,
    dri: 81,
    def: 93,
    phy: 92,
    colorA: '#0369a1',
    colorB: '#facc15',
    quickSellCoins: 9200,
  },
  {
    id: 'ut-tots-lagspike',
    name: 'LagSpike TOTS',
    positionLabel: 'GK',
    role: 'GK',
    ovr: 88,
    rarity: 'tots',
    clubId: 'gamer-rage-fc',
    clubName: 'Gamer Rage FC',
    nation: 'GMR',
    number: 1,
    pac: 87,
    sho: 86,
    pas: 84,
    dri: 89,
    def: 88,
    phy: 89,
    colorA: '#0369a1',
    colorB: '#facc15',
    quickSellCoins: 7800,
  },
  {
    id: 'ut-tots-avocado',
    name: 'AvocadoPlayz TOTS',
    positionLabel: 'CAM',
    role: 'MID',
    ovr: 87,
    rarity: 'tots',
    clubId: 'avocadoplayz-fc',
    clubName: 'Avocadoplayz FC',
    nation: 'WII',
    number: 8,
    pac: 88,
    sho: 86,
    pas: 89,
    dri: 90,
    def: 68,
    phy: 79,
    colorA: '#0369a1',
    colorB: '#facc15',
    quickSellCoins: 6900,
  },
  // ICON CARDS (91-97)
  {
    id: 'ut-icon-playtime',
    name: 'Playtime',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 96,
    rarity: 'icon',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 10,
    pac: 97,
    sho: 96,
    pas: 91,
    dri: 98,
    def: 46,
    phy: 84,
    colorA: '#fef08a',
    colorB: '#f8fafc',
    quickSellCoins: 12000,
  },
  {
    id: 'ut-icon-glitter-sunny',
    name: 'Glitter Sunny',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 95,
    rarity: 'icon',
    clubId: 'glitter-force',
    clubName: 'Glitter Force',
    nation: 'RNB',
    number: 14,
    pac: 95,
    sho: 95,
    pas: 90,
    dri: 94,
    def: 48,
    phy: 88,
    colorA: '#fef08a',
    colorB: '#fb923c',
    quickSellCoins: 11000,
  },
  {
    id: 'ut-icon-3zld99',
    name: '3ZLD99',
    positionLabel: 'LW',
    role: 'FWD',
    ovr: 94,
    rarity: 'icon',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 11,
    pac: 98,
    sho: 91,
    pas: 89,
    dri: 96,
    def: 44,
    phy: 79,
    colorA: '#fef08a',
    colorB: '#ec4899',
    quickSellCoins: 10000,
  },
  {
    id: 'ut-icon-captain-caayvg',
    name: 'Captain CAAYVG',
    positionLabel: 'CAM',
    role: 'MID',
    ovr: 94,
    rarity: 'icon',
    clubId: 'cgy-united',
    clubName: 'CAAYVG United',
    nation: 'PXL',
    number: 10,
    pac: 92,
    sho: 92,
    pas: 96,
    dri: 95,
    def: 68,
    phy: 84,
    colorA: '#fde047',
    colorB: '#16a34a',
    quickSellCoins: 10000,
  },
  {
    id: 'ut-icon-flamingo2019',
    name: 'Flamingo2019',
    positionLabel: 'GK',
    role: 'GK',
    ovr: 93,
    rarity: 'icon',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 1,
    pac: 84,
    sho: 82,
    pas: 91,
    dri: 88,
    def: 94,
    phy: 92,
    colorA: '#fef08a',
    colorB: '#38bdf8',
    quickSellCoins: 9500,
  },
  {
    id: 'ut-icon-fateen',
    name: 'فطين',
    positionLabel: 'CF',
    role: 'FWD',
    ovr: 92,
    rarity: 'icon',
    clubId: 'cartoon-fateen',
    clubName: 'كرتون فطين',
    nation: 'OAS',
    number: 10,
    pac: 93,
    sho: 92,
    pas: 90,
    dri: 94,
    def: 50,
    phy: 82,
    colorA: '#fef08a',
    colorB: '#0d9488',
    quickSellCoins: 9000,
  },
  {
    id: 'ut-icon-beef-boss',
    name: 'Beef Boss',
    positionLabel: 'GK',
    role: 'GK',
    ovr: 91,
    rarity: 'icon',
    clubId: 'real-poofesurerid',
    clubName: 'Real Poofesurerid',
    nation: 'WII',
    number: 1,
    pac: 80,
    sho: 79,
    pas: 87,
    dri: 84,
    def: 92,
    phy: 94,
    colorA: '#fde047',
    colorB: '#f97316',
    quickSellCoins: 8500,
  },

  // HERO CARDS (88-91)
  {
    id: 'ut-hero-glitter-lucky',
    name: 'Glitter Lucky',
    positionLabel: 'LW',
    role: 'FWD',
    ovr: 91,
    rarity: 'hero',
    clubId: 'glitter-force',
    clubName: 'Glitter Force',
    nation: 'RNB',
    number: 11,
    pac: 94,
    sho: 89,
    pas: 88,
    dri: 93,
    def: 46,
    phy: 76,
    colorA: '#ec4899',
    colorB: '#7c3aed',
    quickSellCoins: 7200,
  },
  {
    id: 'ut-hero-ragequit',
    name: 'RageQuit',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 90,
    rarity: 'hero',
    clubId: 'gamer-rage-fc',
    clubName: 'Gamer Rage FC',
    nation: 'ARC',
    number: 10,
    pac: 92,
    sho: 91,
    pas: 81,
    dri: 89,
    def: 42,
    phy: 87,
    colorA: '#dc2626',
    colorB: '#22d3ee',
    quickSellCoins: 6800,
  },
  {
    id: 'ut-hero-robin',
    name: 'Robin',
    positionLabel: 'CAM',
    role: 'MID',
    ovr: 90,
    rarity: 'hero',
    clubId: 'teen-titans-go',
    clubName: 'Teen Titans Go',
    nation: 'JMP',
    number: 10,
    pac: 90,
    sho: 87,
    pas: 91,
    dri: 92,
    def: 72,
    phy: 83,
    colorA: '#ef4444',
    colorB: '#22c55e',
    quickSellCoins: 6800,
  },
  {
    id: 'ut-hero-flamingo2018',
    name: 'FLAMINGO2018',
    positionLabel: 'CB',
    role: 'DEF',
    ovr: 89,
    rarity: 'hero',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 5,
    pac: 84,
    sho: 56,
    pas: 79,
    dri: 76,
    def: 91,
    phy: 92,
    colorA: '#7c3aed',
    colorB: '#facc15',
    quickSellCoins: 6400,
  },
  {
    id: 'ut-hero-cyborg',
    name: 'Cyborg',
    positionLabel: 'GK',
    role: 'GK',
    ovr: 89,
    rarity: 'hero',
    clubId: 'teen-titans-go',
    clubName: 'Teen Titans Go',
    nation: 'JMP',
    number: 1,
    pac: 82,
    sho: 80,
    pas: 88,
    dri: 82,
    def: 90,
    phy: 93,
    colorA: '#2563eb',
    colorB: '#38bdf8',
    quickSellCoins: 6400,
  },
  {
    id: 'ut-hero-cryo-nova',
    name: 'Cryo Nova',
    positionLabel: 'RW',
    role: 'FWD',
    ovr: 88,
    rarity: 'hero',
    clubId: 'cryo-archive',
    clubName: 'Cryo Archive',
    nation: 'PXL',
    number: 10,
    pac: 93,
    sho: 87,
    pas: 86,
    dri: 90,
    def: 48,
    phy: 78,
    colorA: '#38bdf8',
    colorB: '#a855f7',
    quickSellCoins: 6000,
  },

  // TOTW CARDS (85-89)
  {
    id: 'ut-totw-ryth',
    name: 'RYTH',
    positionLabel: 'CB',
    role: 'DEF',
    ovr: 88,
    rarity: 'totw',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 8,
    pac: 85,
    sho: 65,
    pas: 84,
    dri: 81,
    def: 89,
    phy: 88,
    colorA: '#09090b',
    colorB: '#facc15',
    quickSellCoins: 5200,
  },
  {
    id: 'ut-totw-starfire',
    name: 'Starfire',
    positionLabel: 'CM',
    role: 'MID',
    ovr: 88,
    rarity: 'totw',
    clubId: 'teen-titans-go',
    clubName: 'Teen Titans Go',
    nation: 'JMP',
    number: 8,
    pac: 90,
    sho: 86,
    pas: 88,
    dri: 89,
    def: 65,
    phy: 81,
    colorA: '#09090b',
    colorB: '#f472b6',
    quickSellCoins: 5200,
  },
  {
    id: 'ut-totw-vini-pixel',
    name: 'Vini Pixel',
    positionLabel: 'CM',
    role: 'MID',
    ovr: 87,
    rarity: 'totw',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 6,
    pac: 89,
    sho: 82,
    pas: 88,
    dri: 91,
    def: 69,
    phy: 76,
    colorA: '#09090b',
    colorB: '#facc15',
    quickSellCoins: 4800,
  },
  {
    id: 'ut-totw-metro-star',
    name: 'Metro Star',
    positionLabel: 'RW',
    role: 'FWD',
    ovr: 87,
    rarity: 'totw',
    clubId: 'metro-blazers',
    clubName: 'Metro Blazers',
    nation: 'PXL',
    number: 10,
    pac: 91,
    sho: 86,
    pas: 83,
    dri: 88,
    def: 45,
    phy: 80,
    colorA: '#09090b',
    colorB: '#ef4444',
    quickSellCoins: 4800,
  },
  {
    id: 'ut-totw-rebootedpoppy',
    name: 'Rebootedpoppy',
    positionLabel: 'RB',
    role: 'DEF',
    ovr: 86,
    rarity: 'totw',
    clubId: 'brazil-fc',
    clubName: 'Brazil FC',
    nation: 'BRA',
    number: 2,
    pac: 89,
    sho: 64,
    pas: 82,
    dri: 84,
    def: 85,
    phy: 81,
    colorA: '#09090b',
    colorB: '#facc15',
    quickSellCoins: 4500,
  },
  {
    id: 'ut-totw-matt-wii',
    name: 'Matt Wii',
    positionLabel: 'CB',
    role: 'DEF',
    ovr: 86,
    rarity: 'totw',
    clubId: 'real-poofesurerid',
    clubName: 'Real Poofesurerid',
    nation: 'WII',
    number: 5,
    pac: 82,
    sho: 66,
    pas: 79,
    dri: 78,
    def: 88,
    phy: 90,
    colorA: '#09090b',
    colorB: '#f97316',
    quickSellCoins: 4500,
  },
  {
    id: 'ut-totw-brandon',
    name: 'Brandon',
    positionLabel: 'CAM',
    role: 'MID',
    ovr: 86,
    rarity: 'totw',
    clubId: 'glitter-force',
    clubName: 'Glitter Force',
    nation: 'RNB',
    number: 7,
    pac: 85,
    sho: 84,
    pas: 88,
    dri: 87,
    def: 66,
    phy: 79,
    colorA: '#09090b',
    colorB: '#facc15',
    quickSellCoins: 4500,
  },
  {
    id: 'ut-totw-pghl-boss',
    name: 'PGHL Boss',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 85,
    rarity: 'totw',
    clubId: 'pghlfilms-fans',
    clubName: 'Pghlfilms Fans',
    nation: 'ARC',
    number: 10,
    pac: 87,
    sho: 86,
    pas: 81,
    dri: 86,
    def: 44,
    phy: 82,
    colorA: '#09090b',
    colorB: '#22c55e',
    quickSellCoins: 4100,
  },

  // GOLD CARDS (78-85)
  {
    id: 'ut-gold-glitter-spring',
    name: 'Glitter Spring',
    positionLabel: 'GK',
    role: 'GK',
    ovr: 84,
    rarity: 'gold',
    clubId: 'glitter-force',
    clubName: 'Glitter Force',
    nation: 'RNB',
    number: 1,
    pac: 79,
    sho: 76,
    pas: 82,
    dri: 80,
    def: 85,
    phy: 84,
    colorA: '#eab308',
    colorB: '#854d0e',
    quickSellCoins: 2400,
  },
  {
    id: 'ut-gold-raven',
    name: 'Raven',
    positionLabel: 'CM',
    role: 'MID',
    ovr: 84,
    rarity: 'gold',
    clubId: 'teen-titans-go',
    clubName: 'Teen Titans Go',
    nation: 'JMP',
    number: 6,
    pac: 82,
    sho: 80,
    pas: 87,
    dri: 86,
    def: 76,
    phy: 79,
    colorA: '#eab308',
    colorB: '#581c87',
    quickSellCoins: 2400,
  },
  {
    id: 'ut-gold-king-orb',
    name: 'King Orb',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 84,
    rarity: 'gold',
    clubId: 'outpost-marathon',
    clubName: 'Outpost Marathon',
    nation: 'PXL',
    number: 10,
    pac: 85,
    sho: 85,
    pas: 79,
    dri: 84,
    def: 45,
    phy: 81,
    colorA: '#eab308',
    colorB: '#713f12',
    quickSellCoins: 2400,
  },
  {
    id: 'ut-gold-party-ace',
    name: 'PartyAce',
    positionLabel: 'CAM',
    role: 'MID',
    ovr: 83,
    rarity: 'gold',
    clubId: 'barcewiiparty',
    clubName: 'Barcewiiparty',
    nation: 'WII',
    number: 8,
    pac: 84,
    sho: 81,
    pas: 86,
    dri: 85,
    def: 62,
    phy: 75,
    colorA: '#eab308',
    colorB: '#1d4ed8',
    quickSellCoins: 2100,
  },
  {
    id: 'ut-gold-glitter-breeze',
    name: 'Glitter Breeze',
    positionLabel: 'CB',
    role: 'DEF',
    ovr: 83,
    rarity: 'gold',
    clubId: 'glitter-force',
    clubName: 'Glitter Force',
    nation: 'RNB',
    number: 5,
    pac: 80,
    sho: 55,
    pas: 78,
    dri: 75,
    def: 85,
    phy: 83,
    colorA: '#eab308',
    colorB: '#0284c7',
    quickSellCoins: 2100,
  },
  {
    id: 'ut-gold-beastboy',
    name: 'BeastBoy',
    positionLabel: 'CB',
    role: 'DEF',
    ovr: 82,
    rarity: 'gold',
    clubId: 'teen-titans-go',
    clubName: 'Teen Titans Go',
    nation: 'JMP',
    number: 5,
    pac: 84,
    sho: 60,
    pas: 76,
    dri: 79,
    def: 83,
    phy: 82,
    colorA: '#eab308',
    colorB: '#15803d',
    quickSellCoins: 1900,
  },
  {
    id: 'ut-gold-kid-flash',
    name: 'Kid Flash',
    positionLabel: 'LW',
    role: 'FWD',
    ovr: 82,
    rarity: 'gold',
    clubId: 'teen-titans-go',
    clubName: 'Teen Titans Go',
    nation: 'JMP',
    number: 11,
    pac: 96,
    sho: 77,
    pas: 79,
    dri: 86,
    def: 41,
    phy: 70,
    colorA: '#eab308',
    colorB: '#b91c1c',
    quickSellCoins: 1900,
  },
  {
    id: 'ut-gold-green-engine',
    name: 'Green Engine',
    positionLabel: 'CDM',
    role: 'MID',
    ovr: 81,
    rarity: 'gold',
    clubId: 'cgy-united',
    clubName: 'CAAYVG United',
    nation: 'PXL',
    number: 6,
    pac: 79,
    sho: 72,
    pas: 83,
    dri: 80,
    def: 82,
    phy: 84,
    colorA: '#eab308',
    colorB: '#166534',
    quickSellCoins: 1700,
  },
  {
    id: 'ut-gold-glitter-spark',
    name: 'Glitter Spark',
    positionLabel: 'LB',
    role: 'DEF',
    ovr: 81,
    rarity: 'gold',
    clubId: 'glitter-force',
    clubName: 'Glitter Force',
    nation: 'RNB',
    number: 4,
    pac: 85,
    sho: 63,
    pas: 78,
    dri: 79,
    def: 81,
    phy: 78,
    colorA: '#eab308',
    colorB: '#f59e0b',
    quickSellCoins: 1700,
  },
  {
    id: 'ut-gold-avocado',
    name: 'AvocadoPlayz',
    positionLabel: 'CAM',
    role: 'MID',
    ovr: 81,
    rarity: 'gold',
    clubId: 'avocadoplayz-fc',
    clubName: 'Avocadoplayz FC',
    nation: 'WII',
    number: 8,
    pac: 83,
    sho: 79,
    pas: 84,
    dri: 84,
    def: 58,
    phy: 74,
    colorA: '#eab308',
    colorB: '#65a30d',
    quickSellCoins: 1700,
  },
  {
    id: 'ut-gold-victor-8bit',
    name: 'Victor 8Bit',
    positionLabel: 'GK',
    role: 'GK',
    ovr: 80,
    rarity: 'gold',
    clubId: 'cgy-united',
    clubName: 'CAAYVG United',
    nation: 'PXL',
    number: 1,
    pac: 75,
    sho: 72,
    pas: 79,
    dri: 76,
    def: 81,
    phy: 82,
    colorA: '#eab308',
    colorB: '#0f172a',
    quickSellCoins: 1500,
  },
  {
    id: 'ut-gold-silkie',
    name: 'Silkie',
    positionLabel: 'LB',
    role: 'DEF',
    ovr: 79,
    rarity: 'gold',
    clubId: 'teen-titans-go',
    clubName: 'Teen Titans Go',
    nation: 'JMP',
    number: 3,
    pac: 83,
    sho: 57,
    pas: 76,
    dri: 78,
    def: 80,
    phy: 77,
    colorA: '#eab308',
    colorB: '#db2777',
    quickSellCoins: 1350,
  },
  {
    id: 'ut-gold-hashtag',
    name: 'HashTag',
    positionLabel: 'RB',
    role: 'DEF',
    ovr: 79,
    rarity: 'gold',
    clubId: 'cgy-united',
    clubName: 'CAAYVG United',
    nation: 'PXL',
    number: 2,
    pac: 82,
    sho: 60,
    pas: 77,
    dri: 78,
    def: 80,
    phy: 78,
    colorA: '#eab308',
    colorB: '#16a34a',
    quickSellCoins: 1350,
  },
  {
    id: 'ut-gold-crithit',
    name: 'CritHit',
    positionLabel: 'RW',
    role: 'FWD',
    ovr: 78,
    rarity: 'gold',
    clubId: 'gamer-rage-fc',
    clubName: 'Gamer Rage FC',
    nation: 'ARC',
    number: 9,
    pac: 84,
    sho: 79,
    pas: 75,
    dri: 80,
    def: 41,
    phy: 73,
    colorA: '#eab308',
    colorB: '#991b1b',
    quickSellCoins: 1200,
  },

  // SILVER CARDS (70-77)
  {
    id: 'ut-silver-abby',
    name: 'Abby',
    positionLabel: 'CM',
    role: 'MID',
    ovr: 76,
    rarity: 'silver',
    clubId: 'real-poofesurerid',
    clubName: 'Real Poofesurerid',
    nation: 'WII',
    number: 6,
    pac: 76,
    sho: 72,
    pas: 79,
    dri: 78,
    def: 65,
    phy: 72,
    colorA: '#cbd5e1',
    colorB: '#475569',
    quickSellCoins: 750,
  },
  {
    id: 'ut-silver-lucia',
    name: 'Lucia',
    positionLabel: 'CAM',
    role: 'MID',
    ovr: 76,
    rarity: 'silver',
    clubId: 'real-poofesurerid',
    clubName: 'Real Poofesurerid',
    nation: 'WII',
    number: 8,
    pac: 78,
    sho: 74,
    pas: 78,
    dri: 79,
    def: 58,
    phy: 70,
    colorA: '#cbd5e1',
    colorB: '#64748b',
    quickSellCoins: 750,
  },
  {
    id: 'ut-silver-csharp-wall',
    name: 'CSharp Wall',
    positionLabel: 'CB',
    role: 'DEF',
    ovr: 75,
    rarity: 'silver',
    clubId: 'cgy-united',
    clubName: 'CAAYVG United',
    nation: 'PXL',
    number: 5,
    pac: 71,
    sho: 49,
    pas: 70,
    dri: 67,
    def: 78,
    phy: 79,
    colorA: '#cbd5e1',
    colorB: '#334155',
    quickSellCoins: 650,
  },
  {
    id: 'ut-silver-pixel-ace',
    name: 'Pixel Ace',
    positionLabel: 'CM',
    role: 'MID',
    ovr: 75,
    rarity: 'silver',
    clubId: 'cgy-united',
    clubName: 'CAAYVG United',
    nation: 'PXL',
    number: 8,
    pac: 77,
    sho: 72,
    pas: 78,
    dri: 77,
    def: 64,
    phy: 71,
    colorA: '#cbd5e1',
    colorB: '#1e293b',
    quickSellCoins: 650,
  },
  {
    id: 'ut-silver-tunnel-jet',
    name: 'Tunnel Jet',
    positionLabel: 'LW',
    role: 'FWD',
    ovr: 74,
    rarity: 'silver',
    clubId: 'cgy-united',
    clubName: 'CAAYVG United',
    nation: 'PXL',
    number: 9,
    pac: 84,
    sho: 73,
    pas: 70,
    dri: 76,
    def: 39,
    phy: 69,
    colorA: '#cbd5e1',
    colorB: '#0f172a',
    quickSellCoins: 600,
  },
  {
    id: 'ut-silver-steel-rail',
    name: 'Steel Rail',
    positionLabel: 'CB',
    role: 'DEF',
    ovr: 74,
    rarity: 'silver',
    clubId: 'metro-blazers',
    clubName: 'Metro Blazers',
    nation: 'PXL',
    number: 5,
    pac: 72,
    sho: 50,
    pas: 68,
    dri: 66,
    def: 76,
    phy: 78,
    colorA: '#cbd5e1',
    colorB: '#3f3f46',
    quickSellCoins: 600,
  },
  {
    id: 'ut-silver-spark-plug',
    name: 'Spark Plug',
    positionLabel: 'RB',
    role: 'DEF',
    ovr: 73,
    rarity: 'silver',
    clubId: 'metro-blazers',
    clubName: 'Metro Blazers',
    nation: 'PXL',
    number: 2,
    pac: 79,
    sho: 56,
    pas: 70,
    dri: 72,
    def: 74,
    phy: 73,
    colorA: '#cbd5e1',
    colorB: '#52525b',
    quickSellCoins: 550,
  },
  {
    id: 'ut-silver-fateen-gk',
    name: 'Fateen GK',
    positionLabel: 'GK',
    role: 'GK',
    ovr: 73,
    rarity: 'silver',
    clubId: 'cartoon-fateen',
    clubName: 'كرتون فطين',
    nation: 'OAS',
    number: 1,
    pac: 69,
    sho: 65,
    pas: 72,
    dri: 70,
    def: 74,
    phy: 75,
    colorA: '#cbd5e1',
    colorB: '#115e59',
    quickSellCoins: 550,
  },
  {
    id: 'ut-silver-red-flash',
    name: 'Red Flash',
    positionLabel: 'RW',
    role: 'FWD',
    ovr: 72,
    rarity: 'silver',
    clubId: 'metro-blazers',
    clubName: 'Metro Blazers',
    nation: 'PXL',
    number: 11,
    pac: 82,
    sho: 71,
    pas: 68,
    dri: 75,
    def: 38,
    phy: 66,
    colorA: '#cbd5e1',
    colorB: '#7f1d1d',
    quickSellCoins: 500,
  },
  {
    id: 'ut-silver-glitter-peace',
    name: 'Glitter Peace',
    positionLabel: 'CB',
    role: 'DEF',
    ovr: 72,
    rarity: 'silver',
    clubId: 'glitter-force',
    clubName: 'Glitter Force',
    nation: 'RNB',
    number: 8,
    pac: 73,
    sho: 54,
    pas: 71,
    dri: 70,
    def: 74,
    phy: 73,
    colorA: '#cbd5e1',
    colorB: '#a16207',
    quickSellCoins: 500,
  },

  // BRONZE STARTER CARDS (64-69)
  {
    id: 'ut-bronze-orb-keeper',
    name: 'Orb Keeper',
    positionLabel: 'GK',
    role: 'GK',
    ovr: 68,
    rarity: 'bronze',
    clubId: 'outpost-marathon',
    clubName: 'Outpost Marathon',
    nation: 'PXL',
    number: 1,
    pac: 63,
    sho: 60,
    pas: 66,
    dri: 64,
    def: 69,
    phy: 70,
    colorA: '#d97706',
    colorB: '#451a03',
    quickSellCoins: 300,
  },
  {
    id: 'ut-bronze-relay-two',
    name: 'Relay Two',
    positionLabel: 'LB',
    role: 'DEF',
    ovr: 67,
    rarity: 'bronze',
    clubId: 'outpost-marathon',
    clubName: 'Outpost Marathon',
    nation: 'PXL',
    number: 3,
    pac: 72,
    sho: 49,
    pas: 64,
    dri: 66,
    def: 68,
    phy: 67,
    colorA: '#d97706',
    colorB: '#78350f',
    quickSellCoins: 280,
  },
  {
    id: 'ut-bronze-pitwall',
    name: 'PitWall',
    positionLabel: 'RB',
    role: 'DEF',
    ovr: 67,
    rarity: 'bronze',
    clubId: 'avocadoplayz-fc',
    clubName: 'Avocadoplayz FC',
    nation: 'WII',
    number: 2,
    pac: 71,
    sho: 48,
    pas: 63,
    dri: 64,
    def: 68,
    phy: 68,
    colorA: '#d97706',
    colorB: '#3f6212',
    quickSellCoins: 280,
  },
  {
    id: 'ut-bronze-brickwall',
    name: 'BrickWall',
    positionLabel: 'CB',
    role: 'DEF',
    ovr: 66,
    rarity: 'bronze',
    clubId: 'pghlfilms-fans',
    clubName: 'Pghlfilms Fans',
    nation: 'ARC',
    number: 5,
    pac: 62,
    sho: 44,
    pas: 59,
    dri: 57,
    def: 69,
    phy: 72,
    colorA: '#d97706',
    colorB: '#27272a',
    quickSellCoins: 250,
  },
  {
    id: 'ut-bronze-toastmid',
    name: 'ToastMid',
    positionLabel: 'CM',
    role: 'MID',
    ovr: 66,
    rarity: 'bronze',
    clubId: 'avocadoplayz-fc',
    clubName: 'Avocadoplayz FC',
    nation: 'WII',
    number: 6,
    pac: 67,
    sho: 62,
    pas: 68,
    dri: 67,
    def: 59,
    phy: 64,
    colorA: '#d97706',
    colorB: '#4d7c0f',
    quickSellCoins: 250,
  },
  {
    id: 'ut-bronze-subsquad',
    name: 'SubSquad',
    positionLabel: 'CDM',
    role: 'MID',
    ovr: 65,
    rarity: 'bronze',
    clubId: 'pghlfilms-fans',
    clubName: 'Pghlfilms Fans',
    nation: 'ARC',
    number: 6,
    pac: 65,
    sho: 59,
    pas: 66,
    dri: 65,
    def: 66,
    phy: 67,
    colorA: '#d97706',
    colorB: '#1e293b',
    quickSellCoins: 240,
  },
  {
    id: 'ut-bronze-limedash',
    name: 'LimeDash',
    positionLabel: 'RW',
    role: 'FWD',
    ovr: 65,
    rarity: 'bronze',
    clubId: 'avocadoplayz-fc',
    clubName: 'Avocadoplayz FC',
    nation: 'WII',
    number: 9,
    pac: 74,
    sho: 64,
    pas: 61,
    dri: 68,
    def: 36,
    phy: 60,
    colorA: '#d97706',
    colorB: '#365314',
    quickSellCoins: 240,
  },
  {
    id: 'ut-bronze-sliceshot',
    name: 'SliceShot',
    positionLabel: 'ST',
    role: 'FWD',
    ovr: 64,
    rarity: 'bronze',
    clubId: 'avocadoplayz-fc',
    clubName: 'Avocadoplayz FC',
    nation: 'WII',
    number: 11,
    pac: 71,
    sho: 66,
    pas: 58,
    dri: 65,
    def: 35,
    phy: 63,
    colorA: '#d97706',
    colorB: '#451a03',
    quickSellCoins: 220,
  },
];

const CARD_MAP = new Map<string, UtPlayerCard>(UT_CARD_CATALOG.map((c) => [c.id, c]));

export function getUtCardById(cardId: string): UtPlayerCard | undefined {
  return CARD_MAP.get(cardId);
}

const STARTER_SQUAD_IDS: string[] = [
  'ut-silver-fateen-gk',
  'ut-bronze-relay-two',
  'ut-silver-csharp-wall',
  'ut-silver-steel-rail',
  'ut-silver-spark-plug',
  'ut-gold-green-engine',
  'ut-silver-pixel-ace',
  'ut-silver-abby',
  'ut-silver-tunnel-jet',
  'ut-gold-crithit',
  'ut-silver-red-flash',
];

const STARTER_SUB_IDS: string[] = [
  'ut-bronze-orb-keeper',
  'ut-silver-lucia',
  'ut-gold-king-orb',
];

export function createDefaultUltimateTeamState(): UltimateTeamState {
  return {
    coins: 25000,
    clubName: 'CAAYVG ULTIMATE XI',
    formation: '4-3-3',
    ownedCardIds: [...STARTER_SQUAD_IDS, ...STARTER_SUB_IDS],
    activeSquadCardIds: [...STARTER_SQUAD_IDS],
    unopenedPacks: ['gold_premium'],
    rivals: {
      division: 10,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      winStreak: 0,
      weeklyClaimedTier: 0,
    },
    draft: null,
    packsOpenedCount: 0,
  };
}

function hashUt(n: number): number {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

export function openUtPack(
  packId: UtPackId,
  existingOwnedIds: string[],
  seed = Date.now()
): UtPackOpenResult {
  const packDef = UT_PACKS.find((p) => p.id === packId) ?? UT_PACKS[2];
  const eligible = UT_CARD_CATALOG.filter((c) => c.ovr >= packDef.minOvr);
  const guaranteedPool = UT_CARD_CATALOG.filter((c) => {
    if (packDef.id === 'futties_pack') {
      return c.rarity === 'futties' || c.rarity === 'futties_icon';
    }
    if (packDef.id === 'toty_tots_pack') {
      return c.rarity === 'toty' || c.rarity === 'toty_icon' || c.rarity === 'tots';
    }
    if (packDef.id === 'icon_mega') {
      return (
        c.rarity === 'icon' ||
        c.rarity === 'hero' ||
        c.rarity === 'toty_icon' ||
        c.rarity === 'toty'
      );
    }
    if (packDef.id === 'gold_premium') {
      return (
        c.rarity === 'gold' ||
        c.rarity === 'totw' ||
        c.rarity === 'hero' ||
        c.rarity === 'icon' ||
        c.rarity === 'tots'
      );
    }
    if (packDef.id === 'silver_pack') return c.rarity === 'silver' || c.rarity === 'gold' || c.rarity === 'totw';
    return c.ovr >= 66;
  });

  const picked: UtPlayerCard[] = [];
  const usedIds = new Set<string>();

  // Slot 0: Guaranteed tier card
  const gPool = guaranteedPool.length > 0 ? guaranteedPool : eligible;
  const gIdx = hashUt(seed * 73856093 + 17) % gPool.length;
  const firstCard = gPool[gIdx] ?? UT_CARD_CATALOG[0];
  picked.push(firstCard);
  usedIds.add(firstCard.id);

  // Slots 1..4: Weighted random pulls respecting pack tier
  for (let i = 1; i < packDef.cardCount; i++) {
    const h = hashUt(seed * 19349663 + i * 83492791 + 991);
    const tierRoll = h % 100;
    let pool = eligible;
    if (packDef.id === 'futties_pack' && tierRoll < 65) {
      pool = UT_CARD_CATALOG.filter(
        (c) =>
          c.rarity === 'futties' ||
          c.rarity === 'futties_icon' ||
          c.rarity === 'toty_icon' ||
          c.rarity === 'toty'
      );
    } else if (packDef.id === 'toty_tots_pack' && tierRoll < 60) {
      pool = UT_CARD_CATALOG.filter(
        (c) =>
          c.rarity === 'toty' ||
          c.rarity === 'toty_icon' ||
          c.rarity === 'tots' ||
          c.rarity === 'futties'
      );
    } else if (packDef.id === 'icon_mega' && tierRoll < 42) {
      pool = UT_CARD_CATALOG.filter(
        (c) =>
          c.rarity === 'icon' ||
          c.rarity === 'hero' ||
          c.rarity === 'totw' ||
          c.rarity === 'toty' ||
          c.rarity === 'toty_icon' ||
          c.rarity === 'tots'
      );
    } else if (packDef.id === 'gold_premium' && tierRoll < 32) {
      pool = UT_CARD_CATALOG.filter(
        (c) => c.rarity === 'totw' || c.rarity === 'hero' || c.rarity === 'icon' || c.rarity === 'tots'
      );
    } else if (packDef.id === 'silver_pack' && tierRoll < 30) {
      pool = UT_CARD_CATALOG.filter((c) => c.rarity === 'gold' || c.rarity === 'silver');
    }

    const candidates = pool.filter((c) => !usedIds.has(c.id));
    const finalPool = candidates.length > 0 ? candidates : UT_CARD_CATALOG.filter((c) => !usedIds.has(c.id));
    const card = finalPool[h % Math.max(1, finalPool.length)] ?? UT_CARD_CATALOG[i];
    picked.push(card);
    usedIds.add(card.id);
  }

  const walkoutCard = [...picked].sort((a, b) => b.ovr - a.ovr || b.pac - a.pac)[0];
  const ownedSet = new Set(existingOwnedIds);
  const duplicateIds: string[] = [];
  let duplicateRefundCoins = 0;

  for (const c of picked) {
    if (ownedSet.has(c.id)) {
      duplicateIds.push(c.id);
      duplicateRefundCoins += c.quickSellCoins;
    } else {
      ownedSet.add(c.id);
    }
  }

  return {
    packId,
    cards: picked,
    walkoutCard,
    duplicateIds,
    duplicateRefundCoins,
  };
}

export function calculateUtSquadStats(
  cardIds: string[],
  formation: FormationId = '4-3-3'
): {
  cards: UtPlayerCard[];
  ovr: number;
  chemistry: number;
  attack: number;
  defense: number;
  speed: number;
} {
  const cards = cardIds
    .map((id) => getUtCardById(id))
    .filter((c): c is UtPlayerCard => Boolean(c));
  if (cards.length === 0) {
    return { cards: [], ovr: 70, chemistry: 0, attack: 70, defense: 70, speed: 70 };
  }

  const formDef = FORMATIONS.find((f) => f.id === formation) ?? FORMATIONS[0];
  const ovr = Math.round(cards.reduce((sum, c) => sum + c.ovr, 0) / cards.length);
  const attack = Math.round(
    cards.reduce((sum, c) => sum + (c.role === 'FWD' || c.role === 'MID' ? c.sho : c.pas * 0.7), 0) /
      cards.length
  );
  const defense = Math.round(
    cards.reduce((sum, c) => sum + (c.role === 'GK' || c.role === 'DEF' ? c.def : c.phy * 0.75), 0) /
      cards.length
  );
  const speed = Math.round(cards.reduce((sum, c) => sum + c.pac, 0) / cards.length);

  // Chemistry (0..33): position fit (up to 22 pts) + shared club/nation links & Icons (up to 11 pts)
  let posFit = 0;
  const clubCounts = new Map<string, number>();
  const nationCounts = new Map<string, number>();
  let iconBonus = 0;

  cards.forEach((c, idx) => {
    const slotRole = formDef.slotPositions[idx]?.role;
    if (slotRole && c.role === slotRole) posFit += 2;
    else if (slotRole && ((slotRole === 'MID' && c.role === 'FWD') || (slotRole === 'FWD' && c.role === 'MID'))) {
      posFit += 1;
    }
    clubCounts.set(c.clubId, (clubCounts.get(c.clubId) ?? 0) + 1);
    nationCounts.set(c.nation, (nationCounts.get(c.nation) ?? 0) + 1);
    if (
      c.rarity === 'icon' ||
      c.rarity === 'hero' ||
      c.rarity === 'toty_icon' ||
      c.rarity === 'futties_icon'
    ) {
      iconBonus += 1.5;
    }
  });

  let linkBonus = iconBonus;
  for (const cnt of clubCounts.values()) {
    if (cnt >= 2) linkBonus += cnt - 1;
  }
  for (const cnt of nationCounts.values()) {
    if (cnt >= 3) linkBonus += Math.floor(cnt / 2);
  }

  const chemistry = Math.max(0, Math.min(33, Math.round(posFit + linkBonus)));
  return {
    cards,
    ovr: Math.max(50, Math.min(99, ovr)),
    chemistry,
    attack: Math.max(60, Math.min(99, attack)),
    defense: Math.max(60, Math.min(99, defense)),
    speed: Math.max(60, Math.min(99, speed)),
  };
}

export function utCardsToMatchLineup(
  cardIds: string[],
  formation: '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1'
): SquadSlotSpec[] {
  const formDef = FORMATIONS.find((f) => f.id === formation) ?? FORMATIONS[0];
  const resolved = formDef.slotPositions.map((pos, idx) => {
    const card = getUtCardById(cardIds[idx]) ?? UT_CARD_CATALOG[idx % UT_CARD_CATALOG.length];
    return {
      slotIndex: idx,
      number: card.number,
      positionLabel: card.positionLabel,
      name: card.name,
      role: pos.role,
      aiPolicy: pos.aiPolicy,
      isCaptain: idx === 10 || idx === 0,
      rx: pos.rx,
      ry: pos.ry,
    };
  });
  // Exactly 1 captain (highest OVR player)
  let bestIdx = 0;
  let bestOvr = -1;
  formDef.slotPositions.forEach((_, idx) => {
    const card = getUtCardById(cardIds[idx]);
    if (card && card.ovr > bestOvr) {
      bestOvr = card.ovr;
      bestIdx = idx;
    }
  });
  return resolved.map((s, idx) => ({ ...s, isCaptain: idx === bestIdx }));
}

export function buildAutoBestUtSquad(
  ownedCardIds: string[],
  formation: '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1'
): string[] {
  const formDef = FORMATIONS.find((f) => f.id === formation) ?? FORMATIONS[0];
  const ownedCards = ownedCardIds
    .map((id) => getUtCardById(id))
    .filter((c): c is UtPlayerCard => Boolean(c))
    .sort((a, b) => b.ovr - a.ovr);

  const used = new Set<string>();
  const lineupIds: string[] = [];

  for (const pos of formDef.slotPositions) {
    const exact = ownedCards.find((c) => !used.has(c.id) && c.role === pos.role);
    const fallback = exact ?? ownedCards.find((c) => !used.has(c.id)) ?? UT_CARD_CATALOG[0];
    used.add(fallback.id);
    lineupIds.push(fallback.id);
  }
  return lineupIds;
}

// ==========================================
// FUT DRAFT (11 ROUNDS · PICK 1 OF 4 CARDS)
// ==========================================
export function generateDraftChoicesForRound(
  formation: '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1',
  round: number,
  alreadyPickedIds: string[],
  seed = Date.now()
): UtPlayerCard[] {
  const formDef = FORMATIONS.find((f) => f.id === formation) ?? FORMATIONS[0];
  const targetRole: PlayerRole = formDef.slotPositions[round]?.role ?? 'MID';
  const pickedSet = new Set(alreadyPickedIds);

  const rolePool = UT_CARD_CATALOG.filter((c) => c.role === targetRole && !pickedSet.has(c.id));
  const starPool = UT_CARD_CATALOG.filter((c) => c.ovr >= 82 && !pickedSet.has(c.id));
  const generalPool = UT_CARD_CATALOG.filter((c) => !pickedSet.has(c.id));

  const choices: UtPlayerCard[] = [];
  const chosenSet = new Set<string>();

  for (let i = 0; i < 4; i++) {
    const h = hashUt(seed * 7919 + round * 997 + i * 313 + 71);
    const sourcePool =
      i < 2 && rolePool.length >= 2
        ? rolePool
        : i === 2 && starPool.length > 0
        ? starPool
        : generalPool;
    const avail = sourcePool.filter((c) => !chosenSet.has(c.id));
    const fallbackAvail = avail.length > 0 ? avail : generalPool.filter((c) => !chosenSet.has(c.id));
    const card = fallbackAvail[h % Math.max(1, fallbackAvail.length)] ?? UT_CARD_CATALOG[i];
    choices.push(card);
    chosenSet.add(card.id);
  }
  return choices;
}

export function createNewDraftSession(
  formation: '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1',
  seed = Date.now()
): UtDraftSession {
  return {
    id: `draft-${seed}`,
    formation,
    round: 0,
    pickedCardIds: [],
    currentChoices: generateDraftChoicesForRound(formation, 0, [], seed),
    completedMatches: 0,
    wins: 0,
  };
}

export function pickDraftCard(
  session: UtDraftSession,
  cardId: string,
  seed = Date.now()
): UtDraftSession {
  if (session.round >= 11) return session;
  const chosen =
    session.currentChoices.find((c) => c.id === cardId) ?? session.currentChoices[0];
  if (!chosen) return session;
  const nextPicked = [...session.pickedCardIds, chosen.id];
  const nextRound = session.round + 1;
  return {
    ...session,
    round: nextRound,
    pickedCardIds: nextPicked,
    currentChoices:
      nextRound < 11
        ? generateDraftChoicesForRound(session.formation, nextRound, nextPicked, seed + nextRound * 37)
        : [],
  };
}

export function autoPickRemainingDraft(session: UtDraftSession, seed = Date.now()): UtDraftSession {
  let cur = session;
  let step = 1;
  while (cur.round < 11) {
    const best = [...cur.currentChoices].sort((a, b) => b.ovr - a.ovr)[0];
    if (!best) break;
    cur = pickDraftCard(cur, best.id, seed + step * 41);
    step++;
  }
  return cur;
}

// ==========================================
// DIVISION RIVALS (DIV 10 -> DIV 1 + ELITE)
// ==========================================
export interface RivalsDivisionInfo {
  division: number;
  label: string;
  targetPoints: number;
  rank1RewardCoins: number;
  opponentOvr: number;
}

export const RIVALS_DIVISIONS: RivalsDivisionInfo[] = [
  { division: 10, label: 'DIVISION 10', targetPoints: 600, rank1RewardCoins: 4000, opponentOvr: 73 },
  { division: 9, label: 'DIVISION 9', targetPoints: 650, rank1RewardCoins: 4500, opponentOvr: 75 },
  { division: 8, label: 'DIVISION 8', targetPoints: 700, rank1RewardCoins: 5200, opponentOvr: 77 },
  { division: 7, label: 'DIVISION 7', targetPoints: 750, rank1RewardCoins: 6000, opponentOvr: 79 },
  { division: 6, label: 'DIVISION 6', targetPoints: 800, rank1RewardCoins: 7000, opponentOvr: 81 },
  { division: 5, label: 'DIVISION 5', targetPoints: 850, rank1RewardCoins: 8200, opponentOvr: 83 },
  { division: 4, label: 'DIVISION 4', targetPoints: 900, rank1RewardCoins: 9500, opponentOvr: 85 },
  { division: 3, label: 'DIVISION 3', targetPoints: 950, rank1RewardCoins: 11000, opponentOvr: 87 },
  { division: 2, label: 'DIVISION 2', targetPoints: 1000, rank1RewardCoins: 13000, opponentOvr: 89 },
  { division: 1, label: 'DIVISION 1', targetPoints: 1100, rank1RewardCoins: 16000, opponentOvr: 91 },
  { division: 0, label: 'ELITE DIVISION', targetPoints: 1250, rank1RewardCoins: 22000, opponentOvr: 93 },
];

export function getRivalsDivisionInfo(division: number): RivalsDivisionInfo {
  return RIVALS_DIVISIONS.find((d) => d.division === division) ?? RIVALS_DIVISIONS[0];
}

export function getRivalsRankTier(points: number): 0 | 1 | 2 | 3 {
  if (points >= 1250) return 3; // Rank I
  if (points >= 750) return 2; // Rank II
  if (points >= 350) return 1; // Rank III
  return 0;
}

export function applyUtMatchResult(
  state: UltimateTeamState,
  subMode: 'squad' | 'draft' | 'rivals',
  homeScore: number,
  awayScore: number
): {
  nextState: UltimateTeamState;
  coinsEarned: number;
  pointsEarned: number;
  promotedToDivision: number | null;
  packEarned: UtPackId | null;
} {
  const won = homeScore > awayScore;
  const drew = homeScore === awayScore;

  if (subMode === 'rivals') {
    const coinsEarned = won ? 1800 : drew ? 900 : 450;
    const pointsEarned = won ? 350 : drew ? 180 : 90;
    const nextStreak = won ? state.rivals.winStreak + 1 : 0;
    const nextPoints = state.rivals.points + pointsEarned;
    const divInfo = getRivalsDivisionInfo(state.rivals.division);
    const canPromote =
      state.rivals.division > 0 && (won && (nextStreak >= 2 || nextPoints >= divInfo.targetPoints));
    const nextDiv = canPromote ? state.rivals.division - 1 : state.rivals.division;
    const promotedToDivision = canPromote ? nextDiv : null;
    const packEarned: UtPackId | null = canPromote ? 'silver_pack' : null;

    return {
      nextState: {
        ...state,
        coins: state.coins + coinsEarned,
        unopenedPacks: packEarned ? [...state.unopenedPacks, packEarned] : state.unopenedPacks,
        rivals: {
          ...state.rivals,
          division: nextDiv,
          points: nextPoints,
          wins: state.rivals.wins + (won ? 1 : 0),
          draws: state.rivals.draws + (drew ? 1 : 0),
          losses: state.rivals.losses + (!won && !drew ? 1 : 0),
          winStreak: nextStreak,
        },
      },
      coinsEarned,
      pointsEarned,
      promotedToDivision,
      packEarned,
    };
  }

  if (subMode === 'draft') {
    const coinsEarned = won ? 5500 : drew ? 2400 : 1200;
    const packEarned: UtPackId | null = won ? 'gold_premium' : 'bronze_pack';
    return {
      nextState: {
        ...state,
        coins: state.coins + coinsEarned,
        unopenedPacks: packEarned ? [...state.unopenedPacks, packEarned] : state.unopenedPacks,
        draft: state.draft
          ? {
              ...state.draft,
              completedMatches: state.draft.completedMatches + 1,
              wins: state.draft.wins + (won ? 1 : 0),
            }
          : null,
      },
      coinsEarned,
      pointsEarned: 0,
      promotedToDivision: null,
      packEarned,
    };
  }

  // Standard UT Squad match
  const coinsEarned = won ? 1400 : drew ? 700 : 350;
  return {
    nextState: {
      ...state,
      coins: state.coins + coinsEarned,
    },
    coinsEarned,
    pointsEarned: 0,
    promotedToDivision: null,
    packEarned: null,
  };
}

export function buildUtHomeTeam(
  clubName: string,
  ovr: number,
  attack: number,
  defense: number,
  speed: number
): Team {
  return {
    id: 'ut-user-xi',
    name: clubName || 'CAAYVG ULTIMATE XI',
    shortCode: 'UTX',
    division: 'premier',
    primaryColor: '#eab308',
    secondaryColor: '#0f172a',
    trimColor: '#38bdf8',
    crest: 'crown',
    attack: Math.max(attack, ovr),
    defense: Math.max(defense, ovr - 2),
    speed: Math.max(speed, ovr),
  };
}

export function buildRivalsCpuTeam(division: number): Team {
  const info = getRivalsDivisionInfo(division);
  const ovr = info.opponentOvr;
  return {
    id: `ut-rivals-cpu-div${division}`,
    name: `Rivals ${info.label} XI`,
    shortCode: division === 0 ? 'ELT' : `D${division}`,
    division: 'premier',
    primaryColor: division <= 2 ? '#a855f7' : division <= 5 ? '#ef4444' : '#2563eb',
    secondaryColor: '#09090b',
    trimColor: '#facc15',
    crest: 'shield',
    attack: ovr,
    defense: ovr - 1,
    speed: ovr,
  };
}
