import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRealBrandLogo } from './brandLogos';
import {
  ALL_TEAMS,
  CHANGELOG_ENTRIES,
  CUP_LED_SPONSOR_ADS,
  DIFFICULTY_OPTIONS,
  EXPANSION_TEAMS,
  EXTRA_ANIMATED_SPONSORS,
  FORMATIONS,
  GAME_VERSION,
  LEAGUE_TEAMS,
  LED_EXTRA_ANIMATIONS,
  LED_NEW_SHAPE_PATTERNS,
  LED_SPONSOR_ADS,
  MATCH_LENGTH_OPTIONS,
  RIVALRIES,
  STADIUMS,
  getSponsorsForCompetition,
  getTeamBench,
  getTeamLineup,
} from './data';
import {
  SODA_FLAVOR_VARIANTS,
  getShoeDisplayModelName,
  getSodaFlavorVariant,
  render360TurntableToPixelGrid,
  type TurntableItemKind,
} from './shoeTurntablePixels';
import {
  BRAND_AD_CYCLE_SECONDS,
  COMPETITION_LOGO_URLS,
  MIDDLE_LED_CYCLE_SECONDS,
  PITCH,
  TOTAL_LEAGUE_ROUNDS,
  TOURNAMENT_FINAL_STADIUM_ID,
  applyMatchContributionsToCareerStats,
  buildRandomRivalryLedConfig,
  clampMatchHalfSeconds,
  classifyOutOfBounds,
  computeAiPressSpeed,
  computeMatchIntensity,
  computePassVelocity,
  createCupBracket,
  createInitialGlobalRankings,
  createInitialPlayerCareerStats,
  createInitialStandings,
  createLeagueFixtures,
  evaluateTackle,
  findRivalry,
  getBrandAd12sPhase,
  getCupRoundDateTime,
  getCupRoundLedLabel,
  getDifficultyConfig,
  getExtraTimeHalfSeconds,
  getFormationLineupWithTactics,
  getLeagueRoundDateTime,
  getMiddleLedPhase,
  getNextPendingCupMatch,
  getPromotedTeamIds,
  getTrophyTitle,
  getUserFixtureForRound,
  getVisibleHubTabs,
  SHOWCASE_SWITCH_INTERVAL_SECONDS,
  getShowcase1_5sTick,
  getShowcase2_1sTick,
  isCupFinalRound,
  isLeagueGrandFinale38,
  isRoadToRound38,
  isTackleHitPlayerFirst,
  jumpCupBracketToRound,
  pickRandomLedShapePattern,
  pickRandomSponsorIndex,
  recordAndSimulateLeagueRound,
  recordCupMatchResult,
  recordLeagueMatchResult,
  resolveBrandTurntableItemKind,
  resolveDynamicBrandShowcase,
  resolveMatchStadium,
  resolveShootoutState,
  selectPassRecipient,
  simulateOtherLeagueFixtures,
  steerPassBallTowardTarget,
  swapLineupBenchSlot,
  updateGlobalRankingsFromMatch,
  wouldHomeWinLeagueAfterMatch,
} from './rules';
import {
  UT_CARD_CATALOG,
  UT_FORMATIONS,
  UT_PACKS,
  applyUtMatchResult,
  autoPickRemainingDraft,
  buildAutoBestUtSquad,
  calculateUtSquadStats,
  createDefaultUltimateTeamState,
  createNewDraftSession,
  openUtPack,
  pickDraftCard,
  utCardsToMatchLineup,
} from './ultimateTeam';

test('CAAYVG League has 21 original clubs plus 21 expansion clubs (42 total)', () => {
  assert.equal(LEAGUE_TEAMS.length, 21);
  assert.equal(EXPANSION_TEAMS.length, 21);
  assert.equal(ALL_TEAMS.length, 42);

  const requiredNames = [
    'Brazil FC',
    'Glitter Force',
    'Gamer Rage FC',
    'Teen Titans Go',
    'Pghlfilms Fans',
    'Avocadoplayz FC',
    'Barcewiiparty',
    'Real Poofesurerid',
    'كرتون فطين',
  ];
  for (const name of requiredNames) {
    assert.ok(
      ALL_TEAMS.some((t) => t.name === name),
      `Missing required team: ${name}`
    );
  }
});

test('League has 40 animated sponsors (30+10), cups add extra sponsors, and 16 stadiums include the 5 uploaded arenas', () => {
  assert.equal(EXTRA_ANIMATED_SPONSORS.length, 10);
  assert.equal(LED_SPONSOR_ADS.length, 40);
  assert.equal(getSponsorsForCompetition('king_cup').length, CUP_LED_SPONSOR_ADS.length + 10 + 10);
  assert.equal(getSponsorsForCompetition('super_cup').length, CUP_LED_SPONSOR_ADS.length + 5 + 10);
  assert.equal(getSponsorsForCompetition('anime_cup').length, CUP_LED_SPONSOR_ADS.length + 10 + 10);
  for (const brand of ['JORDAN', 'NIKE', 'ADIDAS', 'PUMA', 'REEBOK', 'UNDER ARMOUR', 'VANS', 'NEW BALANCE', 'ASICS', 'COLUMBIA', 'CONVERSE', 'KINZA', 'CODE RED']) {
    const ad = LED_SPONSOR_ADS.find((a) => a.brand === brand);
    assert.ok(ad && ad.brandLogo, `Missing uploaded brand sponsor in League: ${brand}`);
  }
  for (const brand of ['ADIDAS', 'NIKE', 'KINZA', 'CODE RED']) {
    const cupAd = getSponsorsForCompetition('king_cup').find((ad) => ad.brand === brand);
    assert.ok(cupAd && cupAd.brandLogo, `Missing uploaded Cup brand sponsor: ${brand}`);
  }
  for (const brand of ['ARAMCO', 'SAUDIA']) {
    assert.ok(getSponsorsForCompetition('king_cup').some((ad) => ad.brand === brand));
  }
  assert.equal(STADIUMS.length, 16);
  for (const id of ['prince-abdullah-alfaisal', 'al-jawhara', 'mohammed-bin-fahd', 'king-saud-univ', 'efootball-stadium']) {
    const st = STADIUMS.find((s) => s.id === id);
    assert.ok(st && st.imageUrl?.startsWith('/assets/aistudio/'), `Missing uploaded stadium: ${id}`);
  }
  const efootball = STADIUMS.find((s) => s.id === 'efootball-stadium')!;
  assert.equal(efootball.archRoofStyle, 'efootball_blocks');
});

