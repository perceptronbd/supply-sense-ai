import React from 'react';

interface BuildingIconProps {
  className?: string;
}

export function BuildingIcon({ className = 'w-6 h-6' }: BuildingIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15l-.75 18h-13.5L4.5 3zM9 9h1.5m-1.5 3h1.5m3-3H15m-1.5 3H15m-1.5 3H15m-4.5 0h1.5m-1.5-6V9"
      />
    </svg>
  );
}
