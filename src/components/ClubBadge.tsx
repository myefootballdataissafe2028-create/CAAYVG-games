import { useId } from 'react';
import type { Team } from '../game/types';

interface ClubBadgeProps {
  team: Team;
  size?: number;
  className?: string;
}

export function ClubBadge({ team, size = 24, className = '' }: ClubBadgeProps) {
  const uid = useId().replace(/:/g, '');
  const { primaryColor: p, secondaryColor: s, trimColor: t, crest } = team;
  const trim = t || '#facc15';

  const rimGradId = `cb-rim-${uid}`;
  const bodyGradId = `cb-body-${uid}`;
  const glossGradId = `cb-gloss-${uid}`;
  const metalGradId = `cb-metal-${uid}`;
  const innerClipId = `cb-clip-${uid}`;

  // Classic realistic European / Pro Club curved heater-shield contour
  const outerShield = 'M32 4 L55 11.5 V30.5 C55 45.5 43.5 55.8 32 60.5 C20.5 55.8 9 45.5 9 30.5 V11.5 Z';
  const innerShield = 'M32 7.5 L51.5 13.8 V30.2 C51.5 43.2 41.5 52.3 32 56.5 C22.5 52.3 12.5 43.2 12.5 30.2 V13.8 Z';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={`shrink-0 drop-shadow-[0_2px_3px_rgba(0,0,0,0.75)] ${className}`}
    >
      <defs>
        <linearGradient id={rimGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="28%" stopColor={trim} />
          <stop offset="72%" stopColor={trim} stopOpacity="0.88" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        <linearGradient id={bodyGradId} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor={p} />
          <stop offset="58%" stopColor={p} />
          <stop offset="100%" stopColor={s} />
        </linearGradient>

        <linearGradient id={metalGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="45%" stopColor={trim} />
          <stop offset="100%" stopColor="#78350f" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id={glossGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.46" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <clipPath id={innerClipId}>
          <path d={innerShield} />
        </clipPath>
      </defs>

      {/* Outer obsidian bezel + metallic bevel rim */}
      <path d={outerShield} fill={`url(#${rimGradId})`} stroke="#020617" strokeWidth="2.4" strokeLinejoin="round" />

      {/* Inner clipped shield body + realistic 3D motif */}
      <g clipPath={`url(#${innerClipId})`}>
        <rect x="8" y="4" width="48" height="56" fill={`url(#${bodyGradId})`} />

        {/* Subtle vertical fabric weave / heraldic diagonal shading */}
        <polygon points="8,4 38,4 8,44" fill="#ffffff" fillOpacity="0.08" />
        <polygon points="56,16 56,60 22,60" fill="#000000" fillOpacity="0.18" />

        {crest === 'diamond' && (
          <>
            <polygon points="32,12 49,30 32,48 15,30" fill={s} stroke={trim} strokeWidth="2" />
            <polygon points="32,18 43,30 32,42 21,30" fill={p} />
            <polygon points="32,23 38,30 32,37 26,30" fill={`url(#${metalGradId})`} />
          </>
        )}

        {crest === 'star' && (
          <>
            <circle cx="32" cy="31" r="16" fill={s} fillOpacity="0.9" stroke={trim} strokeWidth="1.8" />
            <polygon
              points="32,16 36.2,25.2 46.2,26.3 38.8,33.1 40.8,43 32,38 23.2,43 25.2,33.1 17.8,26.3 27.8,25.2"
              fill={`url(#${metalGradId})`}
              stroke="#020617"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </>
        )}

        {crest === 'crown' && (
          <>
            <path d="M12 37 H52 V56 H12 Z" fill={s} fillOpacity="0.85" />
            <path
              d="M17 38 L19 20 L26.5 29 L32 16 L37.5 29 L45 20 L47 38 Z"
              fill={`url(#${metalGradId})`}
              stroke="#020617"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <rect x="17" y="38.5" width="30" height="4.5" rx="1.5" fill={trim} stroke="#020617" strokeWidth="1.2" />
            <circle cx="32" cy="15.5" r="2.2" fill="#ffffff" />
          </>
        )}

        {crest === 'bolt' && (
          <>
            <polygon points="8,4 56,4 56,28 8,40" fill={s} fillOpacity="0.6" />
            <polygon
              points="36,13 21,33 30,33 26,50 43,29 33,29"
              fill={`url(#${metalGradId})`}
              stroke="#020617"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </>
        )}

        {crest === 'shield' && (
          <>
            <rect x="32" y="6" width="24" height="52" fill={s} />
            <path d="M12 29 H52" stroke={trim} strokeWidth="3.5" />
            <path d="M32 8 V56" stroke={trim} strokeWidth="3.5" />
            <circle cx="32" cy="29" r="7.5" fill={`url(#${metalGradId})`} stroke="#020617" strokeWidth="1.4" />
          </>
        )}

        {crest === 'stripes' && (
          <>
            <rect x="17" y="6" width="6.5" height="52" fill={s} />
            <rect x="28.75" y="6" width="6.5" height="52" fill={trim} />
            <rect x="40.5" y="6" width="6.5" height="52" fill={s} />
            <circle cx="32" cy="30" r="8" fill={p} stroke={trim} strokeWidth="2" />
            <polygon points="32,24 35,30 32,36 29,30" fill="#ffffff" />
          </>
        )}

        {crest === 'flame' && (
          <>
            <rect x="8" y="6" width="48" height="52" fill={s} />
            <path
              d="M32 13 C38 22 45 27 42 38 C40 44 36 48 32 49 C26 48 21 43 22 35 C23 28 28 24 27 18 C29 20 31 17 32 13 Z"
              fill={p}
              stroke="#020617"
              strokeWidth="1.3"
            />
            <path
              d="M32 24 C36 30 38 35 35 41 C34 44 31 45 29 42 C27 38 28 32 32 24 Z"
              fill={`url(#${metalGradId})`}
            />
          </>
        )}

        {crest === 'crystal' && (
          <>
            <rect x="8" y="6" width="48" height="52" fill={s} />
            <polygon
              points="32,12 44,24 39,47 25,47 20,24"
              fill={p}
              stroke={trim}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <polygon points="32,12 44,24 32,29 20,24" fill="#ffffff" fillOpacity="0.35" />
            <polygon points="32,12 32,47 25,47 20,24" fill="#000000" fillOpacity="0.16" />
          </>
        )}

        {crest === 'wings' && (
          <>
            <path
              d="M14 23 C19 23 23 25 27 29 L26 39 C20 38 15 35 14 29 Z"
              fill={`url(#${metalGradId})`}
              stroke="#020617"
              strokeWidth="1.2"
            />
            <path
              d="M50 23 C45 23 41 25 37 29 L38 39 C44 38 49 35 50 29 Z"
              fill={`url(#${metalGradId})`}
              stroke="#020617"
              strokeWidth="1.2"
            />
            <circle cx="32" cy="31" r="8.5" fill={s} stroke="#ffffff" strokeWidth="1.8" />
            <polygon points="32,25 35.5,31 32,37 28.5,31" fill={trim} />
          </>
        )}

        {crest === 'target' && (
          <>
            <circle cx="32" cy="31" r="16" fill={s} stroke={trim} strokeWidth="2" />
            <circle cx="32" cy="31" r="10.5" fill={p} stroke="#ffffff" strokeWidth="1.6" />
            <circle cx="32" cy="31" r="5" fill={`url(#${metalGradId})`} />
          </>
        )}

        {crest === 'crescent' && (
          <>
            <path d="M36 16 A14 14 0 1 0 43 41 A11 11 0 1 1 36 16 Z" fill={`url(#${metalGradId})`} stroke="#020617" strokeWidth="1.2" />
            <polygon points="41,25 42.6,28.8 46.6,29.2 43.5,31.8 44.5,35.8 41,33.6 37.5,35.8 38.5,31.8 35.4,29.2 39.4,28.8" fill={s} stroke={trim} strokeWidth="1" />
          </>
        )}

        {crest === 'orbit' && (
          <>
            <rect x="8" y="6" width="48" height="52" fill={s} />
            <circle cx="32" cy="31" r="10.5" fill={p} stroke={trim} strokeWidth="1.8" />
            <ellipse
              cx="32"
              cy="31"
              rx="18.5"
              ry="6"
              transform="rotate(-24 32 31)"
              fill="none"
              stroke={`url(#${metalGradId})`}
              strokeWidth="2.8"
            />
            <circle cx="46" cy="24" r="2.6" fill="#ffffff" />
          </>
        )}

        {/* Realistic top glass sheen reflection */}
        <ellipse cx="32" cy="14" rx="24" ry="13" fill={`url(#${glossGradId})`} />
      </g>

      {/* Crisp inner recessed bevel stroke */}
      <path d={innerShield} fill="none" stroke="#020617" strokeOpacity="0.55" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
