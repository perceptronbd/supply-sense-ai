interface MenuIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export function MenuIcon({ className = 'w-6 h-6', size, color }: MenuIconProps) {
  const sizeClasses = size ? `w-${size} h-${size}` : className;

  return (
    <svg className={sizeClasses} fill="none" stroke={color || 'currentColor'} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
