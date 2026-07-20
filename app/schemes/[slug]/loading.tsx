export default function SchemeLoading() {
  // Minimal loading state — intentionally content-free.
  // The real scheme content is SSR'd in page.tsx.
  // This file only shows briefly during Next.js streaming on cold starts.
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading scheme details…</p>
      </div>
    </div>
  );
}
