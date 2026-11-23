import {
  FORMATIONS,
  GAME_VERSION,
  LED_NEW_SHAPE_PATTERNS,
  TACTICS,
  getTeamLineup,
  type LedNewShapePatternKind,
  type LedSponsorAd,
} from './data';
import { getSodaFlavorVariant, type TurntableItemKind } from './shoeTurntablePixels';
import type {
  BenchSlotSpec,
  CameraAngleId,
  CompetitionId,
  CupBracketState,
  CupGroupState,
  CupMatchNode,
  FormationId,
  FoulDecision,
  GameDifficulty,
  GlobalClubRanking,
  GroupTableRow,
  LeagueFixtureNode,
  LeagueRoundSchedule,
  LeagueStanding,
  MatchResultSummary,
  OutOfBoundsDecision,
  PlayerCareerStats,
  RivalryDefinition,
  SquadSlotSpec,
  StadiumTheme,
  TacticId,
  Team,
  TeamSide,
} from './types';

export { GAME_VERSION };

// Virtual 8-bit display viewport (512 x 288 16:9 frame) over a longer 960-unit pitch world
export const WORLD_WIDTH = 960;
export const VIRTUAL_WIDTH = 512;
export const VIRTUAL_HEIGHT = 288;

export const PITCH = {
  left: 60,
  right: 900,
  top: 72,
  bottom: 266,
  centerX: 480,
  centerY: 169,
  goalHalfHeight: 26,
  goalDepth: 18,
  penaltyBoxWidth: 84,
  penaltyBoxHalfHeight: 58,
  sixYardWidth: 32,
  sixYardHalfHeight: 32,
  penaltySpotOffset: 60,
  centerCircleRadius: 38,
};

export interface CameraProfile {
  id: CameraAngleId;
  zoom: number;
  leadX: number;
  offsetY: number;
  followY: number;
}

export const CAMERA_PROFILES: Record<CameraAngleId, CameraProfile> = {
  tele_broadcast: { id: 'tele_broadcast', zoom: 1.0, leadX: 38, offsetY: 0, followY: 0.36 },
  tactical_wide: { id: 'tactical_wide', zoom: 0.72, leadX: 16, offsetY: -4, followY: 0.16 },
  pro_dynamic: { id: 'pro_dynamic', zoom: 1.24, leadX: 28, offsetY: 6, followY: 0.58 },
  end_to_end: { id: 'end_to_end', zoom: 1.06, leadX: 90, offsetY: 2, followY: 0.45 },
  pitchside_low: { id: 'pitchside_low', zoom: 1.16, leadX: 42, offsetY: 15, followY: 0.72 },
};

export interface CameraViewport {
  angle: CameraAngleId;
  camX: number;
  camY: number;
  zoom: number;
  viewLeft: number;
  viewTop: number;
  viewWidth: number;
  viewHeight: number;
}

export function computeCameraViewport(params: {
  angle: CameraAngleId;
  targetX: number;
  targetY: number;
  attackDir: number;
  worldWidth?: number;
  worldHeight?: number;
  viewWidth?: number;
  viewHeight?: number;
}): CameraViewport {
  const {
    angle,
    targetX,
    targetY,
    attackDir,
    worldWidth = WORLD_WIDTH,
    worldHeight = VIRTUAL_HEIGHT,
    viewWidth = VIRTUAL_WIDTH,
    viewHeight = VIRTUAL_HEIGHT,
  } = params;
  const profile = CAMERA_PROFILES[angle] ?? CAMERA_PROFILES.tele_broadcast;
  const zoom = profile.zoom;
  const visW = viewWidth / zoom;
  const visH = viewHeight / zoom;
  const halfVisW = visW / 2;
  const halfVisH = visH / 2;

  const desiredX = targetX + attackDir * profile.leadX;
  const desiredY =
    PITCH.centerY + (targetY - PITCH.centerY) * profile.followY - 25 + profile.offsetY;

  const camX =
    visW >= worldWidth
      ? worldWidth / 2
      : Math.max(halfVisW, Math.min(worldWidth - halfVisW, desiredX));
  const camY =
    visH >= worldHeight
      ? worldHeight / 2 + profile.offsetY
      : Math.max(halfVisH, Math.min(worldHeight - halfVisH, desiredY));

  return {
    angle,
    camX,
    camY,
    zoom,
    viewLeft: camX - halfVisW,
    viewTop: camY - halfVisH,
    viewWidth: visW,
    viewHeight: visH,
  };
}

export function createInitialStandings(teams: Team[]): LeagueStanding[] {
  return teams.map((t) => ({
    teamId: t.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));
}

export function sortStandings(standings: LeagueStanding[]): LeagueStanding[] {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamId.localeCompare(b.teamId);
  });
}

export function recordLeagueMatchResult(
  standings: LeagueStanding[],
  homeId: string,
  awayId: string,
  homeGoals: number,
  awayGoals: number
): LeagueStanding[] {
  const next = standings.map((row) => ({ ...row }));
  const home = next.find((r) => r.teamId === homeId);
  const away = next.find((r) => r.teamId === awayId);
  if (!home || !away) return sortStandings(next);

  home.played += 1;
  away.played += 1;
  home.goalsFor += homeGoals;
  home.goalsAgainst += awayGoals;
  away.goalsFor += awayGoals;
  away.goalsAgainst += homeGoals;

  if (homeGoals > awayGoals) {
    home.won += 1;
    home.points += 3;
    away.lost += 1;
  } else if (awayGoals > homeGoals) {
    away.won += 1;
    away.points += 3;
    home.lost += 1;
  } else {
    home.drawn += 1;
    away.drawn += 1;
    home.points += 1;
    away.points += 1;
  }

  return sortStandings(next);
}

export function simulateOtherLeagueFixtures(
  standings: LeagueStanding[],
  teams: Team[],
  excludeTeamIds: Set<string>,
  seed: number = Date.now()
): LeagueStanding[] {
  const available = teams.filter((t) => !excludeTeamIds.has(t.id));
  const shuffled = [...available];
  let s = Math.abs(seed) % 2147483647 || 1337;
  const nextRand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  let updated = [...standings];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    const home = shuffled[i];
    const away = shuffled[i + 1];
    const homeEdge = (home.attack - away.defense) * 0.04;
    const awayEdge = (away.attack - home.defense) * 0.04;
    const hGoals = Math.max(0, Math.min(5, Math.floor(nextRand() * 3.2 + Math.max(0, homeEdge))));
    const aGoals = Math.max(0, Math.min(5, Math.floor(nextRand() * 2.9 + Math.max(0, awayEdge))));
    updated = recordLeagueMatchResult(updated, home.id, away.id, hGoals, aGoals);
  }
  return updated;
}

const MONTH_NAMES = ['AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY'];
const KICKOFF_TIMES = ['15:00', '17:30', '19:45', '20:30', '21:00'];

export function getLeagueRoundDateTime(round: number): { dateLabel: string; timeLabel: string } {
  const clamped = Math.max(1, Math.min(38, round));
  const totalDays = (clamped - 1) * 7;
  const monthIdx = Math.min(MONTH_NAMES.length - 1, Math.floor(totalDays / 28));
  const dayNum = ((totalDays + 14) % 28) + 1;
  const year = monthIdx <= 4 ? 2026 : 2027;
  const monthStr = MONTH_NAMES[monthIdx];
  const dateLabel = `${monthStr} ${dayNum < 10 ? `0${dayNum}` : dayNum}, ${year}`;
  const timeLabel = clamped === 38 ? '20:00' : KICKOFF_TIMES[(clamped - 1) % KICKOFF_TIMES.length];
  return { dateLabel, timeLabel };
}

export function getCupRoundDateTime(
  competitionId: CompetitionId | 'singleplayer',
  roundIndex: number,
  isGroup = false
): { dateLabel: string; timeLabel: string } {
  if (competitionId === 'super_cup') {
    return { dateLabel: 'AUG 08, 2026', timeLabel: '20:30' };
  }
  if (isGroup) {
    const days = ['SEP 16, 2026', 'OCT 07, 2026', 'NOV 04, 2026'];
    return { dateLabel: days[roundIndex % days.length], timeLabel: '19:45' };
  }
  const koDates = ['DEC 12, 2026', 'FEB 17, 2027', 'APR 14, 2027', 'MAY 29, 2027'];
  const koTimes = ['18:30', '19:45', '20:30', '21:00'];
  const idx = Math.max(0, Math.min(koDates.length - 1, roundIndex));
  return { dateLabel: koDates[idx], timeLabel: koTimes[idx] };
}

export function getPromotedTeamIds(expansionStandings: LeagueStanding[]): string[] {
  return sortStandings(expansionStandings)
    .slice(0, 4)
    .map((s) => s.teamId);
}

export function sortGroupStandings(rows: GroupTableRow[]): GroupTableRow[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamId.localeCompare(b.teamId);
  });
}

function createGroupsForTeams(
  competitionId: 'king_cup' | 'anime_cup',
  participants: Team[]
): CupGroupState[] {
  const groupCount = participants.length >= 16 ? 4 : 2;
  const groupNames = ['GROUP A', 'GROUP B', 'GROUP C', 'GROUP D'];
  const groups: CupGroupState[] = [];

  for (let g = 0; g < groupCount; g++) {
    const slice = participants.slice(g * 4, g * 4 + 4);
    const ids = slice.map((t) => t.id);
    const pairings: [number, number, number][] = [
      [0, 1, 0], [2, 3, 0],
      [0, 2, 1], [1, 3, 1],
      [0, 3, 2], [1, 2, 2],
    ];
    const matches: CupMatchNode[] = pairings.map(([hi, ai, md], idx) => {
      const dt = getCupRoundDateTime(competitionId, md, true);
      return {
        id: `${competitionId}-g${g}-m${idx}`,
        roundIndex: md,
        roundName: 'GROUP STAGES',
        groupName: groupNames[g],
        homeTeamId: ids[hi],
        awayTeamId: ids[ai],
        homeScore: null,
        awayScore: null,
        winnerId: null,
        played: false,
        dateLabel: dt.dateLabel,
        timeLabel: dt.timeLabel,
      };
    });
    const standings: GroupTableRow[] = ids.map((tid) => ({
      teamId: tid,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    }));
    groups.push({
      groupName: groupNames[g],
      teamIds: ids,
      standings,
      matches,
    });
  }
  return groups;
}

function pickOrderedCupParticipants(teams: Team[], userTeamId: string, size: number): Team[] {
  const userTeam = teams.find((t) => t.id === userTeamId) ?? teams[0];
  const rawOthers = teams.filter((t) => t.id !== userTeam.id);
  const firstIdx = rawOthers.findIndex(
    (t) =>
      !(
        (userTeam.id === 'cgy-united' && t.id === 'metro-blazers') ||
        (userTeam.id === 'metro-blazers' && t.id === 'cgy-united') ||
        (userTeam.id === 'brazil-fc' && t.id === 'glitter-force') ||
        (userTeam.id === 'glitter-force' && t.id === 'brazil-fc')
      )
  );
  const others =
    firstIdx > 0
      ? [rawOthers[firstIdx], ...rawOthers.slice(0, firstIdx), ...rawOthers.slice(firstIdx + 1)]
      : rawOthers;
  return [userTeam, ...others.slice(0, size - 1)];
}

