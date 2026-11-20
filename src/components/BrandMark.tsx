import React from 'react';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

/**
 * Minimalist geometric emblem representing two opposing perspectives
 * converging toward a shared central meridian without partisan iconography.
 */
export function BrandMark({ size = 28, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="16.5" stroke="#E8E3D8" strokeWidth="1" />
      <path
        d="M8.5 11.5C12.8 11.5 15.6 14.3 15.6 18C15.6 21.7 12.8 24.5 8.5 24.5"
        stroke="#292820"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M27.5 11.5C23.2 11.5 20.4 14.3 20.4 18C20.4 21.7 23.2 24.5 27.5 24.5"
        stroke="#A18450"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line x1="18" y1="8.5" x2="18" y2="27.5" stroke="#A18450" strokeWidth="1.2" />
      <circle cx="18" cy="18" r="2" fill="#A18450" />
    </svg>
  );
}

interface BrandLockupProps {
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function BrandLockup({ onClick, size = 'md' }: BrandLockupProps) {
  const content = (
    <span className="inline-flex items-center gap-3 whitespace-nowrap shrink-0">
      <BrandMark size={size === 'sm' ? 24 : 28} />
      <span
        className={`font-editorial font-semibold uppercase text-[#292820] tracking-[0.22em] ${
          size === 'sm' ? 'text-sm' : 'text-base md:text-[17px]'
        }`}
      >
        ANTIRRATHETO
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A18450] rounded-sm cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return content;
}
