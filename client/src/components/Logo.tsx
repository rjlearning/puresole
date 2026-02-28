import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  light?: boolean;
}

/**
 * PureSoul logo — Minimalist Orbit Concept
 * Solid main circle with three ascending floating colored dots.
 * Bold, high-contrast dark text.
 */
export default function Logo({ size = 'md', showText = true, className = '', light = false }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: 'text-xl', gap: 'gap-2' },
    md: { icon: 36, text: 'text-2xl', gap: 'gap-2.5' },
    lg: { icon: 48, text: 'text-4xl', gap: 'gap-3' },
    xl: { icon: 64, text: 'text-6xl', gap: 'gap-4' },
  };

  const s = sizes[size];
  const color = light ? '#FFFFFF' : '#000000';

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="PureSoul"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
          <linearGradient id="bar2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#D946EF" />
          </linearGradient>
          <linearGradient id="bar3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="bar4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="bar5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
        </defs>

        {/* Soundwave Bars */}
        <rect x="12" y="35" width="10" height="30" rx="5" fill="url(#bar1)" />
        <rect x="28" y="20" width="10" height="60" rx="5" fill="url(#bar2)" />
        <rect x="44" y="10" width="10" height="80" rx="5" fill="url(#bar3)" />
        <rect x="60" y="20" width="10" height="60" rx="5" fill="url(#bar4)" />
        <rect x="76" y="35" width="10" height="30" rx="5" fill="url(#bar5)" />

        {/* Floating Bubble Dots (Top Right) */}
        <circle cx="86" cy="16" r="5" fill="#F472B6" />
        <circle cx="96" cy="24" r="3" fill="#22D3EE" />
      </svg>

      {showText && (
        <span
          className={`font-black tracking-tighter select-none leading-none ${s.text}`}
          style={{ color }}
        >
          PureSoul
        </span>
      )}
    </div>
  );
}