test('Cup round LED labels output ROUND OF 16, QUARTERFINAL, SEMIFINAL, GRAND FINALE, and CAAYVG SUPER CUP FINAL', () => {
  assert.equal(getCupRoundLedLabel('king_cup', 'ROUND OF 16'), 'ROUND OF 16');
  assert.equal(getCupRoundLedLabel('king_cup', 'QUARTER-FINALS'), 'QUARTERFINAL');
  assert.equal(getCupRoundLedLabel('king_cup', 'SEMI-FINALS'), 'SEMIFINAL');
  assert.equal(getCupRoundLedLabel('king_cup', 'FINAL'), 'GRAND FINALE');
  assert.equal(getCupRoundLedLabel('anime_cup', 'QUARTER-FINALS'), 'QUARTERFINAL');
  assert.equal(getCupRoundLedLabel('anime_cup', 'SEMI-FINALS'), 'SEMIFINAL');
  assert.equal(getCupRoundLedLabel('anime_cup', 'FINAL'), 'GRAND FINALE');
  assert.equal(getCupRoundLedLabel('super_cup', 'SUPER CUP FINAL'), 'CAAYVG SUPER CUP FINAL');
});

test('Brazil FC and Glitter Force lineups match exact requested numbers, positions, and captains', () => {
  const brz = ALL_TEAMS.find((t) => t.id === 'brazil-fc')!;
  const brzLineup = getTeamLineup(brz);
  assert.ok(brzLineup.some((p) => p.name === '3ZLD99' && p.number === 11));
  assert.ok(brzLineup.some((p) => p.name === 'Playtime' && p.number === 10 && p.isCaptain));
  assert.ok(brzLineup.some((p) => p.name === 'Flamingo2019' && p.number === 1 && p.role === 'GK'));
  assert.ok(brzLineup.some((p) => p.name === 'FLAMINGO2018' && p.number === 5));
  assert.ok(brzLineup.some((p) => p.name === 'Rebootedpoppy' && p.number === 2));
  assert.ok(brzLineup.some((p) => p.name === 'RYTH' && p.number === 8));

  const glf = ALL_TEAMS.find((t) => t.id === 'glitter-force')!;
  const glfLineup = getTeamLineup(glf);
  assert.ok(glfLineup.some((p) => p.name === 'Glitter Spring' && p.number === 1 && p.role === 'GK'));
  assert.ok(glfLineup.some((p) => p.name === 'Glitter Breeze' && p.number === 5));
  assert.ok(glfLineup.some((p) => p.name === 'Glitter Peace' && p.number === 8));
  assert.ok(glfLineup.some((p) => p.name === 'Brandon' && p.number === 7));
  assert.ok(glfLineup.some((p) => p.name === 'Glitter Lucky' && p.number === 11));
  assert.ok(glfLineup.some((p) => p.name === 'Glitter Sunny' && p.number === 14 && p.isCaptain));
});

test('Rivalry detection matches Brazil FC vs Glitter Force as THE CLÁSICO', () => {
  const clasico = findRivalry('brazil-fc', 'glitter-force', RIVALRIES);
  assert.ok(clasico);
  assert.equal(clasico.title, 'THE CLÁSICO');

  const reverse = findRivalry('glitter-force', 'brazil-fc', RIVALRIES);
  assert.equal(reverse?.id, clasico.id);

  const nonRival = findRivalry('brazil-fc', 'granite-port', RIVALRIES);
  assert.equal(nonRival, null);
});

test('League standings, singleplayer tournament, global ELO ranking, and player career stats update properly', () => {
  let standings = createInitialStandings(LEAGUE_TEAMS);
  standings = recordLeagueMatchResult(standings, 'cgy-united', 'metro-blazers', 3, 1);
  assert.equal(standings[0].teamId, 'cgy-united');
  assert.equal(standings[0].points, 3);

  const simulated = simulateOtherLeagueFixtures(standings, LEAGUE_TEAMS, new Set(['cgy-united', 'metro-blazers']), 123);
  assert.equal(simulated.length, 21);

  const spBracket = createCupBracket('singleplayer', ALL_TEAMS, 'brazil-fc');
  assert.equal(spBracket.matches.length, 15);
  assert.equal(spBracket.matches[0].homeTeamId, 'brazil-fc');

  const advanced = recordCupMatchResult(spBracket, spBracket.matches[0].id, 2, 1, 'brazil-fc', ALL_TEAMS, 55);
  assert.equal(advanced.matches.find((m) => m.roundIndex === 1)?.homeTeamId, 'brazil-fc');

  const rankings = createInitialGlobalRankings(ALL_TEAMS);
  const career = createInitialPlayerCareerStats(ALL_TEAMS);
  const brz = ALL_TEAMS.find((t) => t.id === 'brazil-fc')!;
  const glf = ALL_TEAMS.find((t) => t.id === 'glitter-force')!;

  const summary = {
    competitionId: 'league' as const,
    isSingleplayerTour: false,
    isRivalry: true,
    rivalryTitle: 'THE CLÁSICO',
    homeTeam: brz,
    awayTeam: glf,
    homeScore: 2,
    awayScore: 1,
    shootoutWinner: null,
    shootoutHomeGoals: 0,
    shootoutAwayGoals: 0,
    stats: {
      homeShots: 6,
      awayShots: 4,
      homePasses: 20,
      awayPasses: 15,
      homeTackles: 5,
      awayTackles: 4,
      homeFouls: 1,
      awayFouls: 2,
      homeYellows: 0,
      awayYellows: 1,
      homeReds: 0,
      awayReds: 0,
      homePossessionTicks: 100,
      awayPossessionTicks: 80,
    },
    cards: [],
    goalLog: [{ team: 'home' as const, playerNumber: 10, playerName: 'Pelezinho', minute: 12 }],
    playerContributions: [
      { team: 'home' as const, number: 10, goals: 2, assists: 0, shots: 4, passes: 8, tackles: 1, yellows: 0, reds: 0 },
    ],
  };

  const nextRankings = updateGlobalRankingsFromMatch(rankings, summary, false);
  const brzRow = nextRankings.find((r) => r.teamId === 'brazil-fc')!;
  assert.equal(brzRow.wins, 1);

  const prevGoals = career.find((c) => c.playerId === 'brazil-fc-10')!.goals;
  const nextCareer = applyMatchContributionsToCareerStats(career, summary);
  assert.equal(nextCareer.find((c) => c.playerId === 'brazil-fc-10')!.goals, prevGoals + 2);
});

test('Match intensity scales dynamically for rivalry and late close games', () => {
  const calm = computeMatchIntensity({ homeScore: 3, awayScore: 0, minute: 10, isRivalry: false, recentBurst: 0, redCards: 0 });
  const clasicoLate = computeMatchIntensity({ homeScore: 2, awayScore: 2, minute: 85, isRivalry: true, recentBurst: 0.2, redCards: 1 });
  assert.ok(clasicoLate.intensity > calm.intensity);
  assert.equal(clasicoLate.chantText, 'THE CLÁSICO FEVER!');
});