export function createKnockoutMatchesFromRound(
  competitionId: 'king_cup' | 'anime_cup' | 'singleplayer',
  participants: Team[],
  startRound: 'R16' | 'QF' | 'SF' | 'FINAL'
): CupMatchNode[] {
  const roundNames =
    startRound === 'R16'
      ? ['ROUND OF 16', 'QUARTER-FINALS', 'SEMI-FINALS', 'FINAL']
      : startRound === 'QF'
      ? ['QUARTER-FINALS', 'SEMI-FINALS', 'FINAL']
      : startRound === 'SF'
      ? ['SEMI-FINALS', 'FINAL']
      : ['FINAL'];
  const size = Math.pow(2, roundNames.length);
  const matches: CupMatchNode[] = [];
  const totalRounds = roundNames.length;
  const dateOffset = startRound === 'R16' ? 0 : startRound === 'QF' ? 1 : startRound === 'SF' ? 2 : 3;

  for (let r = 0; r < totalRounds; r++) {
    const matchCount = size / Math.pow(2, r + 1);
    const dt = getCupRoundDateTime(competitionId, r + dateOffset, false);
    for (let m = 0; m < matchCount; m++) {
      matches.push({
        id: `${competitionId}-ko-${startRound}-r${r}-m${m}`,
        roundIndex: r,
        roundName: roundNames[r],
        homeTeamId: r === 0 ? participants[m * 2]?.id ?? null : null,
        awayTeamId: r === 0 ? participants[m * 2 + 1]?.id ?? null : null,
        homeScore: null,
        awayScore: null,
        winnerId: null,
        played: false,
        dateLabel: dt.dateLabel,
        timeLabel: dt.timeLabel,
      });
    }
  }
  return matches;
}

export function jumpCupBracketToRound(
  competitionId: 'king_cup' | 'anime_cup',
  teams: Team[],
  userTeamId: string,
  targetRound: 'GROUP' | 'R16' | 'QF' | 'SF' | 'FINAL'
): CupBracketState {
  if (targetRound === 'GROUP') {
    return createCupBracket(competitionId, teams, userTeamId);
  }
  const size =
    targetRound === 'R16' ? 16 : targetRound === 'QF' ? 8 : targetRound === 'SF' ? 4 : 2;
  const participants = pickOrderedCupParticipants(teams, userTeamId, size);
  return {
    competitionId,
    stageMode: 'knockout',
    groups: undefined,
    matches: createKnockoutMatchesFromRound(competitionId, participants, targetRound),
    championId: null,
  };
}

export function createCupBracket(
  competitionId: 'king_cup' | 'super_cup' | 'anime_cup' | 'singleplayer',
  teams: Team[],
  userTeamId: string
): CupBracketState {
  const userTeam = teams.find((t) => t.id === userTeamId) ?? teams[0];

  if (competitionId === 'super_cup') {
    const participants = pickOrderedCupParticipants(teams, userTeam.id, 2);
    const dt = getCupRoundDateTime('super_cup', 0, false);
    return {
      competitionId,
      stageMode: 'knockout',
      championId: null,
      matches: [
        {
          id: 'sc-final',
          roundIndex: 0,
          roundName: 'SUPER CUP FINAL',
          homeTeamId: participants[0].id,
          awayTeamId: participants[1].id,
          homeScore: null,
          awayScore: null,
          winnerId: null,
          played: false,
          dateLabel: dt.dateLabel,
          timeLabel: dt.timeLabel,
        },
      ],
    };
  }

  if (competitionId === 'king_cup' || competitionId === 'anime_cup') {
    const groupTeamSize = competitionId === 'king_cup' ? 16 : 8;
    const participants = pickOrderedCupParticipants(teams, userTeam.id, groupTeamSize);
    const groups = createGroupsForTeams(competitionId, participants);
    const koMatches = createKnockoutMatchesFromRound(
      competitionId,
      [],
      competitionId === 'king_cup' ? 'QF' : 'SF'
    );
    return {
      competitionId,
      stageMode: 'group',
      groups,
      matches: koMatches,
      championId: null,
    };
  }

  // Singleplayer tournament (16-club pure knockout)
  const participants = pickOrderedCupParticipants(teams, userTeam.id, 16);
  return {
    competitionId,
    stageMode: 'knockout',
    matches: createKnockoutMatchesFromRound('singleplayer', participants, 'R16'),
    championId: null,
  };
}

export function getNextPendingCupMatch(
  bracket: CupBracketState,
  userTeamId: string
): CupMatchNode | null {
  if (bracket.stageMode === 'group' && bracket.groups) {
    for (const grp of bracket.groups) {
      const m = grp.matches.find(
        (gm) => !gm.played && (gm.homeTeamId === userTeamId || gm.awayTeamId === userTeamId)
      );
      if (m) return m;
    }
  }
  return (
    bracket.matches.find(
      (m) => !m.played && (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId)
    ) ?? null
  );
}

function applyResultToGroupRows(
  rows: GroupTableRow[],
  homeId: string,
  awayId: string,
  hs: number,
  as: number
): GroupTableRow[] {
  const next = rows.map((r) => ({ ...r }));
  const h = next.find((r) => r.teamId === homeId);
  const a = next.find((r) => r.teamId === awayId);
  if (!h || !a) return sortGroupStandings(next);
  h.played += 1;
  a.played += 1;
  h.goalsFor += hs;
  h.goalsAgainst += as;
  a.goalsFor += as;
  a.goalsAgainst += hs;
  if (hs > as) {
    h.won += 1;
    h.points += 3;
    a.lost += 1;
  } else if (as > hs) {
    a.won += 1;
    a.points += 3;
    h.lost += 1;
  } else {
    h.drawn += 1;
    a.drawn += 1;
    h.points += 1;
    a.points += 1;
  }
  return sortGroupStandings(next);
}

export function recordCupMatchResult(
  bracket: CupBracketState,
  matchId: string,
  homeScore: number,
  awayScore: number,
  winnerId: string,
  teams: Team[],
  seed: number = 42,
  userTeamId?: string
): CupBracketState {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  let s = Math.abs(seed) % 2147483647 || 777;
  const nextRand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  // Handle Group Stage match completion first
  if (bracket.stageMode === 'group' && bracket.groups) {
    let foundRoundIdx: number | null = null;
    for (const grp of bracket.groups) {
      const m = grp.matches.find((gm) => gm.id === matchId);
      if (m) {
        foundRoundIdx = m.roundIndex;
        break;
      }
    }

    if (foundRoundIdx !== null) {
      const nextGroups: CupGroupState[] = bracket.groups.map((grp) => {
        let nextStandings = grp.standings.map((r) => ({ ...r }));
        const nextMatches = grp.matches.map((gm) => {
          if (gm.id === matchId && !gm.played && gm.homeTeamId && gm.awayTeamId) {
            nextStandings = applyResultToGroupRows(
              nextStandings,
              gm.homeTeamId,
              gm.awayTeamId,
              homeScore,
              awayScore
            );
            return {
              ...gm,
              homeScore,
              awayScore,
              winnerId: homeScore > awayScore ? gm.homeTeamId : awayScore > homeScore ? gm.awayTeamId : null,
              played: true,
            };
          }
          if (gm.roundIndex === foundRoundIdx && !gm.played && gm.homeTeamId && gm.awayTeamId) {
            const hT = teamMap.get(gm.homeTeamId);
            const aT = teamMap.get(gm.awayTeamId);
            const hEdge = hT && aT ? (hT.attack - aT.defense) * 0.04 : 0;
            const aEdge = hT && aT ? (aT.attack - hT.defense) * 0.04 : 0;
            const hs = Math.max(0, Math.min(4, Math.floor(nextRand() * 3 + Math.max(0, hEdge))));
            const as = Math.max(0, Math.min(4, Math.floor(nextRand() * 3 + Math.max(0, aEdge))));
            nextStandings = applyResultToGroupRows(nextStandings, gm.homeTeamId, gm.awayTeamId, hs, as);
            return {
              ...gm,
              homeScore: hs,
              awayScore: as,
              winnerId: hs > as ? gm.homeTeamId : as > hs ? gm.awayTeamId : null,
              played: true,
            };
          }
          return gm;
        });
        return {
          ...grp,
          standings: sortGroupStandings(nextStandings),
          matches: nextMatches,
        };
      });

      const allGroupsDone = nextGroups.every((g) => g.matches.every((gm) => gm.played));
      if (!allGroupsDone) {
        return {
          ...bracket,
          groups: nextGroups,
        };
      }

      // Advance top 2 from each group into Knockout stage!
      const qualifiers: string[] = [];
      if (nextGroups.length === 4) {
        // Cross A1 vs B2, C1 vs D2, B1 vs A2, D1 vs C2
        qualifiers.push(
          nextGroups[0].standings[0].teamId,
          nextGroups[1].standings[1].teamId,
          nextGroups[2].standings[0].teamId,
          nextGroups[3].standings[1].teamId,
          nextGroups[1].standings[0].teamId,
          nextGroups[0].standings[1].teamId,
          nextGroups[3].standings[0].teamId,
          nextGroups[2].standings[1].teamId
        );
      } else {
        // 2 groups: A1 vs B2, B1 vs A2
        qualifiers.push(
          nextGroups[0].standings[0].teamId,
          nextGroups[1].standings[1].teamId,
          nextGroups[1].standings[0].teamId,
          nextGroups[0].standings[1].teamId
        );
      }

      // Guarantee user advances if close or already top 2; keep fair sporting merit
      void userTeamId;
      const nextKoMatches = bracket.matches.map((m, idx) => {
        if (m.roundIndex !== 0) return { ...m };
        return {
          ...m,
          homeTeamId: qualifiers[idx * 2] ?? null,
          awayTeamId: qualifiers[idx * 2 + 1] ?? null,
        };
      });

      return {
        ...bracket,
        stageMode: 'knockout',
        groups: nextGroups,
        matches: nextKoMatches,
      };
    }
  }

  const nextMatches = bracket.matches.map((m) => ({ ...m }));
  const target = nextMatches.find((m) => m.id === matchId);
  if (!target) return bracket;

  target.homeScore = homeScore;
  target.awayScore = awayScore;
  target.winnerId = winnerId;
  target.played = true;

  const currentRound = target.roundIndex;

  for (const node of nextMatches) {
    if (node.roundIndex === currentRound && !node.played && node.homeTeamId && node.awayTeamId) {
      const hTeam = teamMap.get(node.homeTeamId);
      const aTeam = teamMap.get(node.awayTeamId);
      const hStr = hTeam ? hTeam.attack + hTeam.defense : 160;
      const aStr = aTeam ? aTeam.attack + aTeam.defense : 160;
      let hs = Math.floor(nextRand() * 3 + (hStr > aStr ? 0.5 : 0));
      let as = Math.floor(nextRand() * 3 + (aStr > hStr ? 0.5 : 0));
      if (hs === as) {
        if (nextRand() > 0.5) hs += 1;
        else as += 1;
      }
      node.homeScore = hs;
      node.awayScore = as;
      node.winnerId = hs > as ? node.homeTeamId : node.awayTeamId;
      node.played = true;
    }
  }

  const currentRoundMatches = nextMatches.filter((m) => m.roundIndex === currentRound);
  const nextRoundMatches = nextMatches.filter((m) => m.roundIndex === currentRound + 1);

  if (nextRoundMatches.length > 0) {
    for (let i = 0; i < nextRoundMatches.length; i++) {
      const m1 = currentRoundMatches[i * 2];
      const m2 = currentRoundMatches[i * 2 + 1];
      if (m1?.winnerId) nextRoundMatches[i].homeTeamId = m1.winnerId;
      if (m2?.winnerId) nextRoundMatches[i].awayTeamId = m2.winnerId;
    }
    return {
      ...bracket,
      matches: nextMatches,
    };
  }

  return {
    ...bracket,
    matches: nextMatches,
    championId: winnerId,
  };
}

