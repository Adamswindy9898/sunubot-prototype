export default function Loading() {
  return (
    <div className="flex flex-col h-screen bg-[#f0f7f4]">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-[#1F5C99] to-[#0f3d6e] px-5 py-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/20 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
          <div className="h-3 w-40 bg-white/10 rounded mt-1.5 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-8 w-16 bg-white/10 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="w-[240px] bg-white border-r border-gray-200 hidden md:block p-3 space-y-3">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-2">
              <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-3 flex-1 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
          <div className="h-px bg-gray-100 my-3" />
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-50 rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>

        {/* Chat skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-4">
            <div className="flex gap-3 max-w-md">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
              </div>
            </div>
            <div className="flex gap-3 max-w-sm ml-auto">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-blue-100 rounded w-full animate-pulse" />
                <div className="h-4 bg-blue-50 rounded w-2/3 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2">
            <div className="flex-1 h-10 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="w-10 h-10 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