test('Out-of-bounds, fouls/cards, and penalty shootout rules remain accurate', () => {
  const homeGoal = classifyOutOfBounds(PITCH.right + 4, PITCH.centerY, 'home');
  assert.equal(homeGoal?.kind, 'GOAL');
  assert.equal(homeGoal?.awardedTo, 'home');

  const awayGoalKick = classifyOutOfBounds(PITCH.right + 4, PITCH.top + 10, 'home');
  assert.equal(awayGoalKick?.kind, 'GOAL_KICK');

  const homeCorner = classifyOutOfBounds(PITCH.right + 4, PITCH.bottom - 10, 'away');
  assert.equal(homeCorner?.kind, 'CORNER_KICK');

  const throwIn = classifyOutOfBounds(PITCH.centerX + 20, PITCH.top - 5, 'home');
  assert.equal(throwIn?.kind, 'THROW_IN');

  const secondYellow = evaluateTackle({
    hitPlayerFirst: true,
    fromBehind: false,
    severityRoll: 0.5,
    victimSide: 'home',
    spotX: PITCH.centerX,
    spotY: PITCH.centerY,
    tacklerExistingYellows: 1,
  });
  assert.equal(secondYellow.card, 'RED');
  assert.equal(secondYellow.secondYellowRed, true);

  const shootout = resolveShootoutState(['G', 'G', 'G'], ['M', 'M', 'M']);
  assert.equal(shootout.decided, true);
  assert.equal(shootout.winner, 'home');
});

test('Middle LED board uses exclusive competition logos, all 16 bilingual cities, and exact 23.0s timeline', () => {
  assert.equal(COMPETITION_LOGO_URLS.league, '/assets/aistudio/images_27ba353f.png');
  assert.equal(COMPETITION_LOGO_URLS.king_cup, '/assets/aistudio/03-outpost-marathon-760x760-512x512_611c214d.jpg');
  assert.equal(COMPETITION_LOGO_URLS.super_cup, '/assets/aistudio/Perimeter_1eb6bbbe.png');
  assert.equal(COMPETITION_LOGO_URLS.anime_cup, '/assets/aistudio/Cryo_Archive_a095aabd.jpeg');
  assert.equal(MIDDLE_LED_CYCLE_SECONDS, 23.0);

  assert.equal(STADIUMS[0].cityDisplay, 'Pixel City - مدينة البكسل');
  assert.equal(STADIUMS[1].cityDisplay, 'Rio - ريو');
  assert.equal(STADIUMS[2].cityDisplay, 'Rainbow Town - مدينة قوس قزح');
  assert.equal(STADIUMS.length, 16);
  for (const st of STADIUMS) {
    assert.ok(st.cityDisplay.includes(' - '), `Missing bilingual cityDisplay on ${st.id}`);
  }

  assert.equal(getMiddleLedPhase(0.0).phase, 'primary_hold');
  assert.equal(getMiddleLedPhase(4.99).phase, 'primary_hold');
  assert.equal(getMiddleLedPhase(5.05).phase, 'primary_fly_up');
  assert.equal(getMiddleLedPhase(5.55).phase, 'logo_fly_up_1');
  assert.equal(getMiddleLedPhase(6.39).phase, 'logo_fly_up_1');
  assert.equal(getMiddleLedPhase(6.45).phase, 'stadium_fly_down');
  assert.equal(getMiddleLedPhase(7.15).phase, 'stadium_hold');
  assert.equal(getMiddleLedPhase(16.09).phase, 'stadium_hold');
  assert.equal(getMiddleLedPhase(16.15).phase, 'city_fly_up');
  assert.equal(getMiddleLedPhase(16.59).phase, 'city_fly_up');
  assert.equal(getMiddleLedPhase(16.65).phase, 'city_hold');
  assert.equal(getMiddleLedPhase(21.29).phase, 'city_hold');
  assert.equal(getMiddleLedPhase(21.35).phase, 'logo_fly_up_2');
  assert.equal(getMiddleLedPhase(21.99).phase, 'logo_fly_up_2');
  assert.equal(getMiddleLedPhase(22.05).phase, 'primary_fly_down');
  assert.equal(getMiddleLedPhase(23.05).phase, 'primary_hold');
});

test('Front/side ball-first tackles register cleanly while late lunges from behind count as player-first fouls', () => {
  assert.equal(isTackleHitPlayerFirst({ distToBall: 8, fromBehind: false }), false);
  assert.equal(isTackleHitPlayerFirst({ distToBall: 12, fromBehind: false }), false);
  assert.equal(isTackleHitPlayerFirst({ distToBall: 8, fromBehind: true }), true);
  assert.equal(isTackleHitPlayerFirst({ distToBall: 15, fromBehind: false }), true);
});

test('Passing selects aimed teammate, computes accurate intercept velocity, and steers onto moving receiver', () => {
  const passer = { x: 200, y: 170, facingX: 1, facingY: 0 };
  const teammates = [
    { id: 'home-8', x: 255, y: 168, vx: 0, vy: 25, role: 'MID' as const },
    { id: 'home-5', x: 140, y: 165, vx: 0, vy: 0, role: 'DEF' as const },
  ];
  const target = selectPassRecipient(passer, teammates, false, 1, 0);
  assert.equal(target?.id, 'home-8');

  const idlePass = computePassVelocity(passer, teammates[0], false, true);
  assert.equal(idlePass.targetX, 255);
  assert.equal(idlePass.targetY, 168);

  const steered = steerPassBallTowardTarget(
    { x: 230, y: 168, vx: 180, vy: 0 },
    { x: 260, y: 185 },
    0.1
  );
  assert.ok(steered.vx > 0);
  assert.ok(steered.vy > 0, 'Pass steering must bend toward shifted receiver Y');

  // Close-range homing still bends toward receiver within 65px even if receiver reversed behind ball velocity
  const closeHomed = steerPassBallTowardTarget(
    { x: 240, y: 168, vx: 160, vy: 0 },
    { x: 210, y: 168 },
    0.05
  );
  assert.ok(closeHomed.vx < 160, 'Close-range pass steering must bend back toward nearby receiver');

  const withGk = selectPassRecipient(
    passer,
    [
      { id: 'home-1', x: 120, y: 170, vx: 0, vy: 0, role: 'GK' },
      { id: 'home-5', x: 135, y: 165, vx: 0, vy: 0, role: 'DEF' },
    ],
    false,
    -1,
    0
  );
  assert.equal(withGk?.id, 'home-5');
});

test('Pressing opponent AI speed is significantly slower than user dribble and home teammate support', () => {
  const oppPress = computeAiPressSpeed({
    teamSide: 'away',
    teamSpeed: 82,
    isHomeDefensePress: false,
    isLooseBallChaser: false,
    isOpponentPress: true,
    isOpponentCover: false,
    shouldPress: true,
  });
  const oppCover = computeAiPressSpeed({
    teamSide: 'away',
    teamSpeed: 82,
    isHomeDefensePress: false,
    isLooseBallChaser: false,
    isOpponentPress: false,
    isOpponentCover: true,
    shouldPress: false,
  });
  const homePress = computeAiPressSpeed({
    teamSide: 'home',
    teamSpeed: 82,
    isHomeDefensePress: true,
    isLooseBallChaser: false,
    isOpponentPress: false,
    isOpponentCover: false,
    shouldPress: true,
  });
  assert.ok(oppPress < 55, `Expected pressing opponent to be slow (<55), got ${oppPress}`);
  assert.ok(oppCover < oppPress, 'Covering opponent should be slower than active press');
  assert.ok(homePress > oppPress + 25, 'Home defensive support should outpace pressing opponent');
});