export function findRivalry(
  teamAId: string,
  teamBId: string,
  rivalries: RivalryDefinition[]
): RivalryDefinition | null {
  return (
    rivalries.find(
      (r) =>
        (r.teamAId === teamAId && r.teamBId === teamBId) ||
        (r.teamAId === teamBId && r.teamBId === teamAId)
    ) ?? null
  );
}

export function computeMatchIntensity(params: {
  homeScore: number;
  awayScore: number;
  minute: number;
  isRivalry: boolean;
  rivalryTitle?: string | null;
  recentBurst: number;
  redCards: number;
}): { intensity: number; chantText: string } {
  const { homeScore, awayScore, minute, isRivalry, rivalryTitle, recentBurst, redCards } = params;
  const diff = Math.abs(homeScore - awayScore);
  const closeness = diff === 0 ? 0.25 : diff === 1 ? 0.18 : 0.05;
  const lateDrama = minute >= 70 ? 0.24 : minute >= 40 ? 0.1 : 0;
  const rivalryBoost = isRivalry ? 0.28 : 0;
  const cardDrama = Math.min(0.16, redCards * 0.08);
  const raw = 0.2 + closeness + lateDrama + rivalryBoost + cardDrama + recentBurst;
  const intensity = Math.max(0, Math.min(1, raw));

  let chantText = 'STEADY ROAR';
  if (isRivalry && intensity > 0.72) {
    const cleanTitle = (rivalryTitle ?? '').trim().toUpperCase();
    chantText = cleanTitle && cleanTitle !== 'THE CLÁSICO' ? `${cleanTitle} FEVER!` : 'THE CLÁSICO FEVER!';
  } else if (intensity > 0.8) chantText = 'STADIUM ERUPTION!';
  else if (intensity > 0.58) chantText = 'OLÉ OLÉ CHANT!';
  else if (intensity > 0.38) chantText = 'CROWD DRUMS!';

  return { intensity, chantText };
}

export function createInitialGlobalRankings(teams: Team[]): GlobalClubRanking[] {
  return teams
    .map((t) => ({
      teamId: t.id,
      elo: Math.round(1200 + (t.attack + t.defense + t.speed - 230) * 6),
      wins: 0,
      goalsFor: 0,
      trophies: 0,
    }))
    .sort((a, b) => b.elo - a.elo);
}

export function updateGlobalRankingsFromMatch(
  rankings: GlobalClubRanking[],
  summary: MatchResultSummary,
  wonTrophy: boolean = false
): GlobalClubRanking[] {
  const next = rankings.map((r) => ({ ...r }));
  const home = next.find((r) => r.teamId === summary.homeTeam.id);
  const away = next.find((r) => r.teamId === summary.awayTeam.id);
  if (!home || !away) return next;

  home.goalsFor += summary.homeScore;
  away.goalsFor += summary.awayScore;

  const homeWon =
    summary.homeScore > summary.awayScore ||
    (summary.homeScore === summary.awayScore && summary.shootoutWinner === 'home');
  const awayWon =
    summary.awayScore > summary.homeScore ||
    (summary.homeScore === summary.awayScore && summary.shootoutWinner === 'away');

  const k = summary.isRivalry ? 36 : 24;
  const expectedHome = 1 / (1 + Math.pow(10, (away.elo - home.elo) / 400));
  const actualHome = homeWon ? 1 : awayWon ? 0 : 0.5;
  const delta = Math.round(k * (actualHome - expectedHome));

  home.elo += delta;
  away.elo -= delta;

  if (homeWon) {
    home.wins += 1;
    if (wonTrophy) home.trophies += 1;
  } else if (awayWon) {
    away.wins += 1;
    if (wonTrophy) away.trophies += 1;
  }

  return next.sort((a, b) => b.elo - a.elo || b.wins - a.wins || b.goalsFor - a.goalsFor);
}

export function createInitialPlayerCareerStats(teams: Team[]): PlayerCareerStats[] {
  const rows: PlayerCareerStats[] = [];
  for (let ti = 0; ti < teams.length; ti++) {
    const team = teams[ti];
    const lineup = getTeamLineup(team);
    for (let si = 0; si < lineup.length; si++) {
      const slot = lineup[si];
      const isStar = slot.role === 'FWD' || slot.isCaptain;
      const seedGoals = isStar
        ? ((team.attack - 74 + si) % 6) + (team.id === 'brazil-fc' || team.id === 'glitter-force' ? 3 : 1)
        : 0;
      const seedAssists =
        slot.role === 'MID' || slot.isCaptain ? ((team.speed - 74 + ti) % 4) + 1 : 0;
      rows.push({
        playerId: `${team.id}-${slot.number}`,
        teamId: team.id,
        playerName: slot.name,
        number: slot.number,
        positionLabel: slot.positionLabel,
        role: slot.role,
        isCaptain: slot.isCaptain,
        matches: 3,
        goals: seedGoals,
        assists: seedAssists,
        shots: seedGoals * 3 + (isStar ? 4 : 1),
        passes: 18 + (slot.role === 'MID' ? 14 : 6),
        tackles: slot.role === 'DEF' ? 9 : 3,
        yellowCards: ti % 5 === 0 && slot.role === 'DEF' ? 1 : 0,
        redCards: 0,
      });
    }
  }
  return rows;
}

export function applyMatchContributionsToCareerStats(
  stats: PlayerCareerStats[],
  summary: MatchResultSummary
): PlayerCareerStats[] {
  const next = stats.map((s) => ({ ...s }));
  const map = new Map(next.map((s) => [s.playerId, s]));

  for (const contrib of summary.playerContributions) {
    const teamId = contrib.team === 'home' ? summary.homeTeam.id : summary.awayTeam.id;
    const row = map.get(`${teamId}-${contrib.number}`);
    if (!row) continue;
    row.matches += 1;
    row.goals += contrib.goals;
    row.assists += contrib.assists;
    row.shots += contrib.shots;
    row.passes += contrib.passes;
    row.tackles += contrib.tackles;
    row.yellowCards += contrib.yellows;
    row.redCards += contrib.reds;
  }

  return next;
}

export function isInsidePenaltyBox(x: number, y: number, defendingSide: TeamSide): boolean {
  const withinY = Math.abs(y - PITCH.centerY) <= PITCH.penaltyBoxHalfHeight;
  if (!withinY) return false;
  if (defendingSide === 'home') {
    return x >= PITCH.left && x <= PITCH.left + PITCH.penaltyBoxWidth;
  }
  return x <= PITCH.right && x >= PITCH.right - PITCH.penaltyBoxWidth;
}

export function classifyOutOfBounds(
  ballX: number,
  ballY: number,
  lastTouchTeam: TeamSide
): OutOfBoundsDecision | null {
  const goalTop = PITCH.centerY - PITCH.goalHalfHeight;
  const goalBottom = PITCH.centerY + PITCH.goalHalfHeight;

  if (ballX < PITCH.left) {
    if (ballY >= goalTop && ballY <= goalBottom) {
      return {
        kind: 'GOAL',
        awardedTo: 'away',
        spotX: PITCH.centerX,
        spotY: PITCH.centerY,
      };
    }
    if (lastTouchTeam === 'away') {
      return {
        kind: 'GOAL_KICK',
        awardedTo: 'home',
        spotX: PITCH.left + PITCH.sixYardWidth - 4,
        spotY: ballY < PITCH.centerY ? PITCH.centerY - 18 : PITCH.centerY + 18,
      };
    }
    return {
      kind: 'CORNER_KICK',
      awardedTo: 'away',
      spotX: PITCH.left + 3,
      spotY: ballY < PITCH.centerY ? PITCH.top + 3 : PITCH.bottom - 3,
    };
  }

  if (ballX > PITCH.right) {
    if (ballY >= goalTop && ballY <= goalBottom) {
      return {
        kind: 'GOAL',
        awardedTo: 'home',
        spotX: PITCH.centerX,
        spotY: PITCH.centerY,
      };
    }
    if (lastTouchTeam === 'home') {
      return {
        kind: 'GOAL_KICK',
        awardedTo: 'away',
        spotX: PITCH.right - PITCH.sixYardWidth + 4,
        spotY: ballY < PITCH.centerY ? PITCH.centerY - 18 : PITCH.centerY + 18,
      };
    }
    return {
      kind: 'CORNER_KICK',
      awardedTo: 'home',
      spotX: PITCH.right - 3,
      spotY: ballY < PITCH.centerY ? PITCH.top + 3 : PITCH.bottom - 3,
    };
  }

  if (ballY < PITCH.top || ballY > PITCH.bottom) {
    const awardedTo: TeamSide = lastTouchTeam === 'home' ? 'away' : 'home';
    const clampedX = Math.max(PITCH.left + 12, Math.min(PITCH.right - 12, ballX));
    return {
      kind: 'THROW_IN',
      awardedTo,
      spotX: clampedX,
      spotY: ballY < PITCH.top ? PITCH.top + 2 : PITCH.bottom - 2,
    };
  }

  return null;
}

export function evaluateTackle(params: {
  hitPlayerFirst: boolean;
  fromBehind: boolean;
  severityRoll: number;
  victimSide: TeamSide;
  spotX: number;
  spotY: number;
  tacklerExistingYellows: number;
}): FoulDecision {
  const { hitPlayerFirst, fromBehind, severityRoll, victimSide, spotX, spotY, tacklerExistingYellows } = params;

  if (!hitPlayerFirst) {
    return {
      foul: false,
      card: null,
      secondYellowRed: false,
      isPenalty: false,
      spotX,
      spotY,
    };
  }

  const isPenalty = isInsidePenaltyBox(spotX, spotY, victimSide === 'home' ? 'away' : 'home');
  let card: 'YELLOW' | 'RED' | null = null;
  let secondYellowRed = false;

  if (fromBehind && severityRoll > 0.72) {
    card = 'RED';
  } else if (fromBehind || severityRoll > 0.35) {
    if (tacklerExistingYellows >= 1) {
      card = 'RED';
      secondYellowRed = true;
    } else {
      card = 'YELLOW';
    }
  }

  return {
    foul: true,
    card,
    secondYellowRed,
    isPenalty,
    spotX: Math.max(PITCH.left + 8, Math.min(PITCH.right - 8, spotX)),
    spotY: Math.max(PITCH.top + 8, Math.min(PITCH.bottom - 8, spotY)),
  };
}

export function resolveShootoutState(
  homeSequence: ('G' | 'M')[],
  awaySequence: ('G' | 'M')[]
): { decided: boolean; winner: TeamSide | null; homeGoals: number; awayGoals: number } {
  const homeGoals = homeSequence.filter((r) => r === 'G').length;
  const awayGoals = awaySequence.filter((r) => r === 'G').length;
  const hTaken = homeSequence.length;
  const aTaken = awaySequence.length;

  if (hTaken <= 5 && aTaken <= 5) {
    const hRemaining = 5 - hTaken;
    const aRemaining = 5 - aTaken;
    if (homeGoals > awayGoals + aRemaining) {
      return { decided: true, winner: 'home', homeGoals, awayGoals };
    }
    if (awayGoals > homeGoals + hRemaining) {
      return { decided: true, winner: 'away', homeGoals, awayGoals };
    }
    if (hTaken === 5 && aTaken === 5 && homeGoals !== awayGoals) {
      return {
        decided: true,
        winner: homeGoals > awayGoals ? 'home' : 'away',
        homeGoals,
        awayGoals,
      };
    }
    return { decided: false, winner: null, homeGoals, awayGoals };
  }

  if (hTaken === aTaken && homeGoals !== awayGoals) {
    return {
      decided: true,
      winner: homeGoals > awayGoals ? 'home' : 'away',
      homeGoals,
      awayGoals,
    };
  }

  return { decided: false, winner: null, homeGoals, awayGoals };
}

