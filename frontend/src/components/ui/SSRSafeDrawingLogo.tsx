interface SSRSafeDrawingLogoProps {
  size?: number;
  className?: string;
}

export const SSRSafeDrawingLogo = ({ size = 204, className = '' }: SSRSafeDrawingLogoProps) => {
  // Original dimensions of the logo
  const originalWidth = 204;
  const originalHeight = 169;
  const ratio = originalHeight / originalWidth; // ≈ 0.828

  // if size is provided, compute width & height
  const finalWidth = size;
  const finalHeight = Math.round(size * ratio);

  return (
    <div className={className}>
      <svg
        width={finalWidth}
        height={finalHeight}
        viewBox="0 0 204 169"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>
            {`
            @keyframes rotateLeftEye {
              0% {
                transform: rotate(0deg);
                transform-origin: 66px 93px;
              }
              100% {
                transform: rotate(360deg);
                transform-origin: 66px 93px;
              }
            }
            
            @keyframes rotateRightEye {
              0% {
                transform: rotate(0deg);
                transform-origin: 138px 93px;
              }
              100% {
                transform: rotate(360deg);
                transform-origin: 138px 93px;
              }
            }
            
            .left-eye-group {
              animation: rotateLeftEye 3s linear infinite;
            }
            
            .right-eye-group {
              animation: rotateRightEye 3s linear infinite;
            }
            
            .eye-spinner {
              fill: none;
              stroke: #26262A;
              stroke-width: 4px;
              stroke-linecap: round;
              stroke-dasharray: 30 60;
            }
          `}
          </style>
        </defs>

        <rect width="204" height="169" rx="70" fill="#E84A2E" />

        {/* Head outline - static */}
        <path
          d="M78.374 18C85.1826 18 90.7021 23.5195 90.7021 30.3281V33.0537C90.7019 38.8418 85.9653 43.5105 80.1777 43.4277L77.3818 43.3877C73.132 43.3269 69.6543 46.7556 69.6543 51.0059C69.6541 55.2132 66.2434 58.6238 62.0361 58.624H47.8545C35.8149 58.6241 26.0547 68.3842 26.0547 80.4238V100.625C26.0548 123.821 44.8594 142.626 68.0557 142.626H135.682C158.878 142.626 177.682 123.821 177.682 100.625V80.4238C177.682 68.3842 167.921 58.624 155.882 58.624H141.701C137.494 58.624 134.083 55.2133 134.083 51.0059C134.083 46.7558 130.605 43.3271 126.355 43.3877L123.559 43.4277C117.771 43.5105 113.034 38.8418 113.034 33.0537V30.3281C113.034 23.5196 118.554 18.0002 125.362 18H129.135C133.86 18.0001 137.69 21.8305 137.69 26.5557C137.69 31.2968 141.546 35.1346 146.287 35.1123L169.714 35.002C187.375 34.9189 201.736 49.2134 201.736 66.875V101.081C201.736 137.487 171.609 167 135.203 167H68.5332C32.1272 167 2.00002 137.487 2 101.081V66.875C2 49.2134 16.362 34.9189 34.0234 35.002L57.4492 35.1123C62.1903 35.1346 66.0459 31.2968 66.0459 26.5557C66.0462 21.8305 69.8773 18 74.6025 18H78.374Z"
          fill="#26262A"
        />

        {/* Left eye - rotating */}
        <g className="left-eye-group">
          <circle className="eye-spinner" cx="66" cy="93" r="12" />
        </g>

        {/* Right eye - rotating */}
        <g className="right-eye-group">
          <circle className="eye-spinner" cx="138" cy="93" r="12" />
        </g>
      </svg>
    </div>
  );
};
