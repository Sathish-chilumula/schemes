// Inline skeleton loader — renders in page flow, not as a fixed overlay.
// This ensures Googlebot can see server-rendered content on all pages.
export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Skeleton hero bar */}
      <div className="bg-slate-900 pt-32 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-4 w-32 bg-slate-700 rounded-full mb-4 animate-pulse" />
          <div className="h-10 w-2/3 bg-slate-700 rounded-xl mb-3 animate-pulse" />
          <div className="h-6 w-1/2 bg-slate-800 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Skeleton scheme cards grid */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-5 w-48 bg-slate-200 rounded-full mb-8 animate-pulse" />
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="h-3 w-20 bg-slate-100 rounded-full mb-4 animate-pulse" />
              <div className="h-5 w-full bg-slate-100 rounded-lg mb-2 animate-pulse" />
              <div className="h-4 w-4/5 bg-slate-100 rounded-lg mb-4 animate-pulse" />
              <div className="h-3 w-3/5 bg-slate-50 rounded-lg animate-pulse" />
              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-8 w-24 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