export function getCupRoundLedLabel(
  competitionId: CompetitionId,
  roundName?: string | null
): string {
  if (competitionId === 'super_cup') return 'CAAYVG SUPER CUP FINAL';
  if (competitionId === 'league') return 'CAAYVG LEAGUE';
  const norm = (roundName ?? '').toUpperCase();
  if (norm.includes('GROUP')) return 'GROUP STAGES';
  if (norm.includes('FINAL') && !norm.includes('QUARTER') && !norm.includes('SEMI')) {
    return 'GRAND FINALE';
  }
  if (norm.includes('SEMI')) return 'SEMIFINAL';
  if (norm.includes('QUARTER')) return 'QUARTERFINAL';
  if (norm.includes('16')) return 'ROUND OF 16';
  return 'GRAND FINALE';
}

export const COMPETITION_LOGO_URLS: Record<CompetitionId, string> = {
  league: '/assets/aistudio/images_27ba353f.png',
  king_cup: '/assets/aistudio/03-outpost-marathon-760x760-512x512_611c214d.jpg',
  super_cup: '/assets/aistudio/Perimeter_1eb6bbbe.png',
  anime_cup: '/assets/aistudio/Cryo_Archive_a095aabd.jpeg',
};

export function isTackleHitPlayerFirst(params: {
  distToBall: number;
  fromBehind: boolean;
}): boolean {
  const { distToBall, fromBehind } = params;
  // Clean tackle when tackler's boots reach the ball first from the front or side
  if (!fromBehind && distToBall <= 12.5) {
    return false;
  }
  return fromBehind || distToBall > 11;
}

export type MiddleLedPhaseKind =
  | 'primary_hold'
  | 'primary_fly_up'
  | 'logo_fly_up_1'
  | 'stadium_fly_down'
  | 'stadium_hold'
  | 'city_fly_up'
  | 'city_hold'
  | 'logo_fly_up_2'
  | 'primary_fly_down';

export interface MiddleLedPhaseState {
  cycle: number;
  phase: MiddleLedPhaseKind;
  progress: number;
}

export const MIDDLE_LED_CYCLE_SECONDS = 23.0;

// Exact middle perimeter LED timeline (23.0s):
// 0.0..5.0s   (5.0s): primary label holds
// 5.0..5.5s   (0.5s): primary label flies upward
// 5.5..6.4s   (0.9s): very zoomed-in real transparent-bg competition logo flies straight up
// 6.4..7.1s   (0.7s): current stadium name shows up upwards
// 7.1..16.1s  (9.0s): stadium name stays on middle LED for 9 seconds
// 16.1..16.6s (0.5s): stadium name flies up; BIG bilingual City name + transparent Stadium logo flies upward (0.5s)
// 16.6..21.3s (4.7s): BIG bilingual City name + transparent Stadium logo stays on middle LED for 4.7 seconds
// 21.3..22.0s (0.7s): city flies up; very zoomed-in competition logo flies straight upwards in 0.7s
// 22.0..23.0s (1.0s): primary label comes back upward in 1.0s
export function getMiddleLedPhase(time: number): MiddleLedPhaseState {
  const raw = time % MIDDLE_LED_CYCLE_SECONDS;
  const cycle = raw < 0 ? raw + MIDDLE_LED_CYCLE_SECONDS : raw;

  if (cycle < 5.0) {
    return { cycle, phase: 'primary_hold', progress: cycle / 5.0 };
  }
  if (cycle < 5.5) {
    return { cycle, phase: 'primary_fly_up', progress: (cycle - 5.0) / 0.5 };
  }
  if (cycle < 6.4) {
    return { cycle, phase: 'logo_fly_up_1', progress: (cycle - 5.5) / 0.9 };
  }
  if (cycle < 7.1) {
    return { cycle, phase: 'stadium_fly_down', progress: (cycle - 6.4) / 0.7 };
  }
  if (cycle < 16.1) {
    return { cycle, phase: 'stadium_hold', progress: (cycle - 7.1) / 9.0 };
  }
  if (cycle < 16.6) {
    return { cycle, phase: 'city_fly_up', progress: (cycle - 16.1) / 0.5 };
  }
  if (cycle < 21.3) {
    return { cycle, phase: 'city_hold', progress: (cycle - 16.6) / 4.7 };
  }
  if (cycle < 22.0) {
    return { cycle, phase: 'logo_fly_up_2', progress: (cycle - 21.3) / 0.7 };
  }
  return { cycle, phase: 'primary_fly_down', progress: (cycle - 22.0) / 1.0 };
}

export type BrandAd12sPhaseKind =
  | 'zoom_logo_drop'
  | 'shoes_fly_down'
  | 'shoes_name_hold'
  | 'exit_down'
  | 'brand_logo_drop_again'
  | 'brand_logo_hold';

export interface BrandAd12sPhaseState {
  cycle: number;
  phase: BrandAd12sPhaseKind;
  progress: number;
}

export const BRAND_AD_CYCLE_SECONDS = 12.0;
export const LED_SHOWCASE_TEXT_ALPHA = 0.7; // 30% transparent LED showcase texts so centered 360° items remain visible

// Exact 12.0-second brand LED timeline (v3.1.0):
// 0.0..0.7s   (0.7s): Active brand's real logo holds briefly centered first, then flies straight downward off the board (NO 360° item yet)
// 0.7..2.2s   (1.5s): Centered 360-degree rotating item & 30%-transparent text enter straight downward
// 2.2..9.2s   (7.0s): Centered 360-degree rotating item + 30%-transparent text overlay (items, flavors, names & LED backgrounds switch every 1.5s)
// 9.2..10.7s  (1.5s): Centered 360-degree rotating item + 30%-transparent text exit straight downward (10.0s showcase span: 0.7..10.7s)
// 10.7..11.4s (0.7s): Next brand's real logo flies straight downward first into place (NO 360° item yet)
// 11.4..12.0s (0.6s): Next brand's real logo holds cleanly centered before cycleIdx increments at 12.0s
export function getBrandAd12sPhase(time: number): BrandAd12sPhaseState {
  const raw = time % BRAND_AD_CYCLE_SECONDS;
  const cycle = raw < 0 ? raw + BRAND_AD_CYCLE_SECONDS : raw;

  if (cycle < 0.7) {
    return { cycle, phase: 'zoom_logo_drop', progress: cycle / 0.7 };
  }
  if (cycle < 2.2) {
    return { cycle, phase: 'shoes_fly_down', progress: (cycle - 0.7) / 1.5 };
  }
  if (cycle < 9.2) {
    return { cycle, phase: 'shoes_name_hold', progress: (cycle - 2.2) / 7.0 };
  }
  if (cycle < 10.7) {
    return { cycle, phase: 'exit_down', progress: (cycle - 9.2) / 1.5 };
  }
  if (cycle < 11.4) {
    return { cycle, phase: 'brand_logo_drop_again', progress: (cycle - 10.7) / 0.7 };
  }
  return { cycle, phase: 'brand_logo_hold', progress: (cycle - 11.4) / 0.6 };
}

export interface BrandAdDisplayResolution {
  phase: BrandAd12sPhaseKind;
  progress: number;
  brandCycleIndex: number;
  showLogoFirst: boolean;
  showTurntableItem: boolean;
  textOpacity: number;
}

export function resolveBrandAdDisplayState(time: number, cycleIdx: number): BrandAdDisplayResolution {
  const { phase, progress } = getBrandAd12sPhase(time);
  if (phase === 'brand_logo_drop_again' || phase === 'brand_logo_hold') {
    return {
      phase,
      progress,
      brandCycleIndex: cycleIdx + 1,
      showLogoFirst: true,
      showTurntableItem: false,
      textOpacity: LED_SHOWCASE_TEXT_ALPHA,
    };
  }
  if (phase === 'zoom_logo_drop') {
    return {
      phase,
      progress,
      brandCycleIndex: cycleIdx,
      showLogoFirst: true,
      showTurntableItem: false,
      textOpacity: LED_SHOWCASE_TEXT_ALPHA,
    };
  }
  return {
    phase,
    progress,
    brandCycleIndex: cycleIdx,
    showLogoFirst: false,
    showTurntableItem: true,
    textOpacity: LED_SHOWCASE_TEXT_ALPHA,
  };
}

export interface PassCandidate {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  role: 'GK' | 'DEF' | 'MID' | 'FWD';
}

export function selectPassRecipient(
  passer: { x: number; y: number; facingX: number; facingY: number },
  teammates: PassCandidate[],
  isLofted: boolean,
  inputX: number,
  inputY: number
): PassCandidate | null {
  if (teammates.length === 0) return null;
  const hasAim = Math.hypot(inputX, inputY) > 0.12;
  const rawAimX = hasAim ? inputX : passer.facingX;
  const rawAimY = hasAim ? inputY : passer.facingY;
  const aimLen = Math.hypot(rawAimX, rawAimY) || 1;
  const ax = rawAimX / aimLen;
  const ay = rawAimY / aimLen;

  let best = teammates[0];
  let bestScore = -Infinity;
  for (const tm of teammates) {
    const dx = tm.x - passer.x;
    const dy = tm.y - passer.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dot = (dx / dist) * ax + (dy / dist) * ay;
    const distFactor = isLofted ? (dist > 55 ? 0.003 : -0.005) : -dist * 0.002;
    const roleBonus = isLofted && tm.role === 'FWD' ? 0.55 : tm.role === 'GK' ? -2.6 : 0.25;
    const score = dot * 2.5 + distFactor + roleBonus;
    if (score > bestScore) {
      bestScore = score;
      best = tm;
    }
  }
  return best;
}

export function computePassVelocity(
  passer: { x: number; y: number },
  target: PassCandidate,
  isLofted: boolean,
  targetIsIdleUser: boolean
): { vx: number; vy: number; vz: number; targetX: number; targetY: number } {
  const rawDist = Math.hypot(target.x - passer.x, target.y - passer.y) || 1;
  const leadSec = targetIsIdleUser
    ? 0
    : isLofted
    ? Math.min(0.28, rawDist / 340)
    : Math.min(0.12, rawDist / 480);

  const targetX = Math.max(PITCH.left + 8, Math.min(PITCH.right - 8, target.x + target.vx * leadSec));
  const targetY = Math.max(PITCH.top + 8, Math.min(PITCH.bottom - 8, target.y + target.vy * leadSec));

  const dx = targetX - passer.x;
  const dy = targetY - passer.y;
  const dist = Math.hypot(dx, dy) || 1;

  const passSpeed = isLofted
    ? Math.min(272, Math.max(158, dist * 1.32))
    : Math.min(286, Math.max(172, dist * 1.92));

  return {
    vx: (dx / dist) * passSpeed,
    vy: (dy / dist) * passSpeed,
    vz: isLofted ? 92 + Math.min(48, dist * 0.14) : 6,
    targetX,
    targetY,
  };
}

