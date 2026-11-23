import { useEffect, useRef } from 'react';
import { COMPETITIONS } from '../game/data';
import type { CompetitionId, MatchHudSnapshot, PenaltyDirection, Team, TouchInputState } from '../game/types';
import { ClubBadge } from './ClubBadge';

interface ScoreboardHUDProps {
  hud: MatchHudSnapshot;
  muted: boolean;
  showTouchControls: boolean;
  onToggleMute: () => void;
  onToggleTouchControls: () => void;
  onPause: () => void;
  onOpenSubs: () => void;
  onSkipReplay: () => void;
  onSkipCutscene: () => void;
  onSubmitPenaltyDirection: (dir: PenaltyDirection) => void;
  onTouchInputChange: (next: TouchInputState) => void;
}

function ScorebugGoalAnimation({
  competitionId,
  scoringTeam,
  scorerName,
}: {
  competitionId: CompetitionId;
  scoringTeam: Team;
  scorerName: string;
}) {
  const goalTextRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();
    const clubColors: [string, string, string] = [
      scoringTeam.primaryColor,
      scoringTeam.secondaryColor,
      scoringTeam.trimColor || '#ffffff',
    ];
    const isBrightHex = (hex: string) => {
      const c = hex.replace('#', '');
      if (c.length < 6) return true;
      const r = parseInt(c.slice(0, 2), 16);
      const g = parseInt(c.slice(2, 4), 16);
      const b = parseInt(c.slice(4, 6), 16);
      return r * 0.299 + g * 0.587 + b * 0.114 >= 60;
    };
    const textFlickerColors = clubColors.filter(isBrightHex);
    const brightTextPalette =
      textFlickerColors.length >= 2 ? [...textFlickerColors, '#ffffff'] : ['#facc15', '#ffffff'];

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      // Flicker background color rapidly across scoring club's colors (~28Hz)
      const bgIdx = Math.floor(elapsed * 28) % clubColors.length;
      const borderIdx = (bgIdx + 1) % clubColors.length;
      const txtIdx = Math.floor(elapsed * 18) % brightTextPalette.length;
      if (boxRef.current) {
        boxRef.current.style.backgroundColor = clubColors[bgIdx];
        boxRef.current.style.borderColor = clubColors[borderIdx];
      }
      if (goalTextRef.current) {
        goalTextRef.current.style.color = brightTextPalette[txtIdx];
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [scoringTeam.primaryColor, scoringTeam.secondaryColor, scoringTeam.trimColor]);

  return (
    <div
      ref={boxRef}
      data-testid="scorebug-goal-animation"
      data-competition={competitionId}
      className="relative border-4 border-yellow-300 shadow-[0_6px_0_#000] overflow-hidden w-80 sm:w-[460px] h-[94px] flex items-center justify-center px-3 sm:px-4"
      style={{ backgroundColor: scoringTeam.primaryColor }}
    >
      <div
        ref={goalTextRef}
        className="relative z-10 font-pixel text-sm sm:text-xl text-yellow-300 tracking-wider leading-none whitespace-nowrap animate-[goal-fly-down_2.0s_linear_forwards]"
        style={{
          textShadow:
            '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000',
        }}
      >
        GOAAAAAAAAAAAAAAAL!
      </div>
    </div>
  );
}

