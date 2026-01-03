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
        className={`absolute -top-3 right-16 w-12 h-[20vh]
        md:right-28 md:w-40 md:h-[54vh] 
        xl:right-72 xl:w-60 xl:h-[90vh]
        bg-gradient-to-b ${intensity.light} transform rotate-[27deg] origin-top-right z-0`}
      />

      {/* Glow 2 - Edge right glow */}
      <div
        className={`absolute -top-3 right-1 w-8 h-[36vh]
    md:right-0 md:w-12 md:h-[85vh] 
    xl:right-32 xl:w-28 xl:h-[130vh]
    bg-gradient-to-b ${intensity.strong} transform rotate-[27deg] origin-top-right z-0`}
      />

      {/* Glow 3 - Far right glow (hidden on very small screens) */}
      <div
        className={`absolute -top-3 -right-16 w-8 h-[52vh] 
    md:-right-32 md:w-12 md:h-[90vh] 
    xl:-right-28 xl:w-40 xl:h-[155vh]
    bg-gradient-to-b ${intensity.strong} transform rotate-[27deg] origin-top-right z-0`}
      />

      {/* Glow 4 - Extreme right glow (only visible on larger screens) */}
      <div
        className={`absolute -top-3 -right-32 w-8 h-[64vh]
    md:-right-64 md:w-12 md:h-[90vh] 
    xl:-right-72 xl:w-28 xl:h-[170vh]
    bg-gradient-to-b ${intensity.normal} transform rotate-[27deg] origin-top-right z-0`}
      />
    </div>
  );
};

export default GlowEffects;
