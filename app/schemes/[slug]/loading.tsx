export default function SchemeLoading() {
  return (
    <div className="min-h-screen bg-slate-50 page-container py-12">
      <div className="max-w-3xl mx-auto animate-pulse">
        {/* Skeleton Hero */}
        <div className="relative rounded-xl overflow-hidden mb-6 bg-slate-800 h-64 border border-slate-200">
          <div className="absolute inset-0 p-8 sm:p-10 flex flex-col justify-end">
             <div className="flex gap-3 mb-4">
                <div className="w-24 h-6 bg-slate-600 rounded-full"></div>
                <div className="w-24 h-6 bg-slate-600 rounded-full"></div>
             </div>
             <div className="w-3/4 h-10 bg-slate-600 rounded-lg mb-2"></div>
             <div className="w-1/3 h-4 bg-slate-700 rounded-lg"></div>
          </div>
        </div>

        {/* Skeleton Details */}
        <div className="card p-8 bg-white border border-slate-100 shadow-sm rounded-2xl space-y-6">
          <div className="w-48 h-20 bg-slate-100 border border-slate-200 rounded-xl mb-4"></div>
          
          <div className="space-y-3">
            <div className="w-full h-4 bg-slate-200 rounded-md"></div>
            <div className="w-full h-4 bg-slate-200 rounded-md"></div>
            <div className="w-5/6 h-4 bg-slate-200 rounded-md"></div>
          </div>
          
          <div className="space-y-3 pt-6">
            <div className="w-1/3 h-6 bg-slate-200 rounded-md mb-2"></div>
            <div className="w-full h-4 bg-slate-200 rounded-md"></div>
            <div className="w-4/5 h-4 bg-slate-200 rounded-md"></div>
          </div>

          <div className="flex gap-3 pt-4">
            <div className="flex-1 h-12 bg-slate-200 rounded-lg"></div>
            <div className="flex-1 h-12 bg-slate-200 rounded-lg"></div>
            <div className="flex-1 h-12 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
