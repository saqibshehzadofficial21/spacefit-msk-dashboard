import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', description, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-subtle bg-surface-sunken px-6 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-status-info-bg text-status-info"><Icon className="h-6 w-6" aria-hidden="true" /></span>
      <div>
        <p className="font-semibold text-secondary">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