export function ScoreboardHUD({
  hud,
  muted,
  showTouchControls,
  onToggleMute,
  onToggleTouchControls,
  onPause,
  onOpenSubs,
  onSkipReplay,
  onSkipCutscene,
  onSubmitPenaltyDirection,
  onTouchInputChange,
}: ScoreboardHUDProps) {
  const touchStateRef = useRef<TouchInputState>({
    moveX: 0,
    moveY: 0,
    sprint: false,
    passJustPressed: false,
    loftPassJustPressed: false,
    shootHeld: false,
    shootJustPressed: false,
    shootJustReleased: false,
  });

  const padCenterRef = useRef<{ x: number; y: number; maxR: number } | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);

  const emitTouch = (patch: Partial<TouchInputState>) => {
    touchStateRef.current = { ...touchStateRef.current, ...patch };
    onTouchInputChange(touchStateRef.current);
  };

  const setKnobVisualOffset = (ox: number, oy: number) => {
    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0)`;
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    const center = padCenterRef.current;
    if (!center) return;
    const dx = clientX - center.x;
    const dy = clientY - center.y;
    const { maxR } = center;
    const dist = Math.hypot(dx, dy);
    if (dist < 1.5) {
      setKnobVisualOffset(0, 0);
      emitTouch({ moveX: 0, moveY: 0 });
      return;
    }
    const clamped = Math.min(1, dist / maxR);
    const nx = (dx / dist) * clamped;
    const ny = (dy / dist) * clamped;
    setKnobVisualOffset(nx * maxR, ny * maxR);
    emitTouch({
      moveX: nx,
      moveY: ny,
    });
  };

  const handleJoystickStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointer events in tests may not have an active browser pointer
    }
    activePointerIdRef.current = e.pointerId;
    const rect = e.currentTarget.getBoundingClientRect();
    padCenterRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      maxR: Math.max(52, rect.width * 0.36),
    };
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoystickMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
    if (!padCenterRef.current) return;
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoystickEnd = (e?: React.PointerEvent<HTMLDivElement>) => {
    if (e && activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
    activePointerIdRef.current = null;
    padCenterRef.current = null;
    setKnobVisualOffset(0, 0);
    emitTouch({ moveX: 0, moveY: 0 });
  };

  const minutes = Math.floor(hud.clockSeconds / 60);
  const comp = COMPETITIONS.find((c) => c.id === hud.competitionId) ?? COMPETITIONS[0];
  const scoringTeamObj =
    hud.goalScoringTeam === 'home'
      ? hud.homeTeam
      : hud.goalScoringTeam === 'away'
      ? hud.awayTeam
      : hud.homeTeam;

  const bannerColors: Record<MatchHudSnapshot['bannerTone'], string> = {
    neutral: 'bg-slate-900 border-slate-300 text-white',
    goal: 'bg-emerald-600 border-yellow-300 text-yellow-200',
    yellow: 'bg-yellow-400 border-black text-black',
    red: 'bg-red-600 border-yellow-300 text-white',
    setpiece: 'bg-indigo-900 border-yellow-400 text-yellow-300',
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-1.5 sm:p-3">
      {/* Top Broadcast 8-Bit Scoreboard + Live Ticker + Goal Scorebug / Replay Skip */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        <div className="w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 sm:gap-2">
          {/* Competition / Rivalry / Road to Round 38 / Finale 38 Tag */}
          <div className="hidden lg:flex items-center gap-2 bg-[#070b1c]/95 border-2 border-slate-600 px-2.5 py-1.5 shrink-0">
            <span
              className="w-2.5 h-2.5 inline-block border border-white/70"
              style={{
                background: hud.isUltimateTeam
                  ? '#facc15'
                  : hud.isFinale38 || hud.isRoadTo38
                  ? 'linear-gradient(135deg,#ef4444,#facc15,#22c55e,#38bdf8,#a855f7)'
                  : hud.isRivalry
                  ? '#ffff00'
                  : comp.accentColor,
              }}
            />
            <span
              className="font-pixel text-[9px] whitespace-nowrap"
              style={{
                color: hud.isUltimateTeam
                  ? '#fde047'
                  : hud.isFinale38 || hud.isRoadTo38
                  ? '#fef08a'
                  : hud.isRivalry
                  ? '#ffff00'
                  : '#e2e8f0',
              }}
            >
              {hud.isUltimateTeam
                ? hud.utSubMode === 'rivals'
                  ? `ULTIMATE TEAM · ${hud.utDivision === 0 ? 'ELITE' : `DIV ${hud.utDivision ?? 10}`}`
                  : hud.utSubMode === 'draft'
                  ? 'ULTIMATE TEAM · FUT DRAFT'
                  : 'ULTIMATE TEAM · 11v11'
                : hud.isFinale38
                ? 'THE GRAND FINALE 38! · R38/38'
                : hud.isRoadTo38
                ? `ROAD TO THE ROUND 38! · R${hud.leagueRound}/38`
                : hud.isRivalry
                ? `${hud.rivalryTitle ?? 'THE CLÁSICO'}`
                : hud.isSingleplayerTour
                ? 'SP TOURNAMENT'
                : hud.cupRoundLabel && hud.competitionId !== 'league'
                ? `${comp.title} · ${hud.cupRoundLabel}`
                : hud.leagueRound && hud.competitionId === 'league'
                ? `${comp.title} · R${hud.leagueRound}/38`
                : `${comp.title} ${comp.season}`}
            </span>
          </div>

          {/* Center Top Scoreboard with Club Logos */}
          <div
            aria-label="Match scoreboard"
            className={`mx-auto flex items-center bg-[#060918]/95 border-2 shadow-[0_3px_0_#000] max-w-full ${
              hud.isRivalry ? 'border-[#ffff00]' : 'border-yellow-400'
            }`}
          >
            {/* Home Club */}
            <div className="flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 border-r-2 border-slate-700">
              <ClubBadge team={hud.homeTeam} size={18} />
              <span className="font-pixel text-[9px] sm:text-xs text-white whitespace-nowrap">
                {hud.homeTeam.shortCode}
              </span>
              {hud.stats.homeYellows > 0 && (
                <span
                  title={`Home Yellow Cards: ${hud.stats.homeYellows}`}
                  className="w-2 h-3 bg-yellow-400 border border-black inline-block"
                />
              )}
              {hud.stats.homeReds > 0 && (
                <span
                  title={`Home Red Cards: ${hud.stats.homeReds}`}
                  className="w-2 h-3 bg-red-600 border border-black inline-block"
                />
              )}
            </div>

            {/* Score */}
            <div
              data-testid="scoreboard-score"
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-black font-pixel text-[10px] sm:text-sm text-yellow-300 tabular-nums whitespace-nowrap"
            >
              {hud.homeScore}-{hud.awayScore}
            </div>

            {/* Away Club */}
            <div className="flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 border-l-2 border-slate-700">
              {hud.stats.awayYellows > 0 && (
                <span
                  title={`Away Yellow Cards: ${hud.stats.awayYellows}`}
                  className="w-2 h-3 bg-yellow-400 border border-black inline-block"
                />
              )}
              {hud.stats.awayReds > 0 && (
                <span
                  title={`Away Red Cards: ${hud.stats.awayReds}`}
                  className="w-2 h-3 bg-red-600 border border-black inline-block"
                />
              )}
              <span className="font-pixel text-[9px] sm:text-xs text-white whitespace-nowrap">
                {hud.awayTeam.shortCode}
              </span>
              <ClubBadge team={hud.awayTeam} size={18} />
            </div>

            {/* Match Clock */}
            <div className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-emerald-600 border-l-2 border-black font-pixel text-[9px] sm:text-xs text-black tabular-nums whitespace-nowrap">
              {hud.cutscenePhase === 'PRE_KICKOFF'
                ? 'OPEN'
                : hud.cutscenePhase === 'HALFTIME'
                ? 'HT'
                : hud.cutscenePhase === 'GOAL_CELEBRATION_3D'
                ? 'GOAL 3D'
                : hud.cutscenePhase === 'FULLTIME'
                ? 'FT'
                : hud.cutscenePhase === 'TROPHY_CELEBRATION'
                ? 'WIN'
                : hud.replayActive
                ? 'REPLAY'
                : hud.half === 3
                ? 'PENS'
                : hud.half === 4
                ? `ET1 ${minutes}'`
                : hud.half === 5
                ? `ET2 ${minutes}'`
                : `${minutes}' H${hud.half}`}
            </div>
          </div>

          {/* Top-Right Compact Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0 ml-auto sm:ml-0">
            <button
              type="button"
              tabIndex={-1}
              data-testid="hud-subs-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenSubs();
              }}
              aria-label="Open line-up and substitutions"
              title="Line-Up, Tactics & Substitutions"
              className="pixel-btn bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 sm:px-2.5 sm:py-1.5 font-pixel text-[8px] sm:text-[9px]"
            >
              SUBS
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleTouchControls();
              }}
              aria-label="Toggle mobile touch controls"
              title="Toggle Mobile Pad"
              className={`pixel-btn px-2 py-1 sm:px-2.5 sm:py-1.5 font-pixel text-[8px] sm:text-[9px] ${
                showTouchControls ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-white'
              }`}
            >
              PAD
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              className="pixel-btn bg-slate-800 text-white px-2 py-1 sm:px-2.5 sm:py-1.5 font-pixel text-[8px] sm:text-[9px]"
            >
              {muted ? 'MUTE' : 'SFX'}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              aria-label="Pause match"
              className="pixel-btn bg-amber-400 text-black px-2 py-1 sm:px-2.5 sm:py-1.5 font-pixel text-[8px] sm:text-[9px]"
            >
              PAUSE
            </button>
          </div>
        </div>

        {/* Real-Time Score Tracking Strip + Match Date/Time + Crowd Intensity Readout */}
        <div className="hidden sm:flex items-center gap-3 bg-[#050814]/90 border border-slate-700 px-3 py-0.5 text-xs font-pixel-body tabular-nums">
          <span className="text-sky-300 font-pixel text-[8px]">
            {hud.matchDateLabel} · {hud.matchTimeLabel}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-yellow-300 font-pixel text-[8px]">{hud.chantText}</span>
          {hud.liveTicker.length > 0 && <span className="text-slate-600">|</span>}
          {hud.liveTicker.map((fix, i) => (
            <span key={i} className="text-slate-300">
              {fix.homeCode} <strong className="text-yellow-300">{fix.homeScore}-{fix.awayScore}</strong> {fix.awayCode}{' '}
              <span className="text-slate-500">{fix.minute}'</span>
            </span>
          ))}
        </div>

        {/* Competition-Specific Rotating Circular Sunburnt Tunnel Goal Scorebug */}
        {hud.goalAnimationActive && (
          <ScorebugGoalAnimation
            competitionId={hud.competitionId}
            scoringTeam={scoringTeamObj}
            scorerName={hud.goalScorerName}
          />
        )}

        {/* Instant Replay Skip Controls */}
        {hud.replayActive && (
          <div className="pointer-events-auto flex items-center gap-3 bg-[#080d20]/95 border-2 border-red-500 px-3 py-1.5 shadow-[0_4px_0_#000]">
            <span className="w-2.5 h-2.5 bg-red-500 inline-block animate-pulse" />
            <span className="font-pixel text-[9px] sm:text-[10px] text-white">
              INSTANT REPLAY ({Math.round(hud.replayProgress * 100)}%)
            </span>
            <button
              type="button"
              onClick={onSkipReplay}
              data-testid="skip-replay-btn"
              className="pixel-btn bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[9px] px-2.5 py-1"
            >
              SKIP REPLAY
            </button>
          </div>
        )}

        {/* Pre-Kickoff / Halftime / 3D Goal Celebration / Fulltime / Trophy Celebration Broadcast Cutscene Card */}
        {hud.cutscenePhase && (
          <div
            data-testid="match-cutscene-overlay"
            data-cutscene={hud.cutscenePhase}
            className={`pointer-events-auto fixed left-1/2 -translate-x-1/2 bottom-[13.5%] z-30 border-4 shadow-[0_6px_0_#000] px-3.5 py-2 sm:px-5 sm:py-2.5 max-w-xl w-[92%] ${
              hud.cutscenePhase === 'TROPHY_CELEBRATION'
                ? 'bg-[#090418]/95 border-yellow-300'
                : hud.cutscenePhase === 'GOAL_CELEBRATION_3D'
                ? 'bg-[#08120c]/95 border-emerald-400'
                : 'bg-[#060918]/95 border-yellow-400'
            }`}
          >
            {hud.cutscenePhase === 'PRE_KICKOFF' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ClubBadge team={hud.homeTeam} size={30} />
                  <div className="min-w-0">
                    <div className="font-pixel text-[9px] sm:text-[10px] text-yellow-300">
                      {hud.isFinale38
                        ? 'THE GRAND FINALE 38! · 20S TUNNEL INTRO'
                        : hud.isRoadTo38
                        ? `ROAD TO THE ROUND 38 · R${hud.leagueRound}/38`
                        : hud.isRivalry
                        ? hud.rivalryTitle ?? 'RIVALRY CLASH'
                        : `3D TUNNEL WALKOUT · ${hud.cutsceneRemainingSec}S`}
                    </div>
                    <div className="font-pixel-body text-lg sm:text-xl text-white leading-tight truncate" dir="auto">
                      {hud.homeTeam.name} VS {hud.awayTeam.name}
                    </div>
                    <div className="font-pixel-body text-sm text-sky-300 truncate">
                      {hud.stadiumName} · {hud.matchDateLabel} {hud.matchTimeLabel}
                    </div>
                  </div>
                  <ClubBadge team={hud.awayTeam} size={30} />
                </div>
                <button
                  type="button"
                  data-testid="skip-cutscene-btn"
                  onClick={onSkipCutscene}
                  className="pixel-btn bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[9px] px-3 py-1.5 shrink-0"
                >
                  KICK OFF ({hud.cutsceneRemainingSec}S) [SPACE]
                </button>
              </div>
            )}

            {hud.cutscenePhase === 'HALFTIME' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-pixel text-[10px] sm:text-xs text-yellow-300">
                    HALF TIME 3D TUNNEL · {hud.cutsceneRemainingSec}S
                  </div>
                  <div className="font-pixel-body text-xl text-white tabular-nums mt-0.5">
                    {hud.homeTeam.shortCode} {hud.homeScore} - {hud.awayScore} {hud.awayTeam.shortCode} · SHOTS {hud.stats.homeShots}-{hud.stats.awayShots} · PASSES {hud.stats.homePasses}-{hud.stats.awayPasses}
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="skip-cutscene-btn"
                  onClick={onSkipCutscene}
                  className="pixel-btn bg-emerald-400 hover:bg-emerald-300 text-black font-pixel text-[9px] px-3 py-1.5 shrink-0"
                >
                  2ND HALF [SPACE]
                </button>
              </div>
            )}

            {hud.cutscenePhase === 'GOAL_CELEBRATION_3D' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ClubBadge team={scoringTeamObj} size={32} />
                  <div className="min-w-0">
                    <div className="font-pixel text-[10px] sm:text-xs text-emerald-300">
                      15S 3D GOAL CELEBRATION · {hud.cutsceneRemainingSec}S
                    </div>
                    <div className="font-pixel-body text-lg sm:text-xl text-white leading-tight truncate" dir="auto">
                      {scoringTeamObj.name} · {hud.goalScorerName} SCORES!
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="skip-cutscene-btn"
                  onClick={onSkipCutscene}
                  className="pixel-btn bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[9px] px-3 py-1.5 shrink-0"
                >
                  REPLAY / KICKOFF [SPACE]
                </button>
              </div>
            )}

            {hud.cutscenePhase === 'FULLTIME' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-pixel text-[10px] sm:text-xs text-emerald-300">
                    FULL TIME 3D TUNNEL · {hud.cutsceneRemainingSec}S
                  </div>
                  <div className="font-pixel-body text-xl text-white tabular-nums mt-0.5" dir="auto">
                    FINAL SCORE: {hud.homeTeam.name} {hud.homeScore} - {hud.awayScore} {hud.awayTeam.name}
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="skip-cutscene-btn"
                  onClick={onSkipCutscene}
                  className="pixel-btn bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[9px] px-3 py-1.5 shrink-0"
                >
                  CONTINUE [SPACE]
                </button>
              </div>
            )}

            {hud.cutscenePhase === 'TROPHY_CELEBRATION' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ClubBadge team={hud.championTeam ?? hud.homeTeam} size={34} />
                  <div className="min-w-0">
                    <div className="font-pixel text-[10px] sm:text-xs text-yellow-300">
                      CHAMPIONS · {hud.trophyTitle} · {hud.cutsceneRemainingSec}S
                    </div>
                    <div className="font-pixel-body text-lg sm:text-xl text-white leading-tight truncate" dir="auto">
                      CONGRATULATION {(hud.championTeam ?? hud.homeTeam).name}! TROPHY LIFT
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="skip-cutscene-btn"
                  onClick={onSkipCutscene}
                  className="pixel-btn bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[9px] px-3 py-1.5 shrink-0"
                >
                  FINISH [SPACE]
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live Rule / Set-Piece / Card Banner */}
        {!hud.goalAnimationActive && !hud.cutscenePhase && hud.bannerTitle && (
          <div
            data-testid="match-rule-banner"
            className={`px-3 py-1.5 border-4 shadow-[0_4px_0_#000] text-center ${bannerColors[hud.bannerTone]}`}
          >
            <div className="font-pixel text-[10px] sm:text-sm">{hud.bannerTitle}</div>
            {hud.bannerSubtitle && (
              <div className="font-pixel-body text-sm sm:text-base leading-tight">
                {hud.bannerSubtitle}
              </div>
            )}
          </div>
        )}

        {hud.half === 3 && (
          <div className="flex flex-col items-center gap-2">
            <div className="bg-black/90 border-2 border-yellow-400 px-3 py-1.5 flex items-center gap-4 font-pixel text-[9px]">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300">{hud.homeTeam.shortCode}</span>
                {Array.from({ length: Math.max(5, hud.shootoutHome.length) }, (_, i) => {
                  const r = hud.shootoutHome[i];
                  return (
                    <span
                      key={i}
                      className={`w-2.5 h-2.5 border border-white inline-block ${
                        r === 'G' ? 'bg-emerald-400' : r === 'M' ? 'bg-rose-500' : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300">{hud.awayTeam.shortCode}</span>
                {Array.from({ length: Math.max(5, hud.shootoutAway.length) }, (_, i) => {
                  const r = hud.shootoutAway[i];
                  return (
                    <span
                      key={i}
                      className={`w-2.5 h-2.5 border border-white inline-block ${
                        r === 'G' ? 'bg-emerald-400' : r === 'M' ? 'bg-rose-500' : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {hud.shootoutPrompt?.awaitingInput && (
              <div
                data-testid="penalty-shootout-controls"
                className="pointer-events-auto bg-[#060918]/95 border-4 border-yellow-400 px-4 py-2.5 shadow-[0_6px_0_#000] flex flex-col items-center gap-2"
              >
                <div className="font-pixel text-[10px] sm:text-xs text-yellow-300">
                  {hud.shootoutPrompt.phase === 'kick'
                    ? `YOUR KICK (ROUND ${hud.shootoutPrompt.round}) · AIM CORNER!`
                    : `GK DIVE SAVE (ROUND ${hud.shootoutPrompt.round}) · PICK DIRECTION!`}
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    data-testid="penalty-dir-left"
                    onClick={() => onSubmitPenaltyDirection('left')}
                    className="pixel-btn bg-sky-400 hover:bg-sky-300 text-black font-pixel text-[10px] sm:text-xs px-3 sm:px-4 py-2"
                  >
                    ⬅ LEFT [A]
                  </button>
                  <button
                    type="button"
                    data-testid="penalty-dir-middle"
                    onClick={() => onSubmitPenaltyDirection('middle')}
                    className="pixel-btn bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[10px] sm:text-xs px-3 sm:px-4 py-2"
                  >
                    ⬆ MIDDLE [W]
                  </button>
                  <button
                    type="button"
                    data-testid="penalty-dir-right"
                    onClick={() => onSubmitPenaltyDirection('right')}
                    className="pixel-btn bg-emerald-400 hover:bg-emerald-300 text-black font-pixel text-[10px] sm:text-xs px-3 sm:px-4 py-2"
                  >
                    ➡ RIGHT [D]
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Mobile Touch Controls */}
      {showTouchControls ? (
        <div
          data-testid="mobile-touch-controls"
          className="flex items-end justify-between gap-1.5 sm:gap-4 pb-5 px-1.5 sm:px-5"
        >
          <div
            role="application"
            aria-label="Dribble joystick"
            data-testid="dribble-joystick"
            onPointerDown={handleJoystickStart}
            onPointerMove={handleJoystickMove}
            onPointerUp={handleJoystickEnd}
            onPointerCancel={handleJoystickEnd}
            onLostPointerCapture={handleJoystickEnd}
            style={{ touchAction: 'none' }}
            className="pointer-events-auto select-none shrink-0 relative w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-black/70 border-4 border-yellow-400/95 flex items-center justify-center shadow-[0_5px_0_#000]"
          >
            <div className="absolute inset-3 rounded-full border-2 border-dashed border-yellow-300/35 pointer-events-none" />
            <div
              ref={knobRef}
              data-testid="dribble-joystick-knob"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-400 border-4 border-black shadow-[0_3px_0_rgba(0,0,0,0.8)] pointer-events-none will-change-transform flex items-center justify-center"
            >
              <div className="w-5 h-5 rounded-full bg-yellow-200 border border-black/50" />
            </div>
            <span className="absolute -bottom-5 font-pixel text-[8px] text-yellow-300 tracking-wider">
              DRIBBLE
            </span>
          </div>

          <div className="pointer-events-auto shrink-0 flex items-end gap-1 sm:gap-2" style={{ touchAction: 'none' }}>
            <button
              type="button"
              onPointerDown={() => emitTouch({ sprint: true })}
              onPointerUp={() => emitTouch({ sprint: false })}
              onPointerCancel={() => emitTouch({ sprint: false })}
              className="pixel-btn shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-amber-400 text-black font-pixel text-[7px] sm:text-[8px] flex items-center justify-center"
            >
              RUN
            </button>
            <button
              type="button"
              onPointerDown={() => emitTouch({ loftPassJustPressed: true })}
              onPointerUp={() => emitTouch({ loftPassJustPressed: false })}
              onPointerCancel={() => emitTouch({ loftPassJustPressed: false })}
              className="pixel-btn shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-indigo-400 text-black font-pixel text-[7px] sm:text-[8px] flex items-center justify-center text-center leading-tight"
            >
              LOFT
            </button>
            <button
              type="button"
              onPointerDown={() => emitTouch({ passJustPressed: true })}
              onPointerUp={() => emitTouch({ passJustPressed: false })}
              onPointerCancel={() => emitTouch({ passJustPressed: false })}
              className="pixel-btn shrink-0 w-11 h-11 sm:w-16 sm:h-16 rounded-full bg-sky-400 text-black font-pixel text-[8px] sm:text-[9px] flex items-center justify-center text-center leading-tight"
            >
              {hud.playerHasBall ? 'PASS' : 'SWAP'}
            </button>
            <button
              type="button"
              onPointerDown={() => emitTouch({ shootHeld: true })}
              onPointerUp={() => emitTouch({ shootHeld: false })}
              onPointerCancel={() => emitTouch({ shootHeld: false })}
              className="pixel-btn shrink-0 w-13 h-13 sm:w-18 sm:h-18 rounded-full bg-rose-500 text-white font-pixel text-[7px] sm:text-[9px] flex items-center justify-center text-center leading-tight"
            >
              {hud.playerHasBall ? 'SHOOT' : 'TACKLE'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
