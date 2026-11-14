import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', description, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-700/60 bg-space-900/40 px-6 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-cyan-300"><Icon className="h-6 w-6" aria-hidden="true" /></span>
      <div>
        <p className="font-semibold text-slate-200">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