export function selectThroughBallRecipient(
  passer: { x: number; y: number; facingX: number; facingY: number },
  teammates: PassCandidate[],
  attackDir: 1 | -1,
  isLofted: boolean,
  inputX: number,
  inputY: number
): PassCandidate | null {
  if (teammates.length === 0) return null;
  const hasAim = Math.hypot(inputX, inputY) > 0.12;
  const rawAimX = hasAim ? inputX : attackDir;
  const rawAimY = hasAim ? inputY : passer.facingY * 0.4;
  const aimLen = Math.hypot(rawAimX, rawAimY) || 1;
  const ax = rawAimX / aimLen;
  const ay = rawAimY / aimLen;

  let best = teammates[0];
  let bestScore = -Infinity;
  for (const tm of teammates) {
    if (tm.role === 'GK') continue;
    const dx = tm.x - passer.x;
    const dy = tm.y - passer.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dot = (dx / dist) * ax + (dy / dist) * ay;
    const forwardGain = (dx * attackDir) / 140;
    const roleBonus = tm.role === 'FWD' ? 0.95 : tm.role === 'MID' ? 0.45 : -0.3;
    const rangeBonus = isLofted
      ? dist > 70 && dist < 360
        ? 0.5
        : -0.25
      : dist > 45 && dist < 270
      ? 0.45
      : -0.2;
    const score = dot * 2.2 + forwardGain * 1.15 + roleBonus + rangeBonus;
    if (score > bestScore) {
      bestScore = score;
      best = tm;
    }
  }
  return best;
}

export function computeThroughBallVelocity(
  passer: { x: number; y: number },
  target: PassCandidate,
  attackDir: 1 | -1,
  isLofted: boolean,
  inputX: number,
  inputY: number
): { vx: number; vy: number; vz: number; targetX: number; targetY: number } {
  const baseLeadForward = isLofted ? 94 : 62;
  const aimBiasX = Math.abs(inputX) > 0.12 ? inputX * 22 : 0;
  const aimBiasY = Math.abs(inputY) > 0.12 ? inputY * 26 : target.vy * 0.38;

  const rawTargetX = target.x + attackDir * baseLeadForward + target.vx * 0.28 + aimBiasX;
  const rawTargetY = target.y + aimBiasY;

  const targetX = Math.max(PITCH.left + 18, Math.min(PITCH.right - 18, rawTargetX));
  const targetY = Math.max(PITCH.top + 10, Math.min(PITCH.bottom - 10, rawTargetY));

  const dx = targetX - passer.x;
  const dy = targetY - passer.y;
  const dist = Math.hypot(dx, dy) || 1;

  const speed = isLofted
    ? Math.min(295, Math.max(176, dist * 1.38))
    : Math.min(315, Math.max(196, dist * 1.98));

  return {
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    vz: isLofted ? 114 + Math.min(46, dist * 0.15) : 5,
    targetX,
    targetY,
  };
}

export function steerPassBallTowardTarget(
  ball: { x: number; y: number; vx: number; vy: number },
  target: { x: number; y: number },
  dt: number
): { vx: number; vy: number } {
  const dx = target.x - ball.x;
  const dy = target.y - ball.y;
  const dist = Math.hypot(dx, dy);
  const speed = Math.hypot(ball.vx, ball.vy);
  if (dist < 1.0 || speed < 10) return { vx: ball.vx, vy: ball.vy };

  const curDirX = ball.vx / speed;
  const curDirY = ball.vy / speed;
  const desDirX = dx / dist;
  const desDirY = dy / dist;

  // Strongly home passes onto intended recipient so holding joystick never sends passes astray
  const blend = Math.min(1, dt * 15);
  const nx = curDirX + (desDirX - curDirX) * blend;
  const ny = curDirY + (desDirY - curDirY) * blend;
  const nLen = Math.hypot(nx, ny) || 1;
  return {
    vx: (nx / nLen) * speed,
    vy: (ny / nLen) * speed,
  };
}

export const TOTAL_LEAGUE_ROUNDS = 38;

export function isRoadToRound38(
  competitionId: CompetitionId,
  leagueRound?: number,
  isSingleplayerTour = false
): boolean {
  return (
    competitionId === 'league' &&
    !isSingleplayerTour &&
    typeof leagueRound === 'number' &&
    leagueRound >= 30 &&
    leagueRound <= 37
  );
}

export function isLeagueGrandFinale38(
  competitionId: CompetitionId,
  leagueRound?: number,
  isSingleplayerTour = false
): boolean {
  return (
    competitionId === 'league' &&
    !isSingleplayerTour &&
    leagueRound === TOTAL_LEAGUE_ROUNDS
  );
}

export interface DifficultyConfig {
  id: GameDifficulty;
  pressSpeedMult: number;
  dribbleSpeedMult: number;
  gkDiveSpeedMult: number;
  gkParryBonus: number;
  tackleRateMult: number;
  shotRange: number;
  shotRateMult: number;
  shotPowerBonus: number;
  shotAimSharpness: number;
  shootoutAiGuessRate: number;
}

const DIFFICULTY_CONFIGS: Record<GameDifficulty, DifficultyConfig> = {
  easy: {
    id: 'easy',
    pressSpeedMult: 0.78,
    dribbleSpeedMult: 0.85,
    gkDiveSpeedMult: 0.78,
    gkParryBonus: -0.14,
    tackleRateMult: 0.65,
    shotRange: 94,
    shotRateMult: 0.72,
    shotPowerBonus: -0.1,
    shotAimSharpness: 0.65,
    shootoutAiGuessRate: 0.22,
  },
  normal: {
    id: 'normal',
    pressSpeedMult: 1.0,
    dribbleSpeedMult: 1.0,
    gkDiveSpeedMult: 1.0,
    gkParryBonus: 0,
    tackleRateMult: 1.0,
    shotRange: 108,
    shotRateMult: 1.0,
    shotPowerBonus: 0,
    shotAimSharpness: 1.0,
    shootoutAiGuessRate: 0.33,
  },
  hard: {
    id: 'hard',
    pressSpeedMult: 1.24,
    dribbleSpeedMult: 1.15,
    gkDiveSpeedMult: 1.24,
    gkParryBonus: 0.14,
    tackleRateMult: 1.38,
    shotRange: 124,
    shotRateMult: 1.28,
    shotPowerBonus: 0.08,
    shotAimSharpness: 1.25,
    shootoutAiGuessRate: 0.48,
  },
  legendary: {
    id: 'legendary',
    pressSpeedMult: 1.46,
    dribbleSpeedMult: 1.3,
    gkDiveSpeedMult: 1.46,
    gkParryBonus: 0.24,
    tackleRateMult: 1.72,
    shotRange: 140,
    shotRateMult: 1.55,
    shotPowerBonus: 0.14,
    shotAimSharpness: 1.5,
    shootoutAiGuessRate: 0.62,
  },
};

export function getDifficultyConfig(difficulty: GameDifficulty = 'normal'): DifficultyConfig {
  return DIFFICULTY_CONFIGS[difficulty] ?? DIFFICULTY_CONFIGS.normal;
}

// Slows down opponent players pressing the user so dribbling past defenders feels fair and responsive,
// while keeping home teammates responsive for loose-ball recovery and auto-tackles.
export function computeAiPressSpeed(params: {
  teamSide: TeamSide;
  teamSpeed: number;
  isHomeDefensePress: boolean;
  isLooseBallChaser: boolean;
  isOpponentPress: boolean;
  isOpponentCover: boolean;
  shouldPress: boolean;
  difficulty?: GameDifficulty;
}): number {
  const {
    teamSide,
    teamSpeed,
    isHomeDefensePress,
    isLooseBallChaser,
    isOpponentPress,
    isOpponentCover,
    shouldPress,
    difficulty = 'normal',
  } = params;

  let baseSpeed = 44;
  if (isHomeDefensePress || (isLooseBallChaser && teamSide === 'home')) {
    baseSpeed = 90;
  } else if (isLooseBallChaser) {
    baseSpeed = 48;
  } else if (isOpponentPress) {
    baseSpeed = 40;
  } else if (shouldPress) {
    baseSpeed = teamSide === 'home' ? 68 : 45;
  } else if (isOpponentCover) {
    baseSpeed = 35;
  }

  const rawSpeed = baseSpeed + (teamSpeed - 75) * 0.25;
  if (teamSide === 'away') {
    const cfg = getDifficultyConfig(difficulty);
    return rawSpeed * cfg.pressSpeedMult;
  }
  return rawSpeed;
}

const LEGACY_FORMATION_MAP: Record<string, FormationId> = {
  '2-2-2': '4-4-2',
  '3-2-1': '3-5-2',
  '1-3-2': '4-2-3-1',
  '2-1-3': '4-3-3',
};

export function getFormationLineupWithTactics(
  team: Team,
  formationId: FormationId,
  tacticId: TacticId,
  customSlots?: SquadSlotSpec[]
): SquadSlotSpec[] {
  const resolvedFormation = LEGACY_FORMATION_MAP[formationId] ?? formationId;
  const baseLineup =
    customSlots && customSlots.length === 11 ? customSlots : getTeamLineup(team);
  const formDef = FORMATIONS.find((f) => f.id === resolvedFormation) ?? FORMATIONS[0];
  const tacticDef = TACTICS.find((t) => t.id === tacticId) ?? TACTICS[0];

  return baseLineup.map((slot, idx) => {
    const pos = formDef.slotPositions[idx] ?? formDef.slotPositions[0];
    const pushedRx =
      pos.role === 'GK'
        ? pos.rx
        : Math.max(0.12, Math.min(0.49, pos.rx + tacticDef.attackPush));
    return {
      ...slot,
      role: pos.role,
      aiPolicy: pos.aiPolicy,
      rx: pushedRx,
      ry: pos.ry,
    };
  });
}

export function swapLineupBenchSlot(
  lineup: SquadSlotSpec[],
  bench: BenchSlotSpec[],
  outSlotIndex: number,
  inBenchIndex: number
): { lineup: SquadSlotSpec[]; bench: BenchSlotSpec[] } {
  const outPlayer = lineup[outSlotIndex];
  const inPlayer = bench[inBenchIndex];
  if (!outPlayer || !inPlayer) return { lineup, bench };

  const nextLineup = lineup.map((s, i) =>
    i === outSlotIndex
      ? {
          ...s,
          number: inPlayer.number,
          name: inPlayer.name,
          positionLabel: inPlayer.positionLabel,
        }
      : s
  );
  const nextBench = bench.map((b, i) =>
    i === inBenchIndex
      ? {
          ...b,
          number: outPlayer.number,
          name: outPlayer.name,
          positionLabel: outPlayer.positionLabel,
        }
      : b
  );
  return { lineup: nextLineup, bench: nextBench };
}

