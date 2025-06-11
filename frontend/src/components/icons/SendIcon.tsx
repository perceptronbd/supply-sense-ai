interface SendIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export function SendIcon({ className = 'w-4 h-4', size, color }: SendIconProps) {
  const sizeClasses = size ? `w-${size} h-${size}` : className;

  return (
    <svg className={sizeClasses} fill="none" stroke={color || 'currentColor'} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );
}
