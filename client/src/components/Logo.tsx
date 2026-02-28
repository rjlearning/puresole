interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  light?: boolean;
}

/**
 * PureSoul logo — "Soulwave" concept
 * A soundwave / frequency bars mark — clean, modern, Spotify/Endel-inspired.
 * Aurora gradient (violet → pink → cyan), transparent background.
 */
export default function Logo({ size = 'md', showText = true, className = '', light = false }: LogoProps) {
  const sizes = {
    sm: { icon: 30, text: 'text-base', gap: 'gap-2' },
    md: { icon: 40, text: 'text-xl', gap: 'gap-2.5' },
    lg: { icon: 54, text: 'text-3xl', gap: 'gap-3' },
    xl: { icon: 72, text: 'text-5xl', gap: 'gap-4' },
  };

  const s = sizes[size];
  const id = `sw${size}`;

  // Bar heights (center bar tallest) — creates a gentle wave peak
  const bars = [
    { x: 12, h: 36, y: 32 },
    { x: 25, h: 52, y: 24 },
    { x: 38, h: 70, y: 15 },
    { x: 51, h: 60, y: 20 },
    { x: 64, h: 44, y: 28 },
    { x: 77, h: 28, y: 36 },
  ];

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="PureSoul"
      >
        <defs>
          <linearGradient id={`${id}g`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
          <radialGradient id={`${id}glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient glow */}
        <circle cx="50" cy="50" r="46" fill={`url(#${id}glow)`} />

        {/* Equalizer bars — rounded, filled with aurora gradient */}
        {bars.map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y={bar.y}
            width="9"
            height={bar.h}
            rx="4.5"
            ry="4.5"
            fill={`url(#${id}g)`}
            opacity={0.75 + i * 0.04}
          />
        ))}

        {/* Baseline subtle line */}
        <line
          x1="10" y1="88" x2="90" y2="88"
          stroke={`url(#${id}g)`}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.2"
        />

        {/* Tiny sparkle dot — top right */}
        <circle cx="90" cy="14" r="4" fill="#EC4899" opacity="0.9" />
        <circle cx="82" cy="10" r="2.5" fill="#7C3AED" opacity="0.6" />
        <circle cx="94" cy="22" r="2" fill="#22D3EE" opacity="0.6" />
      </svg>

      {showText && (
        <span
          className={`font-extrabold tracking-tight select-none leading-none ${s.text}`}
          style={light
            ? { color: '#ffffff' }
            : {
              background: 'linear-gradient(120deg, #7C3AED 0%, #EC4899 52%, #22D3EE 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
        >
          PureSoul
        </span>
      )}
    </div>
  );
}