test('38-round League fixtures ensure user plays in Rounds 30..38 and simulate rounds cleanly', () => {
  assert.equal(TOTAL_LEAGUE_ROUNDS, 38);
  const premierFixtures = createLeagueFixtures(LEAGUE_TEAMS, 'cgy-united', 38);
  const expansionFixtures = createLeagueFixtures(EXPANSION_TEAMS, 'brazil-fc', 38);
  assert.equal(premierFixtures.length, 38);
  assert.equal(expansionFixtures.length, 38);
  for (const roundObj of premierFixtures) {
    assert.equal(roundObj.matches.length, 10, `Round ${roundObj.round} of 21 clubs should have 10 matches`);
  }
  for (let r = 30; r <= 38; r++) {
    const userFix = getUserFixtureForRound(expansionFixtures, r, 'brazil-fc');
    assert.ok(userFix !== null, `User club must never have a bye in Round ${r} (Road to Round 38)`);
  }

  let standings = createInitialStandings(EXPANSION_TEAMS);
  const userR1 = getUserFixtureForRound(expansionFixtures, 1, 'brazil-fc');
  const oppId = userR1
    ? userR1.homeTeamId === 'brazil-fc'
      ? userR1.awayTeamId
      : userR1.homeTeamId
    : 'glitter-force';

  const sim1 = recordAndSimulateLeagueRound({
    schedules: expansionFixtures,
    standings,
    teams: EXPANSION_TEAMS,
    round: 1,
    userMatch: { homeTeamId: 'brazil-fc', awayTeamId: oppId, homeScore: 3, awayScore: 0 },
    seed: 777,
  });
  standings = sim1.standings;
  const r1Schedule = sim1.schedules.find((s) => s.round === 1)!;
  assert.ok(r1Schedule.matches.every((m) => m.played), 'All Round 1 matches should be marked played');
  const brzRow = standings.find((s) => s.teamId === 'brazil-fc')!;
  assert.equal(brzRow.points, 3);
  assert.equal(brzRow.goalsFor, 3);
});

test('Road to Round 38 triggers in Rounds 30..37, Grand Finale 38 triggers in Round 38, and trophy eligibility covers all 4 modes', () => {
  assert.equal(isRoadToRound38('league', 29, false), false);
  assert.equal(isRoadToRound38('league', 30, false), true);
  assert.equal(isRoadToRound38('league', 37, false), true);
  assert.equal(isRoadToRound38('league', 38, false), false);
  assert.equal(isLeagueGrandFinale38('league', 37, false), false);
  assert.equal(isLeagueGrandFinale38('league', 38, false), true);
  assert.equal(isRoadToRound38('league', 32, true), false);
  assert.equal(isRoadToRound38('king_cup', 35, false), false);

  assert.equal(isCupFinalRound('super_cup', false, 'SUPER CUP FINAL'), true);
  assert.equal(isCupFinalRound('king_cup', false, 'FINAL'), true);
  assert.equal(isCupFinalRound('king_cup', false, 'QUARTER-FINALS'), false);
  assert.equal(isCupFinalRound('anime_cup', false, 'FINAL'), true);
  assert.equal(isCupFinalRound('league', true, 'FINAL'), true);
  assert.equal(isCupFinalRound('league', false, null), false);

  const standings = createInitialStandings(EXPANSION_TEAMS);
  assert.equal(
    wouldHomeWinLeagueAfterMatch({
      standings,
      homeTeamId: 'brazil-fc',
      awayTeamId: 'glitter-force',
      homeScore: 2,
      awayScore: 0,
      leagueRound: 38,
    }),
    true
  );
  assert.equal(
    wouldHomeWinLeagueAfterMatch({
      standings,
      homeTeamId: 'brazil-fc',
      awayTeamId: 'glitter-force',
      homeScore: 2,
      awayScore: 0,
      leagueRound: 37,
    }),
    false
  );

  assert.equal(getTrophyTitle('league', false), 'CAAYVG LEAGUE 26/27');
  assert.equal(getTrophyTitle('king_cup', false), 'KING CHAMPION CUP 26/27');
  assert.equal(getTrophyTitle('super_cup', false), 'CAAYVG SUPER CUP 26/27');
  assert.equal(getTrophyTitle('anime_cup', false), 'ANIME KING CHAMPION CUP 26/27');
  assert.equal(getTrophyTitle('league', true), 'CAAYVG TOURNAMENT 26/27');
});

test('Club colors, R38 Brazil FC vs Glitter Force finale, Top 4 Promotion, Dates & Times, Cup Group Stages + Jump, and Tactics/Subs work cleanly', () => {
  const brz = ALL_TEAMS.find((t) => t.id === 'brazil-fc')!;
  const glf = ALL_TEAMS.find((t) => t.id === 'glitter-force')!;
  assert.equal(brz.primaryColor, '#facc15');
  assert.equal(brz.secondaryColor, '#ec4899');
  assert.equal(glf.primaryColor, '#f97316');
  assert.equal(glf.secondaryColor, '#ea580c');

  // Round 38 guaranteed Brazil FC vs Glitter Force in Expansion league schedule + date/time labels
  const expSchedules = createLeagueFixtures(EXPANSION_TEAMS, 'brazil-fc', 38);
  const r38 = expSchedules.find((s) => s.round === 38)!;
  assert.ok(r38.dateLabel && r38.timeLabel);
  assert.ok(
    r38.matches.some(
      (m) =>
        (m.homeTeamId === 'brazil-fc' && m.awayTeamId === 'glitter-force') ||
        (m.homeTeamId === 'glitter-force' && m.awayTeamId === 'brazil-fc')
    ),
    'Round 38 of 38 must feature Brazil FC vs Glitter Force'
  );
  const dt1 = getLeagueRoundDateTime(1);
  const dtCup = getCupRoundDateTime('king_cup', 0, true);
  assert.ok(dt1.dateLabel.includes('2026'));
  assert.ok(dtCup.dateLabel.length > 0 && dtCup.timeLabel.length > 0);

  // Top 4 promotion
  const expStd = createInitialStandings(EXPANSION_TEAMS);
  const promo = getPromotedTeamIds(expStd);
  assert.equal(promo.length, 4);

  // Group Stages + Jump in King Cup & Anime Cup
  const kingBracket = createCupBracket('king_cup', ALL_TEAMS, 'brazil-fc');
  assert.equal(kingBracket.stageMode, 'group');
  assert.equal(kingBracket.groups?.length, 4);
  const pendingGroup = getNextPendingCupMatch(kingBracket, 'brazil-fc');
  assert.equal(pendingGroup?.roundName, 'GROUP STAGES');
  assert.equal(getCupRoundLedLabel('king_cup', pendingGroup?.roundName), 'GROUP STAGES');

  const jumpedFinal = jumpCupBracketToRound('king_cup', ALL_TEAMS, 'brazil-fc', 'FINAL');
  assert.equal(jumpedFinal.stageMode, 'knockout');
  assert.equal(jumpedFinal.matches[0].roundName, 'FINAL');
  assert.equal(getCupRoundLedLabel('king_cup', jumpedFinal.matches[0].roundName), 'GRAND FINALE');

  const animeBracket = createCupBracket('anime_cup', ALL_TEAMS, 'glitter-force');
  assert.equal(animeBracket.stageMode, 'group');
  assert.equal(animeBracket.groups?.length, 2);

  // 11v11 Formations, tactics & 7-sub bench swap
  const baseLineup = getTeamLineup(brz);
  assert.equal(baseLineup.length, 11);
  const blitzLineup = getFormationLineupWithTactics(brz, '4-3-3', 'all_out_attack', baseLineup);
  assert.equal(blitzLineup.length, 11);
  assert.equal(blitzLineup.filter((p) => p.role === 'FWD').length, 3);
  const bench = getTeamBench(brz);
  assert.equal(bench.length, 7);
  const { lineup: afterSub, bench: afterBench } = swapLineupBenchSlot(blitzLineup, bench, 10, 6);
  assert.equal(afterSub[10].name, bench[6].name);
  assert.equal(afterBench[6].name, blitzLineup[10].name);
});

