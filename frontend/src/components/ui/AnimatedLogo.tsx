interface AnimatedLogoProps {
  size?: number;
  className?: string;
  variant?: 'primary' | 'secondary' | 'mono';
  duration?: number; // Total animation duration in seconds
}

const colorMap = {
  primary: 'stroke-primary fill-primary',
  secondary: 'stroke-secondary fill-secondary',
  mono: 'stroke-foreground fill-foreground',
};

export function AnimatedLogo({
  size = 80,
  className = '',
  variant = 'primary',
  duration = 4, // 4 second total cycle
}: Readonly<AnimatedLogoProps>) {
  const colorClass = colorMap[variant];

  // Animation timing breakdown:
  // 0-25%: Draw in (stroke appears)
  // 25-50%: Fill in (fill appears)
  // 50-75%: Draw out (stroke disappears)
  // 75-100%: Fill out (fill disappears)

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 161 157"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin-slow"
      >
        <defs>
          <style>
            {`
              @keyframes drawInFillInDrawOutFillOut {
                /* Draw in phase */
                0% {
                  stroke-dashoffset: 1000;
                  fill-opacity: 0;
                }
                25% {
                  stroke-dashoffset: 0;
                  fill-opacity: 0;
                }
                /* Fill in phase */
                50% {
                  stroke-dashoffset: 0;
                  fill-opacity: 1;
                }
                /* Draw out phase */
                75% {
                  stroke-dashoffset: -1000;
                  fill-opacity: 1;
                }
                /* Fill out phase */
                100% {
                  stroke-dashoffset: -1000;
                  fill-opacity: 0;
                }
              }
              
              .animated-path {
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
                animation: drawInFillInDrawOutFillOut ${duration}s ease-in-out infinite;
                stroke-width: 2;
                fill-opacity: 0;
              }
              
              .animated-path:nth-child(2) {
                animation-delay: 0.2s;
              }
              
              @keyframes spin-slow {
                from {
                  transform: rotate(0deg);
                }
                to {
                  transform: rotate(360deg);
                }
              }
              
              .animate-spin-slow {
                animation: spin-slow ${duration * 2}s linear infinite;
              }
            `}
          </style>
        </defs>

        <path
          className={`animated-path ${colorClass}`}
          d="M116.56 49.189c24.522 0 44.401 19.91 44.402 44.47.001 24.562-19.878 44.474-44.399 44.475h-.114c-3.022 0-5.374 5.154-5.374 8.181 0 5.625-4.552 10.185-10.168 10.185s-10.168-4.56-10.168-10.185c0-5.625 4.552-10.184 10.168-10.184 2.016-.001 4.171-1.392 4.171-3.412v-8.496c.001-3.292 2.665-5.962 5.952-5.962h5.532c13.564 0 24.56-11.014 24.56-24.6-.001-13.586-10.997-24.6-24.561-24.6l-59.56.002a5.957 5.957 0 0 1-5.953-5.961v-7.95A5.957 5.957 0 0 1 57 49.192l59.56-.002Z"
        />

        <path
          className={`animated-path ${colorClass}`}
          d="M64.202.5C69.818.5 74.37 5.06 74.37 10.685c0 5.624-4.552 10.184-10.168 10.184-2.973 0-7.357 2.108-7.357 5.085v3.592a4.735 4.735 0 0 1-4.731 4.739h-6.752c-13.564 0-24.56 11.015-24.56 24.601 0 13.586 10.997 24.599 24.561 24.599l59.56-.002a5.957 5.957 0 0 1 5.952 5.962l.001 7.949a5.958 5.958 0 0 1-5.953 5.962l-59.56.001c-24.521.001-44.4-19.91-44.401-44.47 0-24.562 19.878-44.474 44.4-44.475h5.565c1.83 0 3.107-1.895 3.107-3.727C54.034 5.06 58.587.5 64.202.5Z"
        />
      </svg>
    </div>
  );
}

export default AnimatedLogo;
