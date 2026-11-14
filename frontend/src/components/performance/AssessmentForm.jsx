import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { Field, Input, Select, Textarea } from '../common/Input.jsx';
import { baselineService, performanceService } from '../../services/assessmentService.js';
import { assessmentFormSchema } from '../../utils/validators.js';
import { METRICS, PHASES } from '../../utils/constants.js';
import { isoDay } from '../../utils/formatters.js';
import { useAppContext } from '../../context/AppContext.jsx';

const FUNCTIONAL = [
  { value: 'not-assessed', label: 'Not assessed' },
  { value: 'completed', label: 'Completed' },
  { value: 'partially-completed', label: 'Partially completed' },
  { value: 'not-completed', label: 'Not completed' },
];
const METRIC_FIELDS = ['forceProduction', 'movementVelocity', 'jointROM', 'repetitionPerformance', 'movementConsistency', 'functionalScore'];

const emptyValues = (astronautId, phase, mode) => ({
  astronautId: astronautId && astronautId !== 'all' ? astronautId : '',
  assessmentDate: new Date().toISOString().slice(0, 10),
  missionPhase: mode === 'baseline' ? 'preflight' : phase && phase !== 'all' ? phase : 'in-flight',
  forceProduction: '', movementVelocity: '', jointROM: '', repetitionPerformance: '', movementConsistency: '', functionalScore: '',
  functionalResult: 'not-assessed',
  notes: '',
});

/**
 * Shared form for baseline assessments (individual reference values) and performance assessments
 * (later measurements). Unmeasured metrics are left empty and stored as null, never zero.
 */
export default function AssessmentForm({ open, onClose, mode = 'performance', record, astronautId = 'all', onSaved }) {
  const { astronauts, filters, notifyDataChanged } = useAppContext();
  const service = mode === 'baseline' ? baselineService : performanceService;
  const label = mode === 'baseline' ? 'baseline assessment' : 'performance assessment';
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: emptyValues(astronautId, filters.missionPhase, mode),
  });

  useEffect(() => {
    if (!open) return;
    if (record) {
      const values = { ...emptyValues(record.astronautId, record.missionPhase, mode), astronautId: record.astronautId, missionPhase: record.missionPhase, assessmentDate: isoDay(record.assessmentDate), functionalResult: record.functionalResult ?? 'not-assessed', notes: record.notes ?? '' };
      METRIC_FIELDS.forEach((k) => { values[k] = record[k] ?? ''; });
      reset(values);
    } else {
      reset(emptyValues(astronautId, filters.missionPhase, mode));
    }
  }, [open, record, astronautId, filters.missionPhase, mode, reset]);

  const submit = async (values) => {
    const payload = {
      astronautId: values.astronautId,
      assessmentDate: new Date(values.assessmentDate).toISOString(),
      missionPhase: values.missionPhase,
      functionalResult: values.functionalResult,
      notes: values.notes || null,
    };
    METRIC_FIELDS.forEach((k) => { payload[k] = values[k] === '' || values[k] === undefined ? null : values[k]; });
    try {
      const res = record ? await service.update(record.id, payload) : await service.create(payload);
      toast.success(`${mode === 'baseline' ? 'Baseline' : 'Performance'} ${record ? 'updated' : 'saved'}`);
      notifyDataChanged();
      onSaved?.(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={record ? `Edit ${label}` : mode === 'baseline' ? 'Record baseline assessment' : 'Record performance assessment'}
      subtitle={mode === 'baseline' ? 'Individual reference values for this astronaut. Compare later measurements against these.' : 'Measurements are compared with this astronaut’s own baseline.'}
      size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="assessment-form" loading={isSubmitting}>{record ? 'Save changes' : 'Save assessment'}</Button></>}
    >
      <form id="assessment-form" onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Astronaut" htmlFor="as-ast" error={errors.astronautId?.message} className="sm:col-span-2">
          <Select id="as-ast" error={errors.astronautId} disabled={!!record} {...register('astronautId')}>
            <option value="">Select an astronaut…</option>
            {astronauts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
          </Select>
        </Field>
        <Field label="Assessment date" htmlFor="as-date" error={errors.assessmentDate?.message}><Input id="as-date" type="date" error={errors.assessmentDate} {...register('assessmentDate')} /></Field>
        <Field label="Mission phase" htmlFor="as-phase" error={errors.missionPhase?.message}><Select id="as-phase" {...register('missionPhase')}>{PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>

        <fieldset className="sm:col-span-2 grid gap-4 rounded-xl border border-cyan-400/15 bg-accent/5 p-4 sm:grid-cols-2">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">Measurements (leave blank if not measured)</legend>
          {METRIC_FIELDS.map((k) => (
            <Field key={k} label={`${METRICS[k].label} (${METRICS[k].unit})`} htmlFor={`as-${k}`} error={errors[k]?.message} hint={METRICS[k].measurement}>
              <Input id={`as-${k}`} type="number" step="any" inputMode="decimal" error={errors[k]} {...register(k)} />
            </Field>
          ))}
          {errors.forceProduction?.message && !METRIC_FIELDS.some((k) => errors[k]) && <p role="alert" className="sm:col-span-2 text-xs text-red-300">{errors.forceProduction.message}</p>}
        </fieldset>

        <Field label="Functional assessment result" htmlFor="as-func" error={errors.functionalResult?.message}><Select id="as-func" {...register('functionalResult')}>{FUNCTIONAL.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</Select></Field>
        <Field label="Notes" htmlFor="as-notes" error={errors.notes?.message} className="sm:col-span-2"><Textarea id="as-notes" error={errors.notes} {...register('notes')} /></Field>
      </form>
    </Modal>
  );
}
