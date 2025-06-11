interface DotsVerticalIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export function DotsVerticalIcon({ className = 'w-4 h-4', size, color }: DotsVerticalIconProps) {
  const sizeClasses = size ? `w-${size} h-${size}` : className;

  return (
    <svg
      className={sizeClasses}
      fill={color || 'currentColor'}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
  );
}
