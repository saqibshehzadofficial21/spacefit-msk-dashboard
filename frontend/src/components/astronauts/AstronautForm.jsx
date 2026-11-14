import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { Field, Input, Select, Textarea } from '../common/Input.jsx';
import { astronautService } from '../../services/astronautService.js';
import { astronautFormSchema } from '../../utils/validators.js';
import { PHASES, STATUS_OPTIONS } from '../../utils/constants.js';
import { useAppContext } from '../../context/AppContext.jsx';

const DEFAULTS = { name: '', missionId: '', missionPhase: 'preflight', status: 'active', notes: '' };

/** Create or edit an astronaut. Stored as a manual record. Demonstration records are labelled in the table. */
export default function AstronautForm({ open, onClose, astronaut, onSaved }) {
  const { missions, notifyDataChanged } = useAppContext();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(astronautFormSchema), defaultValues: DEFAULTS });

  useEffect(() => {
    if (!open) return;
    reset(astronaut ? { name: astronaut.name, missionId: astronaut.missionId, missionPhase: astronaut.missionPhase, status: astronaut.status, notes: astronaut.notes ?? '' } : { ...DEFAULTS, missionId: missions[0]?.id ?? '' });
  }, [open, astronaut, missions, reset]);

  const submit = async (values) => {
    try {
      const res = astronaut ? await astronautService.update(astronaut.id, values) : await astronautService.create(values);
      toast.success(astronaut ? 'Astronaut updated' : `Astronaut ${res.data.id} created`);
      notifyDataChanged();
      onSaved?.(res.data);
    } catch (err) {
      toast.error(err.details?.length ? err.details.join(' · ') : err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={astronaut ? `Edit ${astronaut.name}` : 'Add astronaut'} subtitle="Use fictional names for demonstration. Real personal data should not be entered into this prototype." size="lg" footer={(
      <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="astronaut-form" loading={isSubmitting}>{astronaut ? 'Save changes' : 'Create astronaut'}</Button></>
    )}>
      <form id="astronaut-form" onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Full name" htmlFor="af-name" error={errors.name?.message} className="sm:col-span-2"><Input id="af-name" autoComplete="off" error={errors.name} {...register('name')} /></Field>
        <Field label="Mission" htmlFor="af-mission" error={errors.missionId?.message}>
          <Select id="af-mission" error={errors.missionId} {...register('missionId')}>
            <option value="">Select a mission…</option>
            {missions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </Field>
        <Field label="Mission phase" htmlFor="af-phase" error={errors.missionPhase?.message}>
          <Select id="af-phase" {...register('missionPhase')}>{PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select>
        </Field>
        <Field label="Current status" htmlFor="af-status" error={errors.status?.message}>
          <Select id="af-status" {...register('status')}>{STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select>
        </Field>
        <Field label="Notes" htmlFor="af-notes" error={errors.notes?.message} className="sm:col-span-2"><Textarea id="af-notes" error={errors.notes} {...register('notes')} /></Field>
      </form>
    </Modal>
  );
}
