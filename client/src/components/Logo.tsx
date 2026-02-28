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
        {/* Main Solid Circle */}
        <circle cx="40" cy="50" r="40" fill={color} />

        {/* Floating Bubble Dots */}
        <circle cx="72" cy="12" r="4.5" fill="#A855F7" /> {/* Purple */}
        <circle cx="88" cy="22" r="6" fill="#F472B6" /> {/* Pink */}
        <circle cx="82" cy="38" r="3.5" fill="#22D3EE" /> {/* Cyan */}
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
