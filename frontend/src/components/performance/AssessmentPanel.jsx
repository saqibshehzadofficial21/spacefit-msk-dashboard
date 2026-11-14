import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { baselineService, performanceService } from '../../services/assessmentService.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAppContext } from '../../context/AppContext.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import ErrorState from '../common/ErrorState.jsx';
import { Field, Select } from '../common/Input.jsx';
import AssessmentForm from './AssessmentForm.jsx';
import PerformanceHistory from './PerformanceHistory.jsx';
import PerformanceComparison from './PerformanceComparison.jsx';
import { formatDate } from '../../utils/formatters.js';

/**
 * Baseline records for one astronaut, plus a comparison of any baseline against any later measurement.
 * The astronaut is fixed by the caller, so cross-astronaut comparison is impossible from this panel.
 */
export default function AssessmentPanel({ astronautId }) {
  const { can, notifyDataChanged } = useAppContext();
  const [formState, setFormState] = useState({ open: false, record: null });
  const [baselineId, setBaselineId] = useState('');
  const [currentId, setCurrentId] = useState('');

  const baselines = useFetch(() => baselineService.history(astronautId), [astronautId]);
  const measurements = useFetch(() => performanceService.history(astronautId), [astronautId]);

  const baselineRows = baselines.data ?? [];
  const measurementRows = useMemo(() => [...(measurements.data ?? [])].reverse(), [measurements.data]);
  const baseline = baselineRows.find((b) => b.id === baselineId) ?? baselineRows[0] ?? null;
  const current = measurementRows.find((m) => m.id === currentId) ?? measurementRows[0] ?? null;

  if (baselines.error) return <ErrorState message={baselines.error} onRetry={baselines.reload} />;

  return (
    <div className="flex flex-col gap-5">
      <Card
        title="Baseline assessments"
        subtitle="Individual reference values. Each baseline belongs to one astronaut and is never shared."
        actions={can('baselines:write') ? <Button icon={Plus} onClick={() => setFormState({ open: true, record: null })}>Record baseline</Button> : null}
      >
        <PerformanceHistory
          records={baselineRows}
          loading={baselines.loading}
          canEdit={can('baselines:write')}
          onEdit={(r) => setFormState({ open: true, record: r })}
        />
      </Card>

      <Card title="Compare against baseline" subtitle="Choose any baseline and any later measurement for this astronaut.">
        {!baselineRows.length && !measurementRows.length ? (
          <p className="text-sm text-slate-400">No baseline or measurements yet for this astronaut.</p>
        ) : (
          <>
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <Field label="Baseline record" htmlFor="cmp-base">
                <Select id="cmp-base" value={baseline?.id ?? ''} onChange={(e) => setBaselineId(e.target.value)} disabled={!baselineRows.length}>
                  {baselineRows.length === 0 && <option value="">No baseline recorded</option>}
                  {baselineRows.map((b) => <option key={b.id} value={b.id}>{formatDate(b.assessmentDate)} · {b.missionPhase}</option>)}
                </Select>
              </Field>
              <Field label="Measurement to compare" htmlFor="cmp-current">
                <Select id="cmp-current" value={current?.id ?? ''} onChange={(e) => setCurrentId(e.target.value)} disabled={!measurementRows.length}>
                  {measurementRows.length === 0 && <option value="">No measurements recorded</option>}
                  {measurementRows.map((m) => <option key={m.id} value={m.id}>{formatDate(m.assessmentDate)} · {m.missionPhase}</option>)}
                </Select>
              </Field>
            </div>
            <PerformanceComparison baseline={baseline} current={current} />
          </>
        )}
      </Card>

      <AssessmentForm
        open={formState.open}
        mode="baseline"
        record={formState.record}
        astronautId={astronautId}
        onClose={() => setFormState({ open: false, record: null })}
        onSaved={() => { setFormState({ open: false, record: null }); baselines.reload(); measurements.reload(); notifyDataChanged(); }}
      />
    </div>
  );
}
