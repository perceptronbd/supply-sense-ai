'use client';

interface ProgressBarProps {
  value: number; // Current value (between 500 and 100000)
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ className = '' }) => {
  // Scale markers
  const markers = [
    { value: 500 },
    { value: 1000 },
    { value: 5000 },
    { value: 10000 },
    { value: 25000 },
    { value: 50000 },
    { value: 100000 },
  ];

  return (
    <div className={`max-w-lg mx-auto ${className}`}>
      {/* Progress bar container */}
      <div className="relative h-4 bg-default-300 rounded-lg overflow-hidden">
        {/* Gradient progress fill */}
        <div className="absolute top-0 left-0 -translate-x-5 h-full bg-gradient-to-r from-primary to-primary-50 w-1/2" />

        {/* Orange circular marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-6 w-4 h-4 bg-background rounded-full border-2 border-primary shadow-lg z-10" />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-2">
        {markers.map((marker, index) => (
          <div
            key={marker.value}
            className={`text-xs text-default-foreground ${index === 7 ? 'text-end' : 'text-start'}`}
          >
            {marker.value}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