test('Stadiums feature Al-Awwal Park and King Abdullah Sports City Stadium, 10 LED animations, and exact 12-second brand ad phases with Code Red, Kinza, and Adidas F50 OR PREDATOR!', () => {
  const alAwwal = STADIUMS.find((s) => s.id === 'king-saud-univ');
  const kasc = STADIUMS.find((s) => s.id === 'al-jawhara');
  assert.equal(alAwwal?.name, 'Al-Awwal Park');
  assert.equal(kasc?.name, 'King Abdullah Sports City Stadium');
  assert.equal(LED_EXTRA_ANIMATIONS.length, 10);

  // Leading sponsors showcase Nike, Adidas (F50 OR PREDATOR!), Code Red can, and Kinza can immediately
  assert.equal(LED_SPONSOR_ADS[0].brand, 'NIKE');
  assert.equal(LED_SPONSOR_ADS[1].brand, 'ADIDAS');
  assert.equal(LED_SPONSOR_ADS[1].tagline, 'F50 OR PREDATOR!');
  assert.equal(LED_SPONSOR_ADS[2].brand, 'CODE RED');
  assert.equal(LED_SPONSOR_ADS[2].tagline, 'TAKE THE RIGHT STEPS!');
  assert.equal(LED_SPONSOR_ADS[2].logoKind, 'can');
  assert.equal(LED_SPONSOR_ADS[3].brand, 'KINZA');
  assert.equal(LED_SPONSOR_ADS[3].tagline, 'TASTE THE SPARK!');
  assert.equal(LED_SPONSOR_ADS[3].logoKind, 'can');
  assert.equal(LED_SPONSOR_ADS[4].brand, 'PUMA');

  // Verify Cup sponsors match updated Code Red, Kinza, and Adidas slogans
  const cupAdidas = CUP_LED_SPONSOR_ADS.find((a) => a.brand === 'ADIDAS');
  const cupCodeRed = CUP_LED_SPONSOR_ADS.find((a) => a.brand === 'CODE RED');
  const cupKinza = CUP_LED_SPONSOR_ADS.find((a) => a.brand === 'KINZA');
  assert.equal(cupAdidas?.tagline, 'F50 OR PREDATOR!');
  assert.equal(cupCodeRed?.tagline, 'TAKE THE RIGHT STEPS!');
  assert.equal(cupCodeRed?.logoKind, 'can');
  assert.equal(cupKinza?.tagline, 'TASTE THE SPARK!');
  assert.equal(cupKinza?.logoKind, 'can');

  assert.equal(BRAND_AD_CYCLE_SECONDS, 12.0);
  assert.equal(getBrandAd12sPhase(0.0).phase, 'zoom_logo_drop');
  assert.equal(getBrandAd12sPhase(0.69).phase, 'zoom_logo_drop');
  assert.equal(getBrandAd12sPhase(0.75).phase, 'shoes_fly_down');
  assert.equal(getBrandAd12sPhase(2.19).phase, 'shoes_fly_down');
  assert.equal(getBrandAd12sPhase(2.25).phase, 'shoes_name_hold');
  assert.equal(getBrandAd12sPhase(9.19).phase, 'shoes_name_hold');
  assert.equal(getBrandAd12sPhase(9.25).phase, 'exit_down');
  assert.equal(getBrandAd12sPhase(10.69).phase, 'exit_down');
  assert.equal(getBrandAd12sPhase(10.75).phase, 'brand_logo_drop_again');
  assert.equal(getBrandAd12sPhase(11.39).phase, 'brand_logo_drop_again');
  assert.equal(getBrandAd12sPhase(11.45).phase, 'brand_logo_hold');
  assert.equal(getBrandAd12sPhase(11.99).phase, 'brand_logo_hold');
  assert.equal(getBrandAd12sPhase(12.05).phase, 'zoom_logo_drop');

  // Verify actual shoe & soda display names on pitch-side perimeter LED boards
  assert.equal(getShoeDisplayModelName('shoe_nike', 0), 'NIKE AIR JORDAN 1');
  assert.equal(getShoeDisplayModelName('shoe_adidas_f50', 0), 'ADIDAS F50');
  assert.equal(getShoeDisplayModelName('shoe_adidas_predator', 0), 'ADIDAS PREDATOR');
  assert.equal(getShoeDisplayModelName('shoe_puma', 0), 'PUMA SUEDE XL');
  assert.equal(getShoeDisplayModelName('soda_code_red', 0), 'CODE RED');
  assert.equal(getShoeDisplayModelName('soda_kinza', 0), 'KINZA COLA');
});

