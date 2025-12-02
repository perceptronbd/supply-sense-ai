'use client';
import { Slider } from '@heroui/react';
import { CSSProperties } from 'react';

const SliderComponent = () => {
  // Scale markers for display
  const markers = [500, 1000, 5000, 10000, 25000, 50000, 100000];

  return (
    <div className="max-w-lg mx-auto mb-8">
      {/* Slider without marks */}
      <Slider
        // isDisabled
        minValue={0}
        maxValue={markers.length - 1}
        defaultValue={3}
        color="primary"
        size="md"
        step={1}
        aria-label="Credits slider"
      />

      {/* Custom scale labels */}
      <div className="relative w-full mt-2 h-6 ">
        {markers.map((marker, index) => {
          const percentage = (index / (markers.length - 1)) * 100;
          const style: CSSProperties = { left: `${percentage}%` };
          let className = 'absolute text-xs text-default-foreground transform';

          if (index === 0) {
            className += ' -translate-x-0';
          } else if (index === markers.length - 1) {
            className += ' -translate-x-full';
          } else {
            className += ' -translate-x-1/2';
          }

          return (
            <div key={marker} style={style} className={className}>
              {marker}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SliderComponent;
