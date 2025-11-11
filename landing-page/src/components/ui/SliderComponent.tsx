'use client';
import { Slider } from '@heroui/react';

const SliderComponent = () => {
  // Scale markers for display
  const markers = [500, 1000, 5000, 10000, 25000, 50000, 100000];

  return (
    <div className="max-w-lg mx-auto mb-8">
      {/* Slider without marks */}
      <Slider
        isDisabled
        minValue={500}
        maxValue={100000}
        defaultValue={10000}
        color="primary"
        size="md"
        step={100}
      />

      {/* Custom scale labels */}
      <div className="flex justify-between mt-2">
        {markers.map((marker, index) => (
          <div
            key={marker}
            className={`text-xs text-default-foreground ${
              index === markers.length - 1 ? 'text-end' : 'text-start'
            }`}
          >
            {marker}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SliderComponent;
