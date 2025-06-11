interface XMarkIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export function XMarkIcon({ className = 'w-4 h-4', size, color }: XMarkIconProps) {
  const sizeClasses = size ? `w-${size} h-${size}` : className;

  return (
    <svg className={sizeClasses} fill="none" stroke={color || 'currentColor'} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