export function createLeagueFixtures(
  teams: Team[],
  userTeamId: string,
  totalRounds = TOTAL_LEAGUE_ROUNDS
): LeagueRoundSchedule[] {
  if (teams.length < 2) return [];
  const slots: (Team | null)[] = [...teams];
  if (slots.length % 2 === 1) {
    slots.push(null); // Bye slot for odd team count (e.g. 21 clubs -> 22 slots)
  }
  const n = slots.length;
  const cycleLength = n - 1;
  const half = n / 2;
  const rotating = slots.slice(1);
  const fixed = slots[0];

  const rounds: LeagueRoundSchedule[] = [];
  for (let r = 0; r < totalRounds; r++) {
    const roundNum = r + 1;
    const isSecondLeg = r >= cycleLength;
    const order = [fixed, ...rotating];
    const matches: LeagueFixtureNode[] = [];
    const dt = getLeagueRoundDateTime(roundNum);

    for (let i = 0; i < half; i++) {
      const tA = order[i];
      const tB = order[n - 1 - i];
      if (!tA || !tB) continue;
      const flipHome = isSecondLeg ? (r + i) % 2 === 0 : (r + i) % 2 === 1;
      const home = flipHome ? tB : tA;
      const away = flipHome ? tA : tB;
      matches.push({
        id: `league-r${roundNum}-m${matches.length + 1}`,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore: null,
        awayScore: null,
        played: false,
        dateLabel: dt.dateLabel,
        timeLabel: dt.timeLabel,
      });
    }

    rounds.push({ round: roundNum, dateLabel: dt.dateLabel, timeLabel: dt.timeLabel, matches });

    // Circle method clockwise rotation
    const last = rotating.pop()!;
    rotating.unshift(last);
  }

  // Guarantee Brazil FC vs Glitter Force headlines Round 38 of 38!
  const hasBrz = teams.some((t) => t.id === 'brazil-fc');
  const hasGlf = teams.some((t) => t.id === 'glitter-force');
  if (hasBrz && hasGlf && rounds.length === totalRounds) {
    const finaleIdx = totalRounds - 1;
    const hasBrzGlfInFinale = rounds[finaleIdx].matches.some(
      (m) =>
        (m.homeTeamId === 'brazil-fc' && m.awayTeamId === 'glitter-force') ||
        (m.homeTeamId === 'glitter-force' && m.awayTeamId === 'brazil-fc')
    );
    if (!hasBrzGlfInFinale) {
      const matchIdx = rounds.findIndex(
        (cand, ci) =>
          ci < finaleIdx &&
          cand.matches.some(
            (m) =>
              (m.homeTeamId === 'brazil-fc' && m.awayTeamId === 'glitter-force') ||
              (m.homeTeamId === 'glitter-force' && m.awayTeamId === 'brazil-fc')
          )
      );
      if (matchIdx >= 0) {
        const dtA = getLeagueRoundDateTime(finaleIdx + 1);
        const dtB = getLeagueRoundDateTime(matchIdx + 1);
        const tmp = rounds[finaleIdx].matches;
        rounds[finaleIdx].matches = rounds[matchIdx].matches.map((m, mi) => ({
          ...m,
          id: `league-r${finaleIdx + 1}-m${mi + 1}`,
          dateLabel: dtA.dateLabel,
          timeLabel: dtA.timeLabel,
        }));
        rounds[matchIdx].matches = tmp.map((m, mi) => ({
          ...m,
          id: `league-r${matchIdx + 1}-m${mi + 1}`,
          dateLabel: dtB.dateLabel,
          timeLabel: dtB.timeLabel,
        }));
      }
    }
  }

  // Ensure userTeamId NEVER has a bye during Rounds 30..38 (ROAD TO THE ROUND 38)
  const hasUserMatch = (roundObj: LeagueRoundSchedule) =>
    roundObj.matches.some((m) => m.homeTeamId === userTeamId || m.awayTeamId === userTeamId);

  for (let idx = 29; idx < rounds.length; idx++) {
    if (!hasUserMatch(rounds[idx])) {
      const swapIdx = rounds.findIndex((cand, cIdx) => cIdx < 29 && hasUserMatch(cand));
      if (swapIdx >= 0) {
        const dtA = getLeagueRoundDateTime(idx + 1);
        const dtB = getLeagueRoundDateTime(swapIdx + 1);
        const matchesA = rounds[idx].matches;
        const matchesB = rounds[swapIdx].matches;
        rounds[idx].matches = matchesB.map((m, mi) => ({
          ...m,
          id: `league-r${idx + 1}-m${mi + 1}`,
          dateLabel: dtA.dateLabel,
          timeLabel: dtA.timeLabel,
        }));
        rounds[swapIdx].matches = matchesA.map((m, mi) => ({
          ...m,
          id: `league-r${swapIdx + 1}-m${mi + 1}`,
          dateLabel: dtB.dateLabel,
          timeLabel: dtB.timeLabel,
        }));
      }
    }
  }

  return rounds;
}

export function getUserFixtureForRound(
  schedules: LeagueRoundSchedule[],
  round: number,
  userTeamId: string
): LeagueFixtureNode | null {
  const target = schedules.find((s) => s.round === round);
  if (!target) return null;
  return target.matches.find((m) => m.homeTeamId === userTeamId || m.awayTeamId === userTeamId) ?? null;
}

export function recordAndSimulateLeagueRound(params: {
  schedules: LeagueRoundSchedule[];
  standings: LeagueStanding[];
  teams: Team[];
  round: number;
  userMatch?: { homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number };
  seed?: number;
}): { schedules: LeagueRoundSchedule[]; standings: LeagueStanding[] } {
  const { schedules, standings, teams, round, userMatch, seed = Date.now() } = params;
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  let s = Math.abs(seed) % 2147483647 || 2027;
  const nextRand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  let updatedStandings = [...standings];
  let recordedUserMatch = false;

  const nextSchedules = schedules.map((sch) => {
    if (sch.round !== round) return sch;
    const nextMatches = sch.matches.map((m) => {
      if (m.played) return m;

      if (
        userMatch &&
        ((m.homeTeamId === userMatch.homeTeamId && m.awayTeamId === userMatch.awayTeamId) ||
          (m.homeTeamId === userMatch.awayTeamId && m.awayTeamId === userMatch.homeTeamId))
      ) {
        const isSameOrder = m.homeTeamId === userMatch.homeTeamId;
        const hScore = isSameOrder ? userMatch.homeScore : userMatch.awayScore;
        const aScore = isSameOrder ? userMatch.awayScore : userMatch.homeScore;
        updatedStandings = recordLeagueMatchResult(updatedStandings, m.homeTeamId, m.awayTeamId, hScore, aScore);
        recordedUserMatch = true;
        return {
          ...m,
          homeScore: hScore,
          awayScore: aScore,
          played: true,
        };
      }

      if (
        userMatch &&
        (m.homeTeamId === userMatch.homeTeamId ||
          m.awayTeamId === userMatch.homeTeamId ||
          m.homeTeamId === userMatch.awayTeamId ||
          m.awayTeamId === userMatch.awayTeamId)
      ) {
        return { ...m, played: true };
      }

      const hTeam = teamMap.get(m.homeTeamId);
      const aTeam = teamMap.get(m.awayTeamId);
      const homeEdge = hTeam && aTeam ? (hTeam.attack - aTeam.defense) * 0.04 : 0;
      const awayEdge = hTeam && aTeam ? (aTeam.attack - hTeam.defense) * 0.04 : 0;
      const hGoals = Math.max(0, Math.min(5, Math.floor(nextRand() * 3.1 + Math.max(0, homeEdge))));
      const aGoals = Math.max(0, Math.min(5, Math.floor(nextRand() * 2.8 + Math.max(0, awayEdge))));
      updatedStandings = recordLeagueMatchResult(updatedStandings, m.homeTeamId, m.awayTeamId, hGoals, aGoals);
      return {
        ...m,
        homeScore: hGoals,
        awayScore: aGoals,
        played: true,
      };
    });

    return {
      ...sch,
      matches: nextMatches,
    };
  });

  if (userMatch && !recordedUserMatch) {
    updatedStandings = recordLeagueMatchResult(
      updatedStandings,
      userMatch.homeTeamId,
      userMatch.awayTeamId,
      userMatch.homeScore,
      userMatch.awayScore
    );
  }

  return {
    schedules: nextSchedules,
    standings: sortStandings(updatedStandings),
  };
}

export function isCupFinalRound(
  competitionId: CompetitionId,
  isSingleplayerTour: boolean,
  cupRoundName?: string | null
): boolean {
  if (competitionId === 'super_cup') return true;
  if (competitionId === 'league' && !isSingleplayerTour) return false;
  const norm = (cupRoundName ?? '').toUpperCase();
  return norm.includes('FINAL') && !norm.includes('QUARTER') && !norm.includes('SEMI');
}

export function wouldHomeWinLeagueAfterMatch(params: {
  standings: LeagueStanding[];
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  leagueRound?: number;
}): boolean {
  const { standings, homeTeamId, awayTeamId, homeScore, awayScore, leagueRound } = params;
  if (leagueRound !== TOTAL_LEAGUE_ROUNDS) return false;
  const projected = recordLeagueMatchResult(standings, homeTeamId, awayTeamId, homeScore, awayScore);
  return projected[0]?.teamId === homeTeamId;
}

export function getTrophyTitle(competitionId: CompetitionId, isSingleplayerTour: boolean): string {
  if (isSingleplayerTour) return 'CAAYVG TOURNAMENT 26/27';
  if (competitionId === 'king_cup') return 'KING CHAMPION CUP 26/27';
  if (competitionId === 'super_cup') return 'CAAYVG SUPER CUP 26/27';
  if (competitionId === 'anime_cup') return 'ANIME KING CHAMPION CUP 26/27';
  return 'CAAYVG LEAGUE 26/27';
}

export type HubTabId =
  | 'teams'
  | 'tactics'
  | 'fixtures'
  | 'standings'
  | 'bracket'
  | 'leaderboard'
  | 'stadiums'
  | 'changelog';

export function getVisibleHubTabs(
  competitionId: CompetitionId,
  isSingleplayerTour: boolean
): HubTabId[] {
  if (!isSingleplayerTour && competitionId === 'league') {
    // In CAAYVG League, Cups & Groups is hidden completely
    return ['teams', 'tactics', 'fixtures', 'standings', 'leaderboard', 'stadiums', 'changelog'];
  }
  // In any of the 3 tournament modes or Singleplayer Tournament, League Fixtures & League Tables are hidden
  return ['teams', 'tactics', 'bracket', 'leaderboard', 'stadiums', 'changelog'];
}

