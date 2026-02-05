export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
      </div>
      
      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="h-64 bg-gray-100 rounded-xl"></div>
    </div>
  );
}
