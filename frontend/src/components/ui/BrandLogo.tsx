import { LogoIcon } from '@/components/icons/LogoIcon';
import { SupplySenseTextIcon } from '@/components/icons/SupplySenseTextIcon';
import { Text } from '@/components/ui/Text';
import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'primary' | 'secondary' | 'mono';
  logoType?: 'icon-text' | 'svg-text'; // New prop to choose logo type
  className?: string;
}

const sizeMap = {
  sm: { icon: 24, text: 'bodySmall' as const, svgText: 90 },
  md: { icon: 32, text: 'titleMedium' as const, svgText: 120 },
  lg: { icon: 48, text: 'titleLarge' as const, svgText: 150 },
};

export function BrandLogo({ size = 'md', showText = true, className = '' }: BrandLogoProps) {
  const { icon, svgText } = sizeMap[size];

  // Default: icon + text combination
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={icon} className={'text-default-50 bg-primary p-1 rounded-md'} />
      {showText && (
        <div className={`flex items-center ${className}`}>
          <SupplySenseTextIcon size={svgText} className={'bg-primary'} />
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
