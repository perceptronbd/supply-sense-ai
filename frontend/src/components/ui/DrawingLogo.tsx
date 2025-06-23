import { useMemo } from 'react';

interface DrawingLogoProps {
  size?: number;
  className?: string;
  variant?: 'primary' | 'secondary' | 'mono';
  speed?: 'slow' | 'normal' | 'fast';
  showFill?: boolean;
  id?: string; // Optional stable ID for SSR
}

const colorMap = {
  primary: { stroke: 'stroke-primary', fill: 'fill-primary' },
  secondary: { stroke: 'stroke-secondary', fill: 'fill-secondary' },
  mono: { stroke: 'stroke-foreground', fill: 'fill-foreground' },
};

const speedMap = {
  slow: 6,
  normal: 4,
  fast: 2,
};

export function DrawingLogo({
  size = 80,
  className = '',
  variant = 'primary',
  speed = 'normal',
  showFill = true,
  id,
}: DrawingLogoProps) {
  const colors = colorMap[variant];
  const duration = speedMap[speed];

  // Create a stable animation ID for SSR compatibility
  const animationId = useMemo(() => {
    if (id) {
      return `drawAnimation-${id}`;
    }
    // Use a hash of props for stable ID generation
    const propsHash = `${variant}-${speed}-${showFill}-${size}`;
    return `drawAnimation-${propsHash.replace(/[^a-zA-Z0-9]/g, '')}`;
  }, [id, variant, speed, showFill, size]);

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 161 157"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>
            {`
              @keyframes ${animationId} {
                /* Phase 1: Draw in (0-25%) */
                0% {
                  stroke-dashoffset: 1000;
                  fill-opacity: 0;
                }
                25% {
                  stroke-dashoffset: 0;
                  fill-opacity: 0;
                }
                
                /* Phase 2: Fill in (25-50%) */
                ${showFill ? '50%' : '25%'} {
                  stroke-dashoffset: 0;
                  fill-opacity: ${showFill ? '0.8' : '0'};
                }
                
                /* Phase 3: Draw out (50-75%) */
                75% {
                  stroke-dashoffset: -1000;
                  fill-opacity: ${showFill ? '0.8' : '0'};
                }
                
                /* Phase 4: Fill out (75-100%) */
                100% {
                  stroke-dashoffset: -1000;
                  fill-opacity: 0;
                }
              }
              
              .drawing-path-${animationId} {
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
                animation: ${animationId} ${duration}s ease-in-out infinite;
                stroke-width: 2;
                fill-opacity: 0;
                stroke-linecap: round;
                stroke-linejoin: round;
              }
              
              .drawing-path-${animationId}:nth-child(2) {
                animation-delay: ${duration * 0.1}s;
              }
            `}
          </style>
        </defs>

        {/* First path */}
        <path
          className={`drawing-path-${animationId} ${colors.stroke} ${colors.fill}`}
          d="M116.56 49.189c24.522 0 44.401 19.91 44.402 44.47.001 24.562-19.878 44.474-44.399 44.475h-.114c-3.022 0-5.374 5.154-5.374 8.181 0 5.625-4.552 10.185-10.168 10.185s-10.168-4.56-10.168-10.185c0-5.625 4.552-10.184 10.168-10.184 2.016-.001 4.171-1.392 4.171-3.412v-8.496c.001-3.292 2.665-5.962 5.952-5.962h5.532c13.564 0 24.56-11.014 24.56-24.6-.001-13.586-10.997-24.6-24.561-24.6l-59.56.002a5.957 5.957 0 0 1-5.953-5.961v-7.95A5.957 5.957 0 0 1 57 49.192l59.56-.002Z"
        />

        {/* Second path */}
        <path
          className={`drawing-path-${animationId} ${colors.stroke} ${colors.fill}`}
          d="M64.202.5C69.818.5 74.37 5.06 74.37 10.685c0 5.624-4.552 10.184-10.168 10.184-2.973 0-7.357 2.108-7.357 5.085v3.592a4.735 4.735 0 0 1-4.731 4.739h-6.752c-13.564 0-24.56 11.015-24.56 24.601 0 13.586 10.997 24.599 24.561 24.599l59.56-.002a5.957 5.957 0 0 1 5.952 5.962l.001 7.949a5.958 5.958 0 0 1-5.953 5.962l-59.56.001c-24.521.001-44.4-19.91-44.401-44.47 0-24.562 19.878-44.474 44.4-44.475h5.565c1.83 0 3.107-1.895 3.107-3.727C54.034 5.06 58.587.5 64.202.5Z"
        />
      </svg>
    </div>
  );
}

export default DrawingLogo;