test('360-degree Nike, Adidas F50 & Predator shoes and Code Red & Kinza soda cans rotate horizontally around Y-axis in pixels without flipping upside down', () => {
  const kinds: TurntableItemKind[] = [
    'shoe_nike',
    'shoe_adidas_f50',
    'shoe_adidas_predator',
    'shoe_puma',
    'soda_code_red',
    'soda_kinza',
    'soda_can',
    'soda_bottle',
  ];
  const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (3 * Math.PI) / 2];

  for (const kind of kinds) {
    for (const yaw of angles) {
      const { bounds } = render360TurntableToPixelGrid(kind, yaw, '#ffffff', '#ef4444');
      assert.equal(bounds.width, 40);
      assert.equal(bounds.height, 28);
      assert.ok(bounds.filledPixels > 60, `${kind} at yaw=${yaw} should render dense zoomed-in pixels`);
      // Upright invariant: collar/top center Y must remain above sole center Y (smaller canvas Y) at every angle
      assert.ok(
        bounds.collarCenterY < bounds.soleCenterY,
        `${kind} flipped upside down at yaw=${yaw} (collar=${bounds.collarCenterY}, sole=${bounds.soleCenterY})`
      );
    }

    // Side profile (yaw=PI/2) must be wider horizontally than head-on toe/heel profile (yaw=0)
    if (kind.startsWith('shoe_')) {
      const front = render360TurntableToPixelGrid(kind, 0, '#ffffff', '#ef4444').bounds;
      const side = render360TurntableToPixelGrid(kind, Math.PI / 2, '#ffffff', '#ef4444').bounds;
      const sideSpanX = side.maxX - side.minX;
      const frontSpanX = front.maxX - front.minX;
      assert.ok(
        sideSpanX > frontSpanX,
        `${kind} side profile (${sideSpanX}) should be wider than head-on toe view (${frontSpanX})`
      );
    }
  }
});

test('Version info, League vs Tournament tab visibility, updated rivalries, random sponsors, stadium finals rule, difficulty scaling, and configurable match length', () => {
  assert.match(GAME_VERSION, /^v\d+\.\d+\.\d+/);
  assert.equal(DIFFICULTY_OPTIONS.length, 4);
  assert.ok(MATCH_LENGTH_OPTIONS.some((o) => o.halfSeconds === 45));
  assert.ok(MATCH_LENGTH_OPTIONS.some((o) => o.halfSeconds >= 120));

  // Hub tab filtering rules
  const leagueTabs = getVisibleHubTabs('league', false);
  assert.ok(!leagueTabs.includes('bracket'), 'League must not expose Cups & Groups tab');
  assert.ok(leagueTabs.includes('fixtures') && leagueTabs.includes('standings'));

  for (const cupComp of ['king_cup', 'super_cup', 'anime_cup'] as const) {
    const cupTabs = getVisibleHubTabs(cupComp, false);
    assert.ok(!cupTabs.includes('fixtures'), `${cupComp} must hide League Fixtures`);
    assert.ok(!cupTabs.includes('standings'), `${cupComp} must hide League Tables`);
    assert.ok(cupTabs.includes('bracket'), `${cupComp} must show Cups & Groups`);
  }
  const spTabs = getVisibleHubTabs('league', true);
  assert.ok(!spTabs.includes('fixtures') && !spTabs.includes('standings'));
  assert.ok(spTabs.includes('bracket'));

  // Rivalries: Brazil FC vs Glitter Force stays THE CLÁSICO; the other 4 have unique derby names and random LED configs
  const wii = findRivalry('barcewiiparty', 'real-poofesurerid', RIVALRIES);
  const creator = findRivalry('gamer-rage-fc', 'pghlfilms-fans', RIVALRIES);
  const toon = findRivalry('teen-titans-go', 'cartoon-fateen', RIVALRIES);
  const caayvg = findRivalry('cgy-united', 'metro-blazers', RIVALRIES);
  assert.equal(wii?.title, 'WII PARTY DERBY');
  assert.equal(creator?.title, 'CREATOR CLASH');
  assert.equal(toon?.title, 'TOON SHOWDOWN');
  assert.equal(caayvg?.title, 'METRO FIRE DERBY');

  const cfgA = buildRandomRivalryLedConfig(wii!.id, wii!.title, 'Barcewiiparty', 'Real Poofesurerid', 101);
  const cfgB = buildRandomRivalryLedConfig(wii!.id, wii!.title, 'Barcewiiparty', 'Real Poofesurerid', 202);
  assert.ok(cfgA.slogan.length > 0 && cfgB.slogan.length > 0);
  assert.notEqual(cfgA.animMode, cfgA.secondaryAnimMode);
  assert.ok(
    cfgA.animMode !== cfgB.animMode ||
      cfgA.bgPrimary !== cfgB.bgPrimary ||
      cfgA.iconKind !== cfgB.iconKind ||
      cfgA.slogan !== cfgB.slogan
  );

  // Random sponsor selection never repeats consecutively on the same strip
  const seen = new Set<number>();
  let prevIdx = pickRandomSponsorIndex(0, 1, 20, 4242);
  seen.add(prevIdx);
  for (let c = 1; c <= 25; c++) {
    const nextIdx = pickRandomSponsorIndex(c, 1, 20, 4242);
    assert.notEqual(nextIdx, prevIdx, `Sponsor cycle ${c} repeated index ${nextIdx}`);
    seen.add(nextIdx);
    prevIdx = nextIdx;
  }
  assert.ok(seen.size >= 5);

  // Random stadium every match, and Tournament Finals locked to King Abdullah Sports City Stadium
  const finalStadium = resolveMatchStadium({
    stadiums: STADIUMS,
    isFinalMatch: true,
    previousStadiumId: TOURNAMENT_FINAL_STADIUM_ID,
    seed: 999,
  });
  assert.equal(finalStadium.id, TOURNAMENT_FINAL_STADIUM_ID);
  assert.equal(finalStadium.name, 'King Abdullah Sports City Stadium');

  const nonFinalA = resolveMatchStadium({
    stadiums: STADIUMS,
    isFinalMatch: false,
    previousStadiumId: STADIUMS[0].id,
    seed: 12345,
  });
  assert.notEqual(nonFinalA.id, STADIUMS[0].id);

  // Difficulty progression
  const pressEasy = computeAiPressSpeed({
    teamSide: 'away',
    teamSpeed: 80,
    isHomeDefensePress: false,
    isLooseBallChaser: false,
    isOpponentPress: true,
    isOpponentCover: false,
    shouldPress: true,
    difficulty: 'easy',
  });
  const pressNormal = computeAiPressSpeed({
    teamSide: 'away',
    teamSpeed: 80,
    isHomeDefensePress: false,
    isLooseBallChaser: false,
    isOpponentPress: true,
    isOpponentCover: false,
    shouldPress: true,
    difficulty: 'normal',
  });
  const pressHard = computeAiPressSpeed({
    teamSide: 'away',
    teamSpeed: 80,
    isHomeDefensePress: false,
    isLooseBallChaser: false,
    isOpponentPress: true,
    isOpponentCover: false,
    shouldPress: true,
    difficulty: 'hard',
  });
  const pressLegend = computeAiPressSpeed({
    teamSide: 'away',
    teamSpeed: 80,
    isHomeDefensePress: false,
    isLooseBallChaser: false,
    isOpponentPress: true,
    isOpponentCover: false,
    shouldPress: true,
    difficulty: 'legendary',
  });
  assert.ok(pressEasy < pressNormal && pressNormal < pressHard && pressHard < pressLegend);
  assert.ok(getDifficultyConfig('legendary').shootoutAiGuessRate > getDifficultyConfig('easy').shootoutAiGuessRate);

  // Match length clamping & extra time scaling
  assert.equal(clampMatchHalfSeconds(undefined), 45);
  assert.equal(clampMatchHalfSeconds(120), 120);
  assert.equal(clampMatchHalfSeconds(999), 300);
  assert.equal(getExtraTimeHalfSeconds(90), 30);
  assert.equal(getExtraTimeHalfSeconds(45), 15);

  // Rivalry LED config across 500 timestamp-scale seeds must never emit undefined
  for (let i = 0; i < 500; i++) {
    const cfg = buildRandomRivalryLedConfig(
      'wii-clasico',
      'WII PARTY DERBY',
      'Barcewiiparty',
      'Real Poofesurerid',
      1795300000000 + i * 7919
    );
    assert.ok(cfg.iconKind.length > 0);
    assert.ok(!cfg.slogan.includes('UNDEFINED') && !cfg.slogan.includes('undefined'));
  }
});

