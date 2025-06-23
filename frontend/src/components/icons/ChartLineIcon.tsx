interface ChartLineIconProps {
  size?: number;
  className?: string;
  color?: string;
}

export function ChartLineIcon({
  size = 24,
  className = '',
  color = 'currentColor',
}: ChartLineIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M3 3V21H21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 12L12 7L16 11L21 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="12" r="1" fill={color} />
      <circle cx="12" cy="7" r="1" fill={color} />
      <circle cx="16" cy="11" r="1" fill={color} />
      <circle cx="21" cy="6" r="1" fill={color} />
    </svg>
  );
}
