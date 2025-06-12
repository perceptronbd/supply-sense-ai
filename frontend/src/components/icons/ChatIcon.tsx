interface ChatIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export function ChatIcon({ className = 'w-4 h-4', size, color }: ChatIconProps) {
  const sizeClasses = size ? `w-${size} h-${size}` : className;

  return (
    <svg className={sizeClasses} fill="none" stroke={color || 'currentColor'} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}