test('Changelog exists, non-shoe sponsors use non-shoe 360° turntable items except Nike/Adidas/Puma, and Coca-Cola/7Up/Kinza/Code Red support new flavors & any colors', () => {
  // 1. Changelog entries & Hub tab visibility
  assert.ok(CHANGELOG_ENTRIES.length >= 2);
  assert.equal(CHANGELOG_ENTRIES[0].version, GAME_VERSION);
  assert.ok(CHANGELOG_ENTRIES[0].highlights.length >= 4);
  assert.ok(getVisibleHubTabs('league', false).includes('changelog'));
  assert.ok(getVisibleHubTabs('king_cup', false).includes('changelog'));

  // 2. Coca-Cola & 7Up added as 360° soda cans in both League and Cups
  for (const comp of ['league', 'king_cup', 'super_cup', 'anime_cup'] as const) {
    const sponsors = getSponsorsForCompetition(comp);
    const coke = sponsors.find((s) => s.brand === 'COCA-COLA');
    const sevenUp = sponsors.find((s) => s.brand === '7UP');
    assert.ok(coke && coke.logoKind === 'can' && coke.brandLogo === 'coca_cola', `Missing Coca-Cola can in ${comp}`);
    assert.ok(sevenUp && sevenUp.logoKind === 'can' && sevenUp.brandLogo === 'seven_up', `Missing 7Up can in ${comp}`);
  }

  // 3. Only Nike, Adidas, and Puma map to shoes; every other sponsor uses non-shoe 360° turntable items
  const allAds = [
    ...LED_SPONSOR_ADS,
    ...CUP_LED_SPONSOR_ADS,
    ...getSponsorsForCompetition('king_cup'),
    ...getSponsorsForCompetition('super_cup'),
    ...getSponsorsForCompetition('anime_cup'),
  ];
  for (const ad of allAds) {
    const kind = resolveBrandTurntableItemKind(ad, 0);
    const upper = ad.brand.toUpperCase();
    if (upper === 'NIKE' || upper === 'ADIDAS' || upper === 'PUMA') {
      assert.ok(kind.startsWith('shoe_'), `${upper} should use shoe turntable, got ${kind}`);
    } else {
      assert.ok(!kind.startsWith('shoe'), `${upper} should NOT use shoes, got ${kind}`);
    }
  }
  assert.equal(resolveBrandTurntableItemKind({ brand: 'COCA-COLA', logoKind: 'can' }), 'soda_coca_cola');
  assert.equal(resolveBrandTurntableItemKind({ brand: '7UP', logoKind: 'can' }), 'soda_7up');
  assert.equal(resolveBrandTurntableItemKind({ brand: 'CODE RED', logoKind: 'can' }), 'soda_code_red');
  assert.equal(resolveBrandTurntableItemKind({ brand: 'KINZA', logoKind: 'can' }), 'soda_kinza');

  // 4. All new 360° non-shoe turntable items and soda cans stay upright across all Y-axis angles
  const newKinds: TurntableItemKind[] = [
    'soda_coca_cola',
    'soda_7up',
    'item_controller',
    'item_ball',
    'item_trophy',
    'item_crown',
    'item_chip',
    'item_burger',
    'item_cup',
    'item_gem',
    'item_bolt',
    'item_star',
    'item_airplane',
  ];
  for (const kind of newKinds) {
    for (const yaw of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
      const { bounds } = render360TurntableToPixelGrid(kind, yaw, '#38bdf8', '#facc15');
      assert.ok(bounds.filledPixels > 45, `${kind} should render visible pixels`);
      assert.ok(
        bounds.collarCenterY < bounds.soleCenterY,
        `${kind} must remain upright at yaw=${yaw}`
      );
    }
  }

  // 5. Coca-Cola, 7Up, Kinza, and Code Red each have multiple new flavors & distinct colors applied dynamically to voxels
  for (const brand of ['COCA-COLA', '7UP', 'KINZA', 'CODE RED'] as const) {
    const list = SODA_FLAVOR_VARIANTS[brand];
    assert.ok(list.length >= 6, `${brand} should have >= 6 new flavor/color variants`);
    const uniqueColors = new Set(list.map((v) => v.primaryColor));
    assert.ok(uniqueColors.size >= 5, `${brand} should span diverse soda colors`);

    const v0 = getSodaFlavorVariant(brand, 101, 0, 0);
    const v1 = getSodaFlavorVariant(brand, 102, 0, 1);
    assert.notEqual(v0.flavorName, v1.flavorName);
  }

  // Verify Code Red, Kinza, Coca-Cola, 7Up reflect arbitrary custom colors in rendered pixel buffer
  const blueCodeRed = render360TurntableToPixelGrid('soda_code_red', 0, '#0284c7', '#38bdf8');
  const purpleKinza = render360TurntableToPixelGrid('soda_kinza', 0, '#7e22ce', '#facc15');
  assert.ok(blueCodeRed.colors.some((c) => c === '#0284c7' || c?.startsWith('rgb(2,132,199)')));
  assert.ok(purpleKinza.colors.some((c) => c === '#7e22ce' || c?.startsWith('rgb(126,34,206)')));
});

