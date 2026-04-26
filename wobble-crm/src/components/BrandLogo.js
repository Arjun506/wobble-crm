import React from 'react';

export default function BrandLogo({ className }) {
  return (
    <svg
      viewBox="0 0 400 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Wobble logo"
    >
      <defs>
        <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Phone / Device icon circle background */}
      <circle cx="50" cy="60" r="38" fill="url(#iconGrad)" opacity="0.15" />
      
      {/* Stylized phone outline */}
      <rect
        x="32"
        y="30"
        width="36"
        height="60"
        rx="8"
        fill="none"
        stroke="url(#iconGrad)"
        strokeWidth="4"
      />
      {/* Screen */}
      <rect
        x="36"
        y="38"
        width="28"
        height="40"
        rx="3"
        fill="url(#iconGrad)"
        opacity="0.9"
      />
      {/* Home button dot */}
      <circle cx="50" cy="84" r="3" fill="url(#iconGrad)" />
      {/* Signal wave */}
      <path
        d="M 78 45 Q 88 35 98 45"
        fill="none"
        stroke="url(#iconGrad)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 82 52 Q 88 46 94 52"
        fill="none"
        stroke="url(#iconGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Wobble text */}
      <text
        x="115"
        y="78"
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
        fontSize="72"
        fontWeight="800"
        fill="url(#textGrad)"
        letterSpacing="-2"
        filter="url(#glow)"
      >
        Wobble
      </text>

      {/* Subtle underline swoosh */}
      <path
        d="M 115 92 Q 220 102 325 92"
        fill="none"
        stroke="url(#textGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

