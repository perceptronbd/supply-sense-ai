const RelationshipCardSkeleton = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 w-full">
      {/* Header with dropdowns */}
      <div className="flex items-center gap-4 mb-6">
        {/* First dropdown skeleton */}
        <div className="flex items-center gap-2 bg-gray-700 rounded-md px-3 py-2 flex-1">
          <div className="h-4 bg-gray-600 rounded w-32 animate-pulse" />
          <div className="h-3 w-3 bg-gray-600 rounded ml-auto animate-pulse" />
        </div>

        {/* Second dropdown skeleton */}
        <div className="flex items-center gap-2 bg-gray-700 rounded-md px-3 py-2 flex-1">
          <div className="h-4 bg-gray-600 rounded w-24 animate-pulse" />
          <div className="h-3 w-3 bg-gray-600 rounded ml-auto animate-pulse" />
        </div>
      </div>

      {/* Description text skeleton */}
      <div className="mb-6 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-700 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-3">
        {/* Yes button */}
        <div className="h-10 bg-success-500/20 rounded-md w-16 animate-pulse" />

        {/* No button */}
        <div className="h-10 bg-[#F31260]/20 rounded-md w-16 animate-pulse" />

        {/* Not Sure button */}
        <div className="h-10 bg-warning-500/20 rounded-md w-24 animate-pulse" />
      </div>
    </div>
  );
};

export default RelationshipCardSkeleton;
