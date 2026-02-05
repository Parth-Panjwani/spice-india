export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
      <div className="flex justify-end">
        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}