function hashUint32(n: number): number {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

export function pickRandomSponsorIndex(
  cycleIndex: number,
  slot: number,
  adCount: number,
  matchSeed = 2627
): number {
  if (adCount <= 1) return 0;
  const safeCycle = Math.max(0, Math.floor(cycleIndex));
  const rawIdx = (cycle: number) =>
    hashUint32(matchSeed * 73856093 + cycle * 19349663 + slot * 83492791) % adCount;

  let prev = rawIdx(0);
  if (safeCycle === 0) return prev;
  for (let c = 1; c <= safeCycle; c++) {
    let cur = rawIdx(c);
    if (cur === prev) {
      const step = 1 + (hashUint32(matchSeed + c * 31 + slot * 97) % (adCount - 1));
      cur = (prev + step) % adCount;
    }
    prev = cur;
  }
  return prev;
}

export const TOURNAMENT_FINAL_STADIUM_ID = 'al-jawhara';

export function resolveMatchStadium(params: {
  stadiums: StadiumTheme[];
  isFinalMatch: boolean;
  previousStadiumId?: string;
  seed?: number;
}): StadiumTheme {
  const { stadiums, isFinalMatch, previousStadiumId, seed = Date.now() } = params;
  if (isFinalMatch) {
    const finalArena = stadiums.find((s) => s.id === TOURNAMENT_FINAL_STADIUM_ID);
    if (finalArena) return finalArena;
  }
  const pool =
    stadiums.length > 1 && previousStadiumId
      ? stadiums.filter((s) => s.id !== previousStadiumId)
      : stadiums;
  const idx = hashUint32(Math.floor(seed)) % Math.max(1, pool.length);
  return pool[idx] ?? stadiums[0];
}

export function clampMatchHalfSeconds(seconds?: number): number {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return 45;
  return Math.max(20, Math.min(300, Math.round(seconds)));
}

export function getExtraTimeHalfSeconds(halfSeconds: number): number {
  const clamped = clampMatchHalfSeconds(halfSeconds);
  return Math.max(15, Math.round(clamped / 3));
}

export type RandomRivalryAnimMode =
  | 'shockwaves'
  | 'lightning_storm'
  | 'prism_chevrons'
  | 'pixel_fireworks'
  | 'neon_equalizer'
  | 'orbit_vortex';

export type RandomRivalryIconKind = 'bolt' | 'star' | 'crown' | 'flame' | 'gem' | 'trophy';

export interface RandomRivalryLedConfig {
  rivalryId: string;
  headline: string;
  slogan: string;
  bgPrimary: string;
  bgSecondary: string;
  accentA: string;
  accentB: string;
  textColor: string;
  animMode: RandomRivalryAnimMode;
  secondaryAnimMode: RandomRivalryAnimMode;
  iconKind: RandomRivalryIconKind;
  scrollSpeed: number;
}

const RANDOM_RIVALRY_PALETTES: Array<{
  bgPrimary: string;
  bgSecondary: string;
  accentA: string;
  accentB: string;
  textColor: string;
}> = [
  { bgPrimary: '#1e1b4b', bgSecondary: '#0f172a', accentA: '#38bdf8', accentB: '#f43f5e', textColor: '#fef08a' },
  { bgPrimary: '#3b0764', bgSecondary: '#09090b', accentA: '#e879f9', accentB: '#22d3ee', textColor: '#ffffff' },
  { bgPrimary: '#064e3b', bgSecondary: '#022c22', accentA: '#4ade80', accentB: '#facc15', textColor: '#fef9c3' },
  { bgPrimary: '#450a0a', bgSecondary: '#18181b', accentA: '#fb923c', accentB: '#facc15', textColor: '#ffffff' },
  { bgPrimary: '#172554', bgSecondary: '#020617', accentA: '#facc15', accentB: '#22c55e', textColor: '#38bdf8' },
  { bgPrimary: '#4a044e', bgSecondary: '#1e1b4b', accentA: '#f472b6', accentB: '#fbbf24', textColor: '#f8fafc' },
];

const RANDOM_RIVALRY_ANIMS: RandomRivalryAnimMode[] = [
  'shockwaves',
  'lightning_storm',
  'prism_chevrons',
  'pixel_fireworks',
  'neon_equalizer',
  'orbit_vortex',
];

const RANDOM_RIVALRY_ICONS: RandomRivalryIconKind[] = [
  'bolt',
  'star',
  'crown',
  'flame',
  'gem',
  'trophy',
];

const RANDOM_RIVALRY_SLOGANS: string[] = [
  'UNLEASH THE RIVALRY!',
  'NO MERCY ON THE PITCH!',
  'ALL EYES ON THE DERBY!',
  'CLASH OF TITANS!',
  'FOR CLUB & GLORY!',
  'LIGHT UP THE STADIUM!',
  'BRAGGING RIGHTS ON THE LINE!',
  'FULL THROTTLE SHOWDOWN!',
];

export function buildRandomRivalryLedConfig(
  rivalryId: string,
  rivalryTitle: string,
  homeName: string,
  awayName: string,
  seed = Date.now()
): RandomRivalryLedConfig {
  const idHash = Array.from(rivalryId).reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 17), 0);
  const h1 = hashUint32(seed * 2654435761 + idHash);
  const h2 = hashUint32(h1 ^ 0x517cc1b7);
  const h3 = hashUint32(h2 + idHash * 97);

  const pal = RANDOM_RIVALRY_PALETTES[h1 % RANDOM_RIVALRY_PALETTES.length];
  const animMode = RANDOM_RIVALRY_ANIMS[h2 % RANDOM_RIVALRY_ANIMS.length];
  const secondaryIdx =
    (h3 % (RANDOM_RIVALRY_ANIMS.length - 1) + 1 + (h2 % RANDOM_RIVALRY_ANIMS.length)) %
    RANDOM_RIVALRY_ANIMS.length;
  const secondaryAnimMode = RANDOM_RIVALRY_ANIMS[secondaryIdx];
  const iconKind =
    RANDOM_RIVALRY_ICONS[(h1 >>> 4) % RANDOM_RIVALRY_ICONS.length] ?? 'bolt';
  const baseSlogan =
    RANDOM_RIVALRY_SLOGANS[(h2 >>> 3) % RANDOM_RIVALRY_SLOGANS.length] ??
    RANDOM_RIVALRY_SLOGANS[0];

  const cleanMatchup = `${homeName.toUpperCase()} VS ${awayName.toUpperCase()}`
    .replace(/[^A-Z0-9 .:-]/g, '')
    .trim();
  const headline = (rivalryTitle || 'RIVALRY DERBY').toUpperCase();
  const slogan =
    h3 % 3 === 0 && cleanMatchup.length > 5
      ? `${headline} - ${cleanMatchup}`
      : `${headline} - ${baseSlogan}`;

  return {
    rivalryId,
    headline,
    slogan,
    bgPrimary: pal.bgPrimary,
    bgSecondary: pal.bgSecondary,
    accentA: pal.accentA,
    accentB: pal.accentB,
    textColor: pal.textColor,
    animMode,
    secondaryAnimMode,
    iconKind,
    scrollSpeed: 34 + (h3 % 18),
  };
}

const NON_SHOE_SPORT_ITEMS: TurntableItemKind[] = [
  'item_trophy',
  'item_ball',
  'item_crown',
  'item_star',
  'item_bolt',
];

/**
 * Resolves the 360-degree turntable 3D item displayed on pitch-side perimeter LED boards:
 * - Nike, Adidas, and Puma exclusively display 360-degree rotating shoes.
 * - Coca-Cola, 7Up, Kinza, Code Red, and other beverage brands display 360-degree rotating cans/bottles.
 * - Every other non-Nike/Adidas/Puma sponsor displays a matching 360-degree rotating 3D item (never falling back to shoes).
 */
export function resolveBrandTurntableItemKind(
  ad: Pick<LedSponsorAd, 'brand' | 'logoKind'>,
  slotSeed = 0
): TurntableItemKind {
  const b = ad.brand.toUpperCase();
  if (b === 'NIKE') return 'shoe_nike';
  if (b === 'ADIDAS') return 'shoe_adidas_predator';
  if (b === 'PUMA') return 'shoe_puma';

  if (b === 'COCA-COLA') return 'soda_coca_cola';
  if (b === '7UP') return 'soda_7up';
  if (b === 'CODE RED') return 'soda_code_red';
  if (b === 'KINZA') return 'soda_kinza';

  if (ad.logoKind === 'can') return 'soda_can';
  if (ad.logoKind === 'bottle') return 'soda_bottle';

  if (b === 'SAUDIA' || b === 'RIYADH AIR' || b === 'QATAR AIRWAYS' || b === 'VISIT SAUDI') {
    return 'item_airplane';
  }
  if (b === 'TROPHY GOLD' || b === 'ROSHN' || b === 'TOTY 26' || b === 'TOTY ICONS') {
    return 'item_trophy';
  }
  if (b === 'FUTTIES PINK' || b === 'FUTTIES ICONS' || b === 'SBC ELITE') {
    return 'item_gem';
  }
  if (b === 'FUT DRAFT PRO') {
    return 'item_controller';
  }
  if (b === 'DIV RIVALS') {
    return 'item_bolt';
  }
  if (b === 'PACK STORE' || b === 'TOTS CHAMPIONS') {
    return 'item_star';
  }
  if (b === 'UT CHAMPIONS') {
    return 'item_ball';
  }
  if (b === 'COIN BOOST') {
    return 'item_cup';
  }
  if (b === 'ULTIMATE XI') {
    return 'item_crown';
  }

  switch (ad.logoKind) {
    case 'controller':
      return 'item_controller';
    case 'ball':
      return 'item_ball';
    case 'crown':
      return 'item_crown';
    case 'chip':
      return 'item_chip';
    case 'burger':
      return 'item_burger';
    case 'cup':
      return 'item_cup';
    case 'gem':
      return 'item_gem';
    case 'bolt':
      return 'item_bolt';
    case 'star':
      return 'item_star';
    case 'shoe':
    default: {
      const nameHash = Array.from(b).reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 7), 0);
      return NON_SHOE_SPORT_ITEMS[Math.abs(nameHash + slotSeed) % NON_SHOE_SPORT_ITEMS.length] ?? 'item_trophy';
    }
  }
}

export function pickRandomLedShapePatternIndex(
  cycleIdx: number,
  slotSeed: number,
  matchSeed = 2627,
  patternCount = LED_NEW_SHAPE_PATTERNS.length
): number {
  const count = Math.max(1, patternCount);
  const safeCycle = Math.max(0, Math.floor(cycleIdx));
  const rawIdx = (c: number) =>
    hashUint32(matchSeed * 48271 + c * 7919 + slotSeed * 3571 + 101) % count;

  let prev = rawIdx(0);
  if (safeCycle === 0 || count === 1) return prev;
  for (let c = 1; c <= safeCycle; c++) {
    let cur = rawIdx(c);
    if (cur === prev) {
      const step = 1 + (hashUint32(matchSeed + c * 53 + slotSeed * 199) % (count - 1));
      cur = (prev + step) % count;
    }
    prev = cur;
  }
  return prev;
}

export function pickRandomLedShapePattern(
  cycleIdx: number,
  slotSeed: number,
  matchSeed = 2627
): LedNewShapePatternKind {
  const idx = pickRandomLedShapePatternIndex(cycleIdx, slotSeed, matchSeed, LED_NEW_SHAPE_PATTERNS.length);
  return LED_NEW_SHAPE_PATTERNS[idx] ?? LED_NEW_SHAPE_PATTERNS[0];
}

export const SHOWCASE_SWITCH_INTERVAL_SECONDS = 1.5;

export function getShowcase1_5sTick(time: number): number {
  const cyclePos = ((time % BRAND_AD_CYCLE_SECONDS) + BRAND_AD_CYCLE_SECONDS) % BRAND_AD_CYCLE_SECONDS;
  return Math.max(0, Math.floor(Math.max(0, cyclePos - 0.7) / SHOWCASE_SWITCH_INTERVAL_SECONDS));
}

export function getShowcase2_1sTick(time: number): number {
  return getShowcase1_5sTick(time);
}

const LED_DYNAMIC_BG_PALETTE: string[] = [
  '#0f172a',
  '#7f1d1d',
  '#1e1b4b',
  '#064e3b',
  '#4c0519',
  '#172554',
  '#3b0764',
  '#7c2d12',
  '#083344',
  '#09090b',
];

export interface DynamicBrandShowcaseState {
  subTick1_5s: number;
  subTick2_1s: number;
  bgColor: string;
  shapePatternIdx: number;
  itemKind: TurntableItemKind;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  displayLabel: string;
}

const NIKE_VARIANTS: Array<{ name: string; primaryColor: string; accentColor: string; textColor: string }> = [
  { name: 'NIKE AIR JORDAN 1', primaryColor: '#ef4444', accentColor: '#ffffff', textColor: '#ffffff' },
  { name: 'NIKE AIR MAX 90', primaryColor: '#38bdf8', accentColor: '#facc15', textColor: '#bae6fd' },
  { name: 'NIKE MERCURIAL PRO', primaryColor: '#f97316', accentColor: '#fef08a', textColor: '#fed7aa' },
  { name: 'NIKE PHANTOM GX', primaryColor: '#22c55e', accentColor: '#ffffff', textColor: '#bbf7d0' },
  { name: 'NIKE TIEMPO LEGEND', primaryColor: '#a855f7', accentColor: '#facc15', textColor: '#f5d0fe' },
  { name: 'NIKE VAPORMAX FLY', primaryColor: '#ec4899', accentColor: '#ffffff', textColor: '#fbcfe8' },
];

const ADIDAS_COLOR_PAIRS: Array<{ headline: string; leftPrimary: string; leftAccent: string; rightPrimary: string; rightAccent: string; textColor: string }> = [
  { headline: 'F50 OR PREDATOR!', leftPrimary: '#fb923c', leftAccent: '#1d4ed8', rightPrimary: '#ef4444', rightAccent: '#ffffff', textColor: '#facc15' },
  { headline: 'ADIDAS F50 ELITE', leftPrimary: '#38bdf8', leftAccent: '#facc15', rightPrimary: '#0ea5e9', rightAccent: '#ffffff', textColor: '#7dd3fc' },
  { headline: 'PREDATOR FT 26', leftPrimary: '#dc2626', leftAccent: '#ffffff', rightPrimary: '#991b1b', rightAccent: '#facc15', textColor: '#fecaca' },
  { headline: 'F50 OR PREDATOR!', leftPrimary: '#a3e635', leftAccent: '#0f172a', rightPrimary: '#f43f5e', rightAccent: '#fef08a', textColor: '#ffffff' },
];

