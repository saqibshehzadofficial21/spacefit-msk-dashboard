export default function LoadingSpinner({ label = 'Loading', className = '' }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-3 py-10 text-sm text-muted ${className}`}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-border-strong border-t-accent" aria-hidden="true" />
      {label}…
    </div>
  );
}

export function Skeleton({ className = 'h-24' }) {
  return <div className={`${className} animate-pulse rounded-xl bg-surface-sunken`} aria-hidden="true" />;
}
