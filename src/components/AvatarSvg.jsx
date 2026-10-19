import React from "react";

// Procedurally renders an original vector-style "chibi" character from an avatar config.
// No photos, stock, or emoji — pure SVG shapes built from the avatar's visual DNA.
function AvatarSvgImpl({ avatar, size = 96, className = "", glow = false }) {
  if (!avatar) return null;
  const gradId = `g-${avatar.id}`;
  const shineId = `s-${avatar.id}`;
  const body = avatar.body;
  const accent = avatar.accent;
  const dark = "#0b0b1a";

  const shapeBody = (() => {
    switch (avatar.shape) {
      case "round":
        return <circle cx="50" cy="52" r="34" fill={`url(#${gradId})`} stroke={dark} strokeWidth="3" />;
      case "square":
        return <rect x="18" y="20" width="64" height="64" rx="18" fill={`url(#${gradId})`} stroke={dark} strokeWidth="3" />;
      case "diamond":
        return <polygon points="50,16 82,52 50,88 18,52" fill={`url(#${gradId})`} stroke={dark} strokeWidth="3" />;
      case "star":
        return (
          <polygon
            points="50,14 61,40 88,42 67,60 74,86 50,72 26,86 33,60 12,42 39,40"
            fill={`url(#${gradId})`}
            stroke={dark}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        );
      case "ghost":
        return (
          <path
            d="M22 54 a28 28 0 0 1 56 0 v26 l-7 -5 -7 5 -7 -5 -7 5 -7 -5 -7 5 -7 -5 z"
            fill={`url(#${gradId})`}
            stroke={dark}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        );
      default:
        return (
          <path
            d="M50 18c14 0 26 10 26 24 0 8-4 14-4 20 0 6 6 10 6 18H22c0-8 6-12 6-18 0-10-12-16-12-24 0-14 12-20 34-20z"
            fill={`url(#${gradId})`}
            stroke={dark}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        );
    }
  })();

  const eyes = (() => {
    const lx = 38, rx = 62, ey = 50;
    switch (avatar.eye) {
      case "happy":
        return (
          <>
            <path d={`M${lx - 6} ${ey} q6 -8 12 0`} stroke={dark} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d={`M${rx - 6} ${ey} q6 -8 12 0`} stroke={dark} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      case "cool":
        return (
          <>
            <rect x={lx - 9} y={ey - 5} width="18" height="10" rx="3" fill={dark} />
            <rect x={rx - 9} y={ey - 5} width="18" height="10" rx="3" fill={dark} />
            <line x1={lx - 9} y1={ey} x2={rx + 9} y2={ey} stroke={dark} strokeWidth="2" />
          </>
        );
      case "wink":
        return (
          <>
            <path d={`M${lx - 6} ${ey} q6 -8 12 0`} stroke={dark} strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx={rx} cy={ey} r="4.5" fill={dark} />
            <circle cx={rx + 1.5} cy={ey - 1.5} r="1.5" fill="#fff" />
          </>
        );
      case "star":
        return (
          <>
            {[lx, rx].map((x, i) => (
              <polygon
                key={i}
                points={`${x},${ey - 6} ${x + 2},${ey - 1} ${x + 7},${ey} ${x + 2},${ey + 1} ${x},${ey + 6} ${x - 2},${ey + 1} ${x - 7},${ey} ${x - 2},${ey - 1}`}
                fill="#fff"
                stroke={dark}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            ))}
          </>
        );
      default:
        return (
          <>
            <circle cx={lx} cy={ey} r="5.5" fill="#fff" stroke={dark} strokeWidth="2" />
            <circle cx={rx} cy={ey} r="5.5" fill="#fff" stroke={dark} strokeWidth="2" />
            <circle cx={lx + 1} cy={ey + 1} r="2.6" fill={dark} />
            <circle cx={rx + 1} cy={ey + 1} r="2.6" fill={dark} />
            <circle cx={lx - 1} cy={ey - 1.5} r="1.2" fill="#fff" />
            <circle cx={rx - 1} cy={ey - 1.5} r="1.2" fill="#fff" />
          </>
        );
    }
  })();

  const mouth = (() => {
    const mx = 50, my = 64;
    switch (avatar.mouth) {
      case "open":
        return <ellipse cx={mx} cy={my} rx="6" ry="8" fill={dark} />;
      case "fang":
        return (
          <g>
            <path d={`M${mx - 8} ${my} q8 8 16 0`} stroke={dark} strokeWidth="2.5" fill="#fff" strokeLinecap="round" />
            <polygon points={`${mx - 4},${my} ${mx - 1},${my + 5} ${mx - 2},${my + 1}`} fill="#fff" stroke={dark} strokeWidth="1" />
            <polygon points={`${mx + 4},${my} ${mx + 1},${my + 5} ${mx + 2},${my + 1}`} fill="#fff" stroke={dark} strokeWidth="1" />
          </g>
        );
      case "neutral":
        return <line x1={mx - 6} y1={my} x2={mx + 6} y2={my} stroke={dark} strokeWidth="2.5" strokeLinecap="round" />;
      default:
        return <path d={`M${mx - 7} ${my} q7 7 14 0`} stroke={dark} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    }
  })();

  const accessory = (() => {
    switch (avatar.accessory) {
      case "crown":
        return (
          <g>
            <polygon points="30,24 38,12 50,20 62,12 70,24" fill="#ffd700" stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="38" cy="13" r="2.5" fill="#ff007f" />
            <circle cx="50" cy="20" r="2.5" fill="#00f5ff" />
            <circle cx="62" cy="13" r="2.5" fill="#39ff14" />
          </g>
        );
      case "hat":
        return (
          <g>
            <rect x="28" y="18" width="44" height="8" rx="3" fill={accent} stroke={dark} strokeWidth="2.5" />
            <path d="M34 18 q16 -14 32 0" fill={accent} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
          </g>
        );
      case "horns":
        return (
          <>
            <path d="M34 22 q-6 -10 -2 -14 q8 2 8 12" fill={accent} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M66 22 q6 -10 2 -14 q-8 2 -8 12" fill={accent} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
          </>
        );
      case "antenna":
        return (
          <>
            <line x1="42" y1="22" x2="38" y2="8" stroke={dark} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="38" cy="8" r="4" fill={accent} stroke={dark} strokeWidth="2" />
            <line x1="58" y1="22" x2="62" y2="8" stroke={dark} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="62" cy="8" r="4" fill={accent} stroke={dark} strokeWidth="2" />
          </>
        );
      case "halo":
        return <ellipse cx="50" cy="14" rx="20" ry="5" fill="none" stroke="#ffd700" strokeWidth="3" />;
      case "flames":
        return (
          <g>
            <path d="M30 24 q-4 -10 2 -14 q2 6 6 6 q-2 -8 4 -10 q2 8 -2 14" fill="#ff8c00" stroke={dark} strokeWidth="2" strokeLinejoin="round" />
            <path d="M70 24 q4 -10 -2 -14 q-2 6 -6 6 q2 -8 -4 -10 q-2 8 2 14" fill="#ff8c00" stroke={dark} strokeWidth="2" strokeLinejoin="round" />
          </g>
        );
      default:
        return null;
    }
  })();

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={glow ? { filter: `drop-shadow(0 0 10px ${avatar.color}aa)` } : undefined}
    >
      <defs>
        <radialGradient id={gradId} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={body} />
        </radialGradient>
      </defs>
      {shapeBody}
      <ellipse cx="38" cy="40" rx="9" ry="6" fill="#fff" opacity="0.25" />
      {eyes}
      {mouth}
      <circle cx="30" cy="62" r="3.5" fill="#ff007f" opacity="0.5" />
      <circle cx="70" cy="62" r="3.5" fill="#ff007f" opacity="0.5" />
      {accessory}
    </svg>
  );
}

export const AvatarSvg = React.memo(AvatarSvgImpl);
export default AvatarSvg;