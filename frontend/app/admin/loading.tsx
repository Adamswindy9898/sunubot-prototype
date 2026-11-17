export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 bg-[#1F5C99] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-white font-black text-lg">SB</span>
        </div>
        <div className="h-4 w-40 bg-gray-200 rounded mx-auto animate-pulse mb-2" />
        <div className="h-3 w-56 bg-gray-100 rounded mx-auto animate-pulse" />
      </div>
    </div>
  );
}
