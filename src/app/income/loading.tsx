export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-24 bg-green-50 rounded-xl"></div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}
