export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/80 backdrop-blur-sm z-50 fixed inset-0">
      <div className="text-center">
        <div className="inline-flex w-16 h-16 bg-white rounded-2xl items-center justify-center shadow-2xl shadow-brand-500/20 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-500 origin-bottom animate-wave opacity-10"></div>
          <span className="text-2xl font-black text-brand-600 animate-pulse">C</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight animate-fade-in">Loading SchemeAtlas...</h2>
        <p className="text-sm font-medium text-slate-400 mt-2">Fetching global schemes from the database</p>
      </div>
    </div>
  );
}
