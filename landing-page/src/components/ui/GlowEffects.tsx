const GlowEffects = ({ className = '' }) => {
  const intensity = {
    light:
      'from-primary-900/35 via-primary-900/20 md:from-primary-900/25 md:via-primary-900/15 blur-lg md:blur-2xl',
    normal:
      'from-primary-900/40 via-primary-900/20 md:from-primary-900/30 md:via-primary-900/15 to-transparent blur-lg md:blur-2xl',
    strong:
      'from-primary-900/60 via-primary-900/30 md:from-primary-900/50 md:via-primary-900/20 to-transparent blur-lg md:blur-2xl',
  };

  return (
    <div className={`inset-0 pointer-events-none ${className}`}>
      {/* Glow 1 - Main right glow */}
      <div
        className={`absolute -top-3 right-16 w-12 h-[7%]
        md:right-28 md:w-40 md:h-[14%] 
        xl:right-72 xl:w-60 xl:h-[15%]
        bg-gradient-to-b ${intensity.light} transform rotate-[27deg] origin-top-right -z-10`}
      />

      {/* Glow 2 - Edge right glow */}
      <div
        className={`absolute -top-3 right-1 w-8 h-[10%]
        md:right-0 md:w-12 md:h-[18%] 
        xl:right-32 xl:w-28 xl:h-[15%]
        bg-gradient-to-b ${intensity.strong} transform rotate-[27deg] origin-top-right -z-10`}
      />

      {/* Glow 3 - Far right glow (hidden on very small screens) */}
      <div
        className={`absolute -top-3 -right-16 w-8 h-[11%] 
        md:-right-32 md:w-12 md:h-[19%] 
        xl:-right-28 xl:w-40 xl:h-[15%]
        bg-gradient-to-b ${intensity.strong} transform rotate-[27deg] origin-top-right -z-10`}
      />

      {/* Glow 4 - Extreme right glow (only visible on larger screens) */}
      <div
        className={`absolute -top-3 -right-32 w-8 h-[12%]
        md:-right-64 md:w-12 md:h-[21%] 
        xl:-right-72 xl:w-28 xl:h-[16%]
        bg-gradient-to-b ${intensity.normal} transform rotate-[27deg] origin-top-right -z-10`}
      />
    </div>
  );
};

export default GlowEffects;
