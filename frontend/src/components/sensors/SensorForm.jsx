import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { Field, Input, Select, Textarea } from '../common/Input.jsx';
import { sensorService } from '../../services/sensorService.js';
import { sensorFormSchema } from '../../utils/validators.js';
import { SENSOR_TYPES, PHASES } from '../../utils/constants.js';
import { useAppContext } from '../../context/AppContext.jsx';

const localInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

/** Manual sensor entry. Stored with dataSource 'manual'. The unit is set by the catalogue, not typed. */
export default function SensorForm({ open, onClose, record, astronautId = 'all', onSaved }) {
  const { astronauts, filters, notifyDataChanged } = useAppContext();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(sensorFormSchema),
    defaultValues: { astronautId: '', sensorType: 'FORCE', metric: 'appliedForce', value: '', timestamp: localInput(new Date().toISOString()), missionPhase: 'in-flight', exerciseSessionId: '', notes: '' },
  });
  const sensorType = watch('sensorType');
  const metric = watch('metric');
  const metricOptions = useMemo(() => Object.entries(SENSOR_TYPES[sensorType]?.metrics ?? {}), [sensorType]);
  const unit = SENSOR_TYPES[sensorType]?.metrics[metric]?.[1] ?? '';

  useEffect(() => {
    if (!open) return;
    if (record) {
      reset({ astronautId: record.astronautId, sensorType: record.sensorType, metric: record.metric, value: record.value, timestamp: localInput(record.timestamp), missionPhase: record.missionPhase, exerciseSessionId: record.exerciseSessionId ?? '', notes: record.notes ?? '' });
    } else {
      reset({ astronautId: astronautId !== 'all' ? astronautId : '', sensorType: 'FORCE', metric: 'appliedForce', value: '', timestamp: localInput(new Date().toISOString()), missionPhase: filters.missionPhase !== 'all' ? filters.missionPhase : 'in-flight', exerciseSessionId: '', notes: '' });
    }
  }, [open, record, astronautId, filters.missionPhase, reset]);

  useEffect(() => {
    if (!metricOptions.some(([k]) => k === metric)) setValue('metric', metricOptions[0]?.[0] ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorType]);

  const submit = async (values) => {
    const payload = {
      astronautId: values.astronautId,
      sensorType: values.sensorType,
      metric: values.metric,
      value: Number(values.value),
      timestamp: new Date(values.timestamp).toISOString(),
      missionPhase: values.missionPhase,
      exerciseSessionId: values.exerciseSessionId || null,
      notes: values.notes || null,
      sourceType: 'manual',
    };
    try {
      const res = record ? await sensorService.update(record.id, { value: payload.value, timestamp: payload.timestamp, missionPhase: payload.missionPhase, exerciseSessionId: payload.exerciseSessionId, notes: payload.notes }) : await sensorService.create(payload);
      toast.success(record ? 'Sensor measurement updated' : 'Sensor measurement saved');
      notifyDataChanged();
      onSaved?.(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={record ? 'Edit sensor measurement' : 'Add sensor measurement'} subtitle="Manual entry. The record is labelled MANUAL and keeps its timestamp and mission phase." size="lg" footer={(
      <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="sensor-form" loading={isSubmitting}>{record ? 'Save changes' : 'Save measurement'}</Button></>
    )}>
      <form id="sensor-form" onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Astronaut" htmlFor="sf-ast" error={errors.astronautId?.message} className="sm:col-span-2">
          <Select id="sf-ast" error={errors.astronautId} disabled={!!record} {...register('astronautId')}><option value="">Select an astronaut…</option>{astronauts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}</Select>
        </Field>
        <Field label="Sensor type" htmlFor="sf-type" error={errors.sensorType?.message}><Select id="sf-type" disabled={!!record} {...register('sensorType')}>{Object.entries(SENSOR_TYPES).map(([k, v]) => <option key={k} value={k}>{k} · {v.label}</option>)}</Select></Field>
        <Field label="Metric" htmlFor="sf-metric" error={errors.metric?.message}><Select id="sf-metric" disabled={!!record} {...register('metric')}>{metricOptions.map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}</Select></Field>
        <Field label={`Measurement value${unit ? ` (${unit})` : ''}`} htmlFor="sf-value" error={errors.value?.message}><Input id="sf-value" type="number" step="any" error={errors.value} {...register('value')} /></Field>
        <Field label="Measurement timestamp" htmlFor="sf-ts" error={errors.timestamp?.message}><Input id="sf-ts" type="datetime-local" error={errors.timestamp} {...register('timestamp')} /></Field>
        <Field label="Mission phase" htmlFor="sf-phase" error={errors.missionPhase?.message}><Select id="sf-phase" {...register('missionPhase')}>{PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>
        <Field label="Associated exercise session ID (optional)" htmlFor="sf-session" error={errors.exerciseSessionId?.message}><Input id="sf-session" placeholder="EXR-…" error={errors.exerciseSessionId} {...register('exerciseSessionId')} /></Field>
        <Field label="Notes" htmlFor="sf-notes" error={errors.notes?.message} className="sm:col-span-2"><Textarea id="sf-notes" error={errors.notes} {...register('notes')} /></Field>
      </form>
    </Modal>
  );
}
