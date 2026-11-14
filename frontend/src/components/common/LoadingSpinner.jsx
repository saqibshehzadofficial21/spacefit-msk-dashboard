export default function LoadingSpinner({ label = 'Loading', className = '' }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-3 py-10 text-sm text-slate-400 ${className}`}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" aria-hidden="true" />
      {label}…
    </div>
  );
}

export function Skeleton({ className = 'h-24' }) {
  return <div className={`${className} animate-pulse rounded-xl bg-gradient-to-r from-space-700 via-space-600 to-space-700 bg-[length:200%_100%]`} aria-hidden="true" />;
}
