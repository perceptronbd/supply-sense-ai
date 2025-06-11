interface CheckCircleIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export function CheckCircleIcon({ className = 'w-4 h-4', size, color }: CheckCircleIconProps) {
  const sizeClasses = size ? `w-${size} h-${size}` : className;

  return (
    <svg className={sizeClasses} fill="none" stroke={color || 'currentColor'} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
