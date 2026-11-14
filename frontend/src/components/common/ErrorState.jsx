import { AlertOctagon, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

export default function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-6 py-8 text-center">
      <AlertOctagon className="h-8 w-8 text-red-400" aria-hidden="true" />
      <p className="font-semibold text-red-200">Something went wrong</p>
      <p className="max-w-lg text-sm text-slate-300">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>Try again</Button>}
    </div>
  );
}
