import { useState } from 'react';
import { CheckCircle2, Eye, MessageSquarePlus, ShieldCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { Field, Textarea } from '../common/Input.jsx';
import { alertService } from '../../services/alertService.js';
import { useAppContext } from '../../context/AppContext.jsx';
import { ALERT_CATEGORIES, ALERT_STATUSES } from '../../utils/constants.js';
import { formatDateTime, formatNumber, SEVERITY_TEXT, SEVERITY_TONE } from '../../utils/formatters.js';

/** Alert detail body: data fields, workflow actions and specialist notes. Used inside a modal or drawer. */
export default function AlertDetails({ alert, onChanged, onDeleted }) {
  const { can, notifyDataChanged } = useAppContext();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const categoryLabel = ALERT_CATEGORIES.find((c) => c.value === alert.category)?.label ?? alert.category;

  const update = async (patch, message) => {
    setBusy(true);
    try {
      const res = await alertService.update(alert.id, patch);
      toast.success(message);
      notifyDataChanged();
      onChanged?.(res.data);
      if (patch.specialistNote) setNote('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await alertService.remove(alert.id);
      toast.success('Alert deleted');
      notifyDataChanged();
      onDeleted?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const canReview = can('alerts:write');
  const rows = [
    ['Alert ID', <span key="id" className="font-mono text-xs">{alert.id}</span>],
    ['Astronaut', alert.astronautId],
    ['Category', categoryLabel],
    ['Severity', <StatusBadge key="s" tone={SEVERITY_TONE[alert.severity]} dot>{SEVERITY_TEXT[alert.severity] ?? alert.severity}</StatusBadge>],
    ['Related metric', alert.relatedMetric ?? '—'],
    ['Baseline measurement', alert.baselineValue === null || alert.baselineValue === undefined ? '—' : formatNumber(alert.baselineValue, 2)],
    ['Current measurement', alert.currentValue === null || alert.currentValue === undefined ? '—' : formatNumber(alert.currentValue, 2)],
    ['Difference', alert.difference === null || alert.difference === undefined ? '—' : formatNumber(alert.difference, 2)],
    ['Generated', formatDateTime(alert.generatedAt)],
    ['Review status', <StatusBadge key="r" tone="info">{ALERT_STATUSES.find((s) => s.value === alert.reviewStatus)?.label ?? alert.reviewStatus}</StatusBadge>],
    ['Data source', alert.dataSource === 'ai-generated' ? 'AI-generated (rule-based engine)' : 'Manually entered'],
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-xl border border-slate-700/50 bg-space-900/50 p-4 text-sm leading-relaxed text-slate-200">{alert.description}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-slate-800 bg-space-900/40 px-3 py-2">
            <dt className="label-muted">{k}</dt>
            <dd className="mt-1 text-sm text-slate-100">{v}</dd>
          </div>
        ))}
      </dl>

      {canReview && (
        <div className="flex flex-col gap-3 border-t border-slate-700/40 pt-4">
          <p className="label-muted">Workflow actions</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={Eye} loading={busy} onClick={() => update({ reviewStatus: 'reviewed' }, 'Marked as reviewed')}>Mark as reviewed</Button>
            <Button size="sm" variant="secondary" icon={ShieldCheck} loading={busy} onClick={() => update({ reviewStatus: 'acknowledged' }, 'Alert acknowledged')}>Acknowledge</Button>
            <Button size="sm" variant="secondary" icon={CheckCircle2} loading={busy} onClick={() => update({ reviewStatus: 'resolved' }, 'Alert resolved')}>Resolve</Button>
          </div>
          <Field label="Add specialist note" htmlFor="alert-note" hint="Notes are stored with the alert with your demo role and time.">
            <Textarea id="alert-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="e.g. Reviewed measurement history with the rehabilitation team; repeat assessment scheduled." />
          </Field>
          <div className="flex flex-wrap justify-between gap-2">
            <Button size="sm" variant="secondary" icon={MessageSquarePlus} disabled={!note.trim()} loading={busy} onClick={() => update({ specialistNote: note.trim() }, 'Note added')}>Save note</Button>
            {can('alerts:delete') && <Button size="sm" variant="danger" icon={Trash2} onClick={() => setConfirmDelete(true)}>Delete alert</Button>}
          </div>
        </div>
      )}

      {alert.specialistNotes?.length > 0 && (
        <div className="border-t border-slate-700/40 pt-4">
          <p className="label-muted mb-2">Specialist notes</p>
          <ul className="flex flex-col gap-2">
            {alert.specialistNotes.map((n) => (
              <li key={n.id} className="rounded-lg bg-space-900/60 p-3 text-sm text-slate-200">
                <p>{n.text}</p>
                <p className="mt-1 text-[11px] text-slate-500">{n.role} · {formatDateTime(n.at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this alert?"
        message="The alert and its notes will be removed from storage. This cannot be undone."
        confirmLabel="Delete alert"
        loading={busy}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
