import { AlertOctagon, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

export default function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-status-critical-border bg-status-critical-bg px-6 py-8 text-center">
      <AlertOctagon className="h-8 w-8 text-status-critical" aria-hidden="true" />
      <p className="font-semibold text-status-critical">Could not load this section</p>
      <p className="max-w-lg text-sm text-secondary">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>Try again</Button>}
    </div>
  );
}
