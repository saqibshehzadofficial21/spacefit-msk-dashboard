import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileBarChart } from 'lucide-react';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import { Field, Input, Select } from '../common/Input.jsx';
import { reportFormSchema } from '../../utils/validators.js';
import { REPORT_TYPES, PHASES, CATEGORIES, EQUIPMENT, METRICS, METRIC_KEYS } from '../../utils/constants.js';
import { useAppContext } from '../../context/AppContext.jsx';

/** Report filters. The metric filter lists performance metrics, and sensor metrics are chosen by the sensor report type. */
export default function ReportFilters({ initial, onGenerate, generating }) {
  const { astronauts, missions } = useAppContext();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { reportType: 'muscle-performance', astronautId: 'all', missionId: 'all', missionPhase: 'all', startDate: '', endDate: '', equipment: 'all', category: 'all', metric: 'all', title: '', ...initial },
  });
  const reportType = watch('reportType');
  const showEquipment = ['exercise-history', 'exercise-adherence'].includes(reportType);
  const showMetric = ['muscle-performance', 'baseline-comparison', 'sensor-measurements'].includes(reportType);

  const submit = (values) => onGenerate({
    ...values,
    astronautId: values.astronautId === 'all' ? null : values.astronautId,
    missionId: values.missionId === 'all' ? null : values.missionId,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    title: values.title || null,
  });

  return (
    <Card title="Report filters" subtitle="Only stored records (or clearly labelled simulated data) are included." actions={null}>
      <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" noValidate>
        <Field label="Report type" htmlFor="rp-type" error={errors.reportType?.message} className="sm:col-span-2 xl:col-span-3">
          <Select id="rp-type" {...register('reportType')}>{REPORT_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select>
        </Field>
        <Field label="Astronaut" htmlFor="rp-ast"><Select id="rp-ast" {...register('astronautId')}><option value="all">All astronauts</option>{astronauts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
        <Field label="Mission" htmlFor="rp-mis"><Select id="rp-mis" {...register('missionId')}><option value="all">All missions</option>{missions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>
        <Field label="Mission phase" htmlFor="rp-phase"><Select id="rp-phase" {...register('missionPhase')}><option value="all">All phases</option>{PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>
        <Field label="Start date" htmlFor="rp-start" error={errors.startDate?.message}><Input id="rp-start" type="date" {...register('startDate')} /></Field>
        <Field label="End date" htmlFor="rp-end" error={errors.endDate?.message}><Input id="rp-end" type="date" {...register('endDate')} /></Field>
        {showEquipment && (
          <>
            <Field label="Equipment type" htmlFor="rp-eq"><Select id="rp-eq" {...register('equipment')}><option value="all">All equipment</option>{EQUIPMENT.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}</Select></Field>
            <Field label="Exercise category" htmlFor="rp-cat"><Select id="rp-cat" {...register('category')}><option value="all">All categories</option>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select></Field>
          </>
        )}
        {showMetric && (
          <Field label="Metric type" htmlFor="rp-metric" hint="Applies to muscle-performance, baseline and sensor reports.">
            <Select id="rp-metric" {...register('metric')}><option value="all">All performance metrics</option>{METRIC_KEYS.map((k) => <option key={k} value={k}>{METRICS[k].label}</option>)}</Select>
          </Field>
        )}
        <Field label="Report title (optional)" htmlFor="rp-title" error={errors.title?.message} className="sm:col-span-2 xl:col-span-3"><Input id="rp-title" placeholder="Leave blank for the standard title" {...register('title')} /></Field>
        <div className="sm:col-span-2 xl:col-span-3 flex justify-end">
          <Button type="submit" icon={FileBarChart} loading={generating}>Generate report</Button>
        </div>
      </form>
    </Card>
  );
}
