import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { Field, Input, Select, Textarea } from '../common/Input.jsx';
import { exerciseService } from '../../services/exerciseService.js';
import { exerciseFormSchema } from '../../utils/validators.js';
import { CATEGORIES, EQUIPMENT, PHASES, COMPLETION } from '../../utils/constants.js';
import { isoDay } from '../../utils/formatters.js';
import { useAppContext } from '../../context/AppContext.jsx';

const FIELDS_BY_CATEGORY = {
  'resistance-training': ['resistanceKg', 'sets', 'repetitions'],
  treadmill: ['speedKph', 'harnessLoadN'],
  'cycle-ergometer': ['workloadW', 'distanceKm'],
  functional: ['movementPerformanceScore'],
};
const ALL_NUMERIC = ['resistanceKg', 'sets', 'repetitions', 'speedKph', 'harnessLoadN', 'workloadW', 'distanceKm', 'movementPerformanceScore'];

const blank = (astronautId, phase) => ({
  astronautId: astronautId && astronautId !== 'all' ? astronautId : '',
  sessionDate: new Date().toISOString().slice(0, 10),
  missionPhase: phase && phase !== 'all' ? phase : 'in-flight',
  category: 'resistance-training',
  equipment: 'ARED',
  prescribed: true,
  completionStatus: 'completed',
  durationMinutes: '',
  resistanceKg: '', sets: '', repetitions: '', speedKph: '', harnessLoadN: '', workloadW: '', distanceKm: '', movementPerformanceScore: '',
  notes: '',
});

/** Add / edit exercise record. Only fields relevant to the chosen category are shown and saved. */
export default function ExerciseForm({ open, onClose, record, astronautId = 'all', onSaved }) {
  const { astronauts, filters, notifyDataChanged } = useAppContext();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: blank(astronautId, filters.missionPhase),
  });
  const category = watch('category');
  const completion = watch('completionStatus');
  const equipmentOptions = useMemo(() => CATEGORIES.find((c) => c.value === category)?.equipment ?? [], [category]);
  const relevant = FIELDS_BY_CATEGORY[category] ?? [];

  useEffect(() => {
    if (!open) return;
    if (record) {
      const values = { ...blank(record.astronautId, record.missionPhase), ...record, sessionDate: isoDay(record.sessionDate) };
      ALL_NUMERIC.forEach((k) => { values[k] = record[k] ?? ''; });
      values.durationMinutes = record.durationMinutes ?? '';
      values.notes = record.notes ?? '';
      reset(values);
    } else {
      reset(blank(astronautId, filters.missionPhase));
    }
  }, [open, record, astronautId, filters.missionPhase, reset]);

  // Keep equipment valid when the category changes.
  useEffect(() => {
    if (!equipmentOptions.includes(watch('equipment'))) setValue('equipment', equipmentOptions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const submit = async (values) => {
    const payload = {
      astronautId: values.astronautId,
      sessionDate: new Date(values.sessionDate).toISOString(),
      missionPhase: values.missionPhase,
      category: values.category,
      equipment: values.equipment,
      prescribed: values.prescribed,
      completionStatus: values.completionStatus,
      durationMinutes: values.completionStatus === 'missed' ? null : values.durationMinutes,
      notes: values.notes || null,
    };
    // Only send metrics relevant to this category; others are cleared rather than stored as zero.
    ALL_NUMERIC.forEach((k) => { payload[k] = FIELDS_BY_CATEGORY[values.category].includes(k) && values.completionStatus !== 'missed' ? values[k] : null; });
    try {
      const res = record ? await exerciseService.update(record.id, payload) : await exerciseService.create(payload);
      toast.success(record ? 'Exercise record updated' : 'Exercise record saved');
      notifyDataChanged();
      onSaved?.(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const num = (name, label, step = 'any', hint) => (
    <Field key={name} label={label} htmlFor={`ex-${name}`} error={errors[name]?.message} hint={hint}>
      <Input id={`ex-${name}`} type="number" step={step} inputMode="decimal" error={errors[name]} disabled={completion === 'missed'} {...register(name)} />
    </Field>
  );

  const NUMERIC_LABELS = {
    resistanceKg: ['Resistance (kg)', 'Resistance setting as recorded for the device.'],
    sets: ['Sets', null],
    repetitions: ['Repetitions', null],
    speedKph: ['Speed (km/h)', null],
    harnessLoadN: ['Harness loading (N)', 'Harness loading as recorded; unit confirmed by the exercise team.'],
    workloadW: ['Workload (W)', null],
    distanceKm: ['Distance (km)', null],
    movementPerformanceScore: ['Movement performance score (0–100)', 'Score from the local functional task protocol.'],
  };

  return (
    <Modal open={open} onClose={onClose} title={record ? 'Edit exercise record' : 'Add exercise record'} subtitle="Prescribed and completed sessions drive adherence." size="lg" footer={(
      <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="exercise-form" loading={isSubmitting}>{record ? 'Save changes' : 'Save record'}</Button></>
    )}>
      <form id="exercise-form" onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Astronaut" htmlFor="ex-astronautId" error={errors.astronautId?.message} className="sm:col-span-2">
          <Select id="ex-astronautId" error={errors.astronautId} {...register('astronautId')}>
            <option value="">Select an astronaut…</option>
            {astronauts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
          </Select>
        </Field>
        <Field label="Session date" htmlFor="ex-sessionDate" error={errors.sessionDate?.message}><Input id="ex-sessionDate" type="date" error={errors.sessionDate} {...register('sessionDate')} /></Field>
        <Field label="Mission phase" htmlFor="ex-phase" error={errors.missionPhase?.message}><Select id="ex-phase" {...register('missionPhase')}>{PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>
        <Field label="Exercise category" htmlFor="ex-category" error={errors.category?.message}><Select id="ex-category" {...register('category')}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select></Field>
        <Field label="Equipment" htmlFor="ex-equipment" error={errors.equipment?.message}><Select id="ex-equipment" error={errors.equipment} {...register('equipment')}>{EQUIPMENT.filter((e) => equipmentOptions.includes(e.value)).map((e) => <option key={e.value} value={e.value}>{e.label} · {e.full}</option>)}</Select></Field>
        <Field label="Completion status" htmlFor="ex-completion" error={errors.completionStatus?.message}><Select id="ex-completion" {...register('completionStatus')}>{COMPLETION.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select></Field>
        <Field label="Duration (minutes)" htmlFor="ex-duration" error={errors.durationMinutes?.message}><Input id="ex-duration" type="number" step="any" error={errors.durationMinutes} disabled={completion === 'missed'} {...register('durationMinutes')} /></Field>
        <label className="flex items-center gap-3 self-end rounded-xl border border-slate-700/60 bg-space-900/60 px-3 py-2.5 text-sm text-slate-200">
          <input type="checkbox" className="h-4 w-4 accent-cyan-400" {...register('prescribed')} />
          Session was prescribed (counts toward adherence)
        </label>

        <div className="sm:col-span-2 grid gap-4 rounded-xl border border-cyan-400/15 bg-accent/5 p-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wider text-cyan-200">Fields for {CATEGORIES.find((c) => c.value === category)?.label}</p>
          {relevant.map((k) => num(k, NUMERIC_LABELS[k][0], k === 'sets' || k === 'repetitions' ? '1' : 'any', NUMERIC_LABELS[k][1]))}
        </div>

        <Field label="Notes" htmlFor="ex-notes" error={errors.notes?.message} className="sm:col-span-2"><Textarea id="ex-notes" error={errors.notes} {...register('notes')} /></Field>
      </form>
    </Modal>
  );
}
