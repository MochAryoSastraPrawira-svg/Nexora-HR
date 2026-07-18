import React from "react";

export const NexoraLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`${className} shrink-0 select-none`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#0D47A1" />
      </linearGradient>
    </defs>

    {/* Left Branch */}
    <path
      d="M 46,31 C 41,34 32,32 30,42 C 28,52 38,56 46,62 C 54,68 50,78 42,78 C 34,78 30,70 34,60"
      stroke="url(#blueGrad)"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Right Branch (same color, no arrow) */}
    <path
      d="M 54,31 C 59,34 68,32 70,42 C 72,52 62,56 54,62 C 46,68 50,78 58,78 C 66,78 70,70 66,60"
      stroke="url(#blueGrad)"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Human Head */}
    <circle cx="50" cy="20" r="7" fill="url(#blueGrad)" />
  </svg>
);