test('v3.0.0 update (biggest update ever): Nov 23 changelog, 0.7s logo drop, 10s showcase with 1.5s bgColor + shape + item switches, 11v11 in every gamemode, and Ultimate Team', () => {
  // 1. Version & Nov 23, 2026 Changelog
  assert.equal(GAME_VERSION, 'v3.0.0');
  assert.equal(CHANGELOG_ENTRIES[0].version, 'v3.0.0');
  assert.equal(CHANGELOG_ENTRIES[0].date, 'NOV 23, 2026');
  assert.equal(CHANGELOG_ENTRIES[1].version, 'v2.9.0');

  // 2. 35 brand-new randomly generated LED shape patterns
  assert.equal(LED_NEW_SHAPE_PATTERNS.length, 35);
  assert.equal(new Set(LED_NEW_SHAPE_PATTERNS).size, 35);
  const visitedPatterns = new Set<string>();
  let prevPat = pickRandomLedShapePattern(0, 0, 20261123);
  visitedPatterns.add(prevPat);
  for (let c = 1; c <= 80; c++) {
    const nextPat = pickRandomLedShapePattern(c, 0, 20261123);
    assert.notEqual(nextPat, prevPat, `Shape pattern repeated on consecutive cycle ${c}`);
    visitedPatterns.add(nextPat);
    prevPat = nextPat;
  }
  assert.ok(visitedPatterns.size >= 25, `Expected broad coverage across 35 shape patterns, got ${visitedPatterns.size}`);

  // 3. Real brand logo registry covers every sponsor across all competitions
  for (const comp of ['league', 'king_cup', 'super_cup', 'anime_cup'] as const) {
    for (const ad of getSponsorsForCompetition(comp)) {
      assert.ok(hasRealBrandLogo(ad.brand), `Sponsor ${ad.brand} in ${comp} must have a real brand logo`);
    }
  }

  // 4. 0.7s downward logo drop + 10.0s showcase (0.7..10.7s) + 1.5s dynamic bgColor, shape, item, flavor, and name switching
  assert.equal(SHOWCASE_SWITCH_INTERVAL_SECONDS, 1.5);
  assert.equal(getShowcase1_5sTick(0.8), 0);
  assert.equal(getShowcase1_5sTick(2.25), 1);
  assert.equal(getShowcase1_5sTick(3.75), 2);
  assert.equal(getShowcase2_1sTick(2.25), 1);

  const cocaCola = LED_SPONSOR_ADS.find((a) => a.brand === 'COCA-COLA')!;
  const cc0 = resolveDynamicBrandShowcase(cocaCola, 999, 0, 0, 0.9);
  const cc1 = resolveDynamicBrandShowcase(cocaCola, 999, 0, 0, 2.4);
  const cc2 = resolveDynamicBrandShowcase(cocaCola, 999, 0, 0, 3.9);
  assert.equal(cc0.itemKind, 'soda_coca_cola');
  assert.notEqual(cc0.displayLabel, cc1.displayLabel);
  assert.notEqual(cc1.displayLabel, cc2.displayLabel);
  assert.notEqual(cc0.bgColor, cc1.bgColor, 'LED background color must switch dynamically every 1.5s');
  assert.notEqual(cc1.bgColor, cc2.bgColor, 'LED background color must continue switching every 1.5s');

  const razer = LED_SPONSOR_ADS.find((a) => a.brand === 'RAZER')!;
  const rz0 = resolveDynamicBrandShowcase(razer, 888, 1, 0, 0.9);
  const rz1 = resolveDynamicBrandShowcase(razer, 888, 1, 0, 2.4);
  const rz2 = resolveDynamicBrandShowcase(razer, 888, 1, 0, 3.9);
  assert.ok(!rz0.itemKind.startsWith('shoe') && !rz1.itemKind.startsWith('shoe') && !rz2.itemKind.startsWith('shoe'));
  assert.notEqual(rz0.displayLabel, rz1.displayLabel);
  assert.notEqual(rz1.itemKind, rz2.itemKind);

  const nike = LED_SPONSOR_ADS.find((a) => a.brand === 'NIKE')!;
  const nk0 = resolveDynamicBrandShowcase(nike, 777, 0, 0, 0.9);
  const nk1 = resolveDynamicBrandShowcase(nike, 777, 0, 0, 2.4);
  assert.equal(nk0.itemKind, 'shoe_nike');
  assert.equal(nk1.itemKind, 'shoe_nike');
  assert.notEqual(nk0.displayLabel, nk1.displayLabel);

  // 5. 11v11 in EVERY gamemode: all 42 clubs have 11 starters & 7 bench subs across all 4 11-player formations
  assert.equal(FORMATIONS.length, 4);
  for (const f of FORMATIONS) {
    assert.equal(f.slotPositions.length, 11, `Formation ${f.id} must have 11 tactical slots`);
  }
  for (const club of ALL_TEAMS) {
    assert.equal(getTeamLineup(club).length, 11, `${club.name} must field 11 starters`);
    assert.equal(getTeamBench(club).length, 7, `${club.name} must have 7 substitutes`);
  }

  // 6. Ultimate Team: Packs + Animation Walkouts, Cards & Ratings, Your Team (XI), FUT Draft, Division Rivals
  assert.ok(UT_CARD_CATALOG.length >= 40);
  assert.equal(UT_PACKS.length, 4);
  assert.deepEqual(UT_FORMATIONS, ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1']);

  const utState = createDefaultUltimateTeamState();
  assert.equal(utState.activeSquadCardIds.length, 11);
  assert.equal(utState.rivals.division, 10);

  // Pack opening returns 5 cards + walkout star card + duplicate coin refund calculation
  const megaPull = openUtPack('icon_mega', utState.ownedCardIds, 424242);
  assert.equal(megaPull.cards.length, 5);
  assert.ok(
    megaPull.walkoutCard.rarity === 'icon' || megaPull.walkoutCard.rarity === 'hero',
    'Icon & Hero Mega Pack guarantees Icon/Hero walkout card'
  );
  const sqLineup = utCardsToMatchLineup(utState.activeSquadCardIds, '4-3-3');
  assert.equal(sqLineup.length, 11);

  const upgradedOwned = Array.from(new Set([...utState.ownedCardIds, ...megaPull.cards.map((c) => c.id)]));
  const bestXi = buildAutoBestUtSquad(upgradedOwned, '4-3-3');
  assert.equal(bestXi.length, 11);
  const oldStats = calculateUtSquadStats(utState.activeSquadCardIds, '4-3-3');
  const newStats = calculateUtSquadStats(bestXi, '4-3-3');
  assert.ok(newStats.ovr >= oldStats.ovr, 'Auto-fill Best XI should improve or maintain OVR');

  // 11-round FUT Draft & Auto-pick remaining
  let draft = createNewDraftSession('4-2-3-1', 12345);
  assert.equal(draft.currentChoices.length, 4);
  draft = pickDraftCard(draft, draft.currentChoices[0].id, 12345);
  assert.equal(draft.round, 1);
  assert.equal(draft.pickedCardIds.length, 1);
  draft = autoPickRemainingDraft(draft, 12345);
  assert.equal(draft.round, 11);
  assert.equal(draft.pickedCardIds.length, 11);

  // Division Rivals win rewards & 2-win streak promotion
  const r1 = applyUtMatchResult(utState, 'rivals', 3, 1);
  assert.ok(r1.coinsEarned > 0);
  assert.equal(r1.pointsEarned, 350);
  assert.equal(r1.nextState.rivals.winStreak, 1);
  const r2 = applyUtMatchResult(r1.nextState, 'rivals', 2, 0);
  assert.equal(r2.promotedToDivision, 9, '2 consecutive Rivals wins should promote from Div 10 to Div 9');
  assert.equal(r2.nextState.rivals.division, 9);
  assert.ok(r2.packEarned !== null);
});