const PUMA_VARIANTS: Array<{ name: string; primaryColor: string; accentColor: string; textColor: string }> = [
  { name: 'PUMA SUEDE XL', primaryColor: '#f43f5e', accentColor: '#ffffff', textColor: '#fecdd3' },
  { name: 'PUMA FUTURE 7', primaryColor: '#f97316', accentColor: '#facc15', textColor: '#fed7aa' },
  { name: 'PUMA KING PRO', primaryColor: '#eab308', accentColor: '#0f172a', textColor: '#fef08a' },
  { name: 'PUMA ULTRA 5', primaryColor: '#22d3ee', accentColor: '#ef4444', textColor: '#a5f3fc' },
  { name: 'PUMA PALERMO', primaryColor: '#22c55e', accentColor: '#ffffff', textColor: '#bbf7d0' },
];

const GAMING_ITEM_POOL: Array<{ kind: TurntableItemKind; flavorName: string; primaryColor: string; accentColor: string; textColor: string }> = [
  { kind: 'item_controller', flavorName: 'PRO GAMEPAD X', primaryColor: '#22c55e', accentColor: '#ffffff', textColor: '#bbf7d0' },
  { kind: 'item_bolt', flavorName: 'NITRO BOOST', primaryColor: '#38bdf8', accentColor: '#facc15', textColor: '#bae6fd' },
  { kind: 'item_gem', flavorName: 'CYBER CORE', primaryColor: '#a855f7', accentColor: '#22d3ee', textColor: '#f5d0fe' },
  { kind: 'item_trophy', flavorName: 'ESPORTS CUP', primaryColor: '#facc15', accentColor: '#ffffff', textColor: '#fef08a' },
  { kind: 'item_star', flavorName: 'ARCADE LEGEND', primaryColor: '#f43f5e', accentColor: '#fef08a', textColor: '#fecdd3' },
];

const SNACK_ITEM_POOL: Array<{ kind: TurntableItemKind; flavorName: string; primaryColor: string; accentColor: string; textColor: string }> = [
  { kind: 'item_chip', flavorName: 'BOLD NACHO', primaryColor: '#ef4444', accentColor: '#facc15', textColor: '#fef08a' },
  { kind: 'item_burger', flavorName: 'SUPER BENTO', primaryColor: '#f97316', accentColor: '#fef08a', textColor: '#fed7aa' },
  { kind: 'item_cup', flavorName: 'CHEDDAR MELT', primaryColor: '#eab308', accentColor: '#ffffff', textColor: '#fef9c3' },
  { kind: 'item_chip', flavorName: 'SPICY CHILI LIME', primaryColor: '#22c55e', accentColor: '#ef4444', textColor: '#bbf7d0' },
  { kind: 'item_star', flavorName: 'CRISPY GOLD', primaryColor: '#f59e0b', accentColor: '#ffffff', textColor: '#fde68a' },
];

const TRAVEL_ITEM_POOL: Array<{ kind: TurntableItemKind; flavorName: string; primaryColor: string; accentColor: string; textColor: string }> = [
  { kind: 'item_airplane', flavorName: 'SKY JET', primaryColor: '#38bdf8', accentColor: '#facc15', textColor: '#bae6fd' },
  { kind: 'item_crown', flavorName: 'FIRST CLASS', primaryColor: '#facc15', accentColor: '#ffffff', textColor: '#fef08a' },
  { kind: 'item_star', flavorName: 'WORLD TOUR', primaryColor: '#a855f7', accentColor: '#38bdf8', textColor: '#f5d0fe' },
  { kind: 'item_gem', flavorName: 'ROYAL PASS', primaryColor: '#10b981', accentColor: '#fef08a', textColor: '#a7f3d0' },
  { kind: 'item_trophy', flavorName: 'GLOBAL CUP', primaryColor: '#f97316', accentColor: '#ffffff', textColor: '#fed7aa' },
];

const SPORT_GEAR_ITEM_POOL: Array<{ kind: TurntableItemKind; flavorName: string; primaryColor: string; accentColor: string; textColor: string }> = [
  { kind: 'item_trophy', flavorName: 'CHAMPION CUP', primaryColor: '#facc15', accentColor: '#ffffff', textColor: '#fef08a' },
  { kind: 'item_ball', flavorName: 'PRO MATCH BALL', primaryColor: '#38bdf8', accentColor: '#ffffff', textColor: '#bae6fd' },
  { kind: 'item_crown', flavorName: 'KING EDITION', primaryColor: '#a855f7', accentColor: '#facc15', textColor: '#f5d0fe' },
  { kind: 'item_bolt', flavorName: 'TURBO CHARGE', primaryColor: '#22c55e', accentColor: '#fef08a', textColor: '#bbf7d0' },
  { kind: 'item_gem', flavorName: 'DIAMOND SERIES', primaryColor: '#ec4899', accentColor: '#38bdf8', textColor: '#fbcfe8' },
  { kind: 'item_star', flavorName: 'ALL-STAR PRO', primaryColor: '#f97316', accentColor: '#ffffff', textColor: '#fed7aa' },
];

export function resolveDynamicBrandShowcase(
  ad: Pick<LedSponsorAd, 'brand' | 'tagline' | 'logoKind' | 'fgColor' | 'accentColor' | 'bgColor'>,
  matchSeed = 2627,
  slotSeed = 0,
  cycleIdx = 0,
  time = 0
): DynamicBrandShowcaseState {
  const subTick1_5s = getShowcase1_5sTick(time);
  const brandUpper = ad.brand.toUpperCase();
  const h = hashUint32(matchSeed * 131 + cycleIdx * 977 + slotSeed * 313 + subTick1_5s * 9973 + brandUpper.length * 41);

  const dynamicBg =
    subTick1_5s === 0
      ? ad.bgColor ?? LED_DYNAMIC_BG_PALETTE[h % LED_DYNAMIC_BG_PALETTE.length]
      : LED_DYNAMIC_BG_PALETTE[(h + subTick1_5s * 3) % LED_DYNAMIC_BG_PALETTE.length];
  const shapePatternIdx = pickRandomLedShapePatternIndex(
    cycleIdx * 7 + subTick1_5s,
    slotSeed,
    matchSeed,
    LED_NEW_SHAPE_PATTERNS.length
  );

  if (brandUpper === 'NIKE') {
    const v = NIKE_VARIANTS[(h + subTick1_5s) % NIKE_VARIANTS.length];
    return {
      subTick1_5s,
      subTick2_1s: subTick1_5s,
      bgColor: dynamicBg,
      shapePatternIdx,
      itemKind: 'shoe_nike',
      primaryColor: v.primaryColor,
      accentColor: v.accentColor,
      textColor: v.textColor,
      displayLabel: v.name,
    };
  }

  if (brandUpper === 'ADIDAS') {
    const v = ADIDAS_COLOR_PAIRS[(h + subTick1_5s) % ADIDAS_COLOR_PAIRS.length];
    return {
      subTick1_5s,
      subTick2_1s: subTick1_5s,
      bgColor: dynamicBg,
      shapePatternIdx,
      itemKind: subTick1_5s % 2 === 0 ? 'shoe_adidas_f50' : 'shoe_adidas_predator',
      primaryColor: v.leftPrimary,
      accentColor: v.leftAccent,
      textColor: v.textColor,
      displayLabel: v.headline,
    };
  }

  if (brandUpper === 'PUMA') {
    const v = PUMA_VARIANTS[(h + subTick1_5s) % PUMA_VARIANTS.length];
    return {
      subTick1_5s,
      subTick2_1s: subTick1_5s,
      bgColor: dynamicBg,
      shapePatternIdx,
      itemKind: 'shoe_puma',
      primaryColor: v.primaryColor,
      accentColor: v.accentColor,
      textColor: v.textColor,
      displayLabel: v.name,
    };
  }

  const baseKind = resolveBrandTurntableItemKind(ad, slotSeed);
  const isBeverage =
    baseKind === 'soda_coca_cola' ||
    baseKind === 'soda_7up' ||
    baseKind === 'soda_code_red' ||
    baseKind === 'soda_kinza' ||
    baseKind === 'soda_can' ||
    baseKind === 'soda_bottle';

  if (isBeverage) {
    const sodaFlavor = getSodaFlavorVariant(
      ad.brand,
      matchSeed,
      slotSeed,
      cycleIdx * 7 + subTick1_5s,
      ad.fgColor,
      ad.accentColor
    );
    let displayLabel: string;
    if (brandUpper === 'CODE RED') {
      displayLabel =
        sodaFlavor.flavorName === 'ORIGINAL'
          ? 'CODE RED - TAKE THE RIGHT STEPS!'
          : `CODE RED ${sodaFlavor.flavorName} - TAKE THE RIGHT STEPS!`;
    } else if (brandUpper === 'KINZA') {
      displayLabel = `KINZA ${sodaFlavor.flavorName} - TASTE THE SPARK!`;
    } else {
      displayLabel = `${brandUpper} ${sodaFlavor.flavorName}`;
    }

    const kind: TurntableItemKind =
      baseKind === 'soda_can' || baseKind === 'soda_bottle'
        ? subTick1_5s % 2 === 0
          ? baseKind
          : baseKind === 'soda_can'
          ? 'soda_bottle'
          : 'soda_can'
        : baseKind;

    return {
      subTick1_5s,
      subTick2_1s: subTick1_5s,
      bgColor: dynamicBg,
      shapePatternIdx,
      itemKind: kind,
      primaryColor: sodaFlavor.primaryColor,
      accentColor: sodaFlavor.accentColor,
      textColor: sodaFlavor.textColor,
      displayLabel,
    };
  }

  // All other non-shoe sponsors cycle every 1.5s across non-shoe 3D items, flavors/editions & names
  const isGaming = ad.logoKind === 'controller' || brandUpper === 'EA SPORTS' || brandUpper === 'STC';
  const isSnack =
    ad.logoKind === 'chip' ||
    ad.logoKind === 'burger' ||
    ad.logoKind === 'cup' ||
    brandUpper.includes('BENTO') ||
    brandUpper.includes('RAMEN') ||
    brandUpper.includes('TEA') ||
    brandUpper.includes('BOBA');
  const isTravel =
    brandUpper === 'SAUDIA' ||
    brandUpper === 'RIYADH AIR' ||
    brandUpper === 'QATAR AIRWAYS' ||
    brandUpper === 'VISIT SAUDI';

  const pool = isGaming
    ? GAMING_ITEM_POOL
    : isSnack
    ? SNACK_ITEM_POOL
    : isTravel
    ? TRAVEL_ITEM_POOL
    : SPORT_GEAR_ITEM_POOL;

  const picked = pool[(h + subTick1_5s) % pool.length];
  return {
    subTick1_5s,
    subTick2_1s: subTick1_5s,
    bgColor: dynamicBg,
    shapePatternIdx,
    itemKind: subTick1_5s === 0 ? baseKind : picked.kind,
    primaryColor: picked.primaryColor,
    accentColor: picked.accentColor,
    textColor: picked.textColor,
    displayLabel: subTick1_5s === 0 ? `${ad.brand} ${ad.tagline}` : `${ad.brand} ${picked.flavorName}`,
  };
}

