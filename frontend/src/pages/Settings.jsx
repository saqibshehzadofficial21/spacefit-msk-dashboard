import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { Field, Input, Select } from '../components/common/Input.jsx';
import { Skeleton } from '../components/common/LoadingSpinner.jsx';
import { settingsService } from '../services/settingsService.js';
import { missionService } from '../services/missionService.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAppContext } from '../context/AppContext.jsx';
import { missionFormSchema } from '../utils/validators.js';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../utils/permissions.js';
import { formatDateTime, formatDate, isoDay } from '../utils/formatters.js';

const THRESHOLD_FIELDS = [
  ['forceProduction', 'Force production change (%)', 'percentChange', 'Breach when change is below this value.'],
  ['movementVelocity', 'Movement velocity change (%)', 'percentChange', 'Breach when change is below this value.'],
  ['jointROM', 'Joint range of motion change (%)', 'percentChange', 'Breach when change is below this value.'],
  ['repetitionPerformance', 'Repetition performance change (%)', 'percentChange', 'Breach when change is below this value.'],
  ['movementConsistency', 'Movement consistency change (points)', 'pointsChange', 'Points, not percent. Breach when change is below this value.'],
  ['functionalScore', 'Functional score change (%)', 'percentChange', 'Breach when change is below this value.'],
  ['loadingChange', 'Loading change (±%)', 'percentChange', 'Breach when the absolute change exceeds this value.'],
];

export default function Settings() {
  const { can, role, roleLabel, setRole, notifyDataChanged, dataVersion } = useAppContext();
  const isAdmin = can('*');
  const settings = useFetch(() => settingsService.get(), [dataVersion]);
  const users = useFetch(() => settingsService.users(), [dataVersion]);
  const audit = useFetch(() => settingsService.audit(50), [dataVersion], { enabled: can('audit:read') });
  const missions = useFetch(() => missionService.list(), [dataVersion]);
  const [saving, setSaving] = useState(false);
  const [missionModal, setMissionModal] = useState(null);

  if (settings.error) return <ErrorState message={settings.error} onRetry={settings.reload} />;
  if (!settings.data) return <Skeleton className="h-96" />;
  const s = settings.data;

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Prototype configuration. Thresholds are configurable sample logic for demonstration and are not clinical limits."
        breadcrumbs={[{ label: 'Settings' }]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <ProfileForm settings={s} isAdmin={isAdmin} saving={saving} setSaving={setSaving} onSaved={() => { settings.reload(); notifyDataChanged(); }} />

        <Card title="Demo role and access" subtitle="Role switching is for demonstration only. It is not authentication.">
          <div className="flex flex-col gap-4 text-sm">
            <Field label="Demo role" htmlFor="role-select" hint="Sent as x-demo-role on each request. Not a secure login.">
              <Select id="role-select" value={role} onChange={(e) => setRole(e.target.value)}>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            <p className="text-slate-300">Current role: <strong className="text-white">{roleLabel}</strong>. {ROLE_DESCRIPTIONS[role]}</p>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-white">Demo users (fictional)</h3>
              <ul className="flex flex-col gap-2">
                {(users.data ?? []).map((u) => (
                  <li key={u.id} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-space-900/40 px-3 py-2">
                    <span className="text-slate-200">{u.displayName ?? u.name ?? u.id}</span>
                    <StatusBadge tone="violet">{ROLE_LABELS[u.role] ?? u.role}</StatusBadge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ThresholdsForm settings={s} isAdmin={isAdmin} onSaved={() => { settings.reload(); notifyDataChanged(); }} />

        <Card title="System information" subtitle="Live status reported by the backend.">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Info k="API status" v={s.system.apiStatus} />
            <Info k="Node.js" v={s.system.nodeVersion} />
            <Info k="Storage" v={s.system.storage?.healthy ? 'Healthy (JSON files)' : 'Problem: see details'} />
            <Info k="Data directory" v={s.system.storage?.dataDir ?? '—'} />
            <Info k="Analysis layer 1" v={s.system.analysis?.layer1} />
            <Info k="Analysis layer 2" v={s.system.analysis?.layer2} />
            <Info k="Server time" v={formatDateTime(s.system.serverTime)} />
          </dl>
          <h3 className="mb-2 mt-5 text-sm font-semibold text-white">Sensor adapters</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {s.system.sensorAdapters.map((a) => (
              <li key={a.name} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-space-900/40 px-3 py-2">
                <span className="text-slate-200">{a.name}</span>
                <span className="text-xs text-slate-400">{a.status ?? a.dataSource}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card
          title="Missions"
          subtitle="Fictional demonstration missions."
          actions={isAdmin && <Button size="sm" icon={Plus} onClick={() => setMissionModal({})}>Add mission</Button>}
        >
          <ul className="flex flex-col gap-2 text-sm">
            {(missions.data ?? []).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/50 bg-space-900/40 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{m.name}</p>
                  <p className="text-xs text-slate-400">{m.code} · starts {formatDate(m.startDate)} · {m.status}</p>
                </div>
                {isAdmin && <Button size="sm" variant="ghost" icon={Pencil} aria-label={`Edit ${m.name}`} onClick={() => setMissionModal(m)} />}
              </li>
            ))}
            {missions.data?.length === 0 && <li className="text-slate-400">No missions yet.</li>}
          </ul>
        </Card>

        <Card title="Audit trail" subtitle="Recent changes made through the API (newest first).">
          {!can('audit:read') ? <p className="text-sm text-slate-400">Your role cannot view the audit trail.</p> : (
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              <ul className="flex flex-col divide-y divide-slate-800/80 text-xs">
                {(audit.data ?? []).map((e) => (
                  <li key={e.id} className="py-2">
                    <p className="text-slate-200">{e.summary}</p>
                    <p className="text-slate-500">{formatDateTime(e.timestamp)} · {ROLE_LABELS[e.role] ?? e.role} · {e.action} {e.entity}</p>
                  </li>
                ))}
                {audit.data?.length === 0 && <li className="py-2 text-slate-400">No audit entries.</li>}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <MissionModal state={missionModal} onClose={() => setMissionModal(null)} onSaved={() => { setMissionModal(null); missions.reload(); notifyDataChanged(); }} />
    </>
  );
}

function Info({ k, v }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-space-900/40 p-3">
      <dt className="label-muted">{k}</dt>
      <dd className="mt-1 break-words text-slate-100">{v}</dd>
    </div>
  );
}

function ProfileForm({ settings, isAdmin, saving, setSaving, onSaved }) {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      displayName: settings.profile.displayName,
      defaultMissionPhase: settings.preferences.defaultMissionPhase,
      defaultDateRangeDays: settings.preferences.defaultDateRangeDays,
      compactTables: settings.preferences.compactTables,
      minimumSeverity: settings.notifications.minimumSeverity,
      showToasts: settings.notifications.showToasts,
    },
  });
  const submit = async (values) => {
    setSaving(true);
    try {
      await settingsService.update({
        profile: { displayName: values.displayName },
        preferences: { defaultMissionPhase: values.defaultMissionPhase, defaultDateRangeDays: Number(values.defaultDateRangeDays), compactTables: !!values.compactTables },
        notifications: { minimumSeverity: values.minimumSeverity, showToasts: !!values.showToasts },
      });
      toast.success('Preferences saved');
      onSaved();
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card title="Profile and preferences" subtitle={`Organisation: ${settings.profile.organisation}`}>
      <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Display name" htmlFor="set-name" error={errors.displayName?.message} className="sm:col-span-2">
          <Input id="set-name" {...register('displayName', { required: 'Enter a display name', maxLength: { value: 80, message: 'Maximum 80 characters' } })} />
        </Field>
        <Field label="Default mission phase" htmlFor="set-phase">
          <Select id="set-phase" {...register('defaultMissionPhase')}>
            <option value="all">All phases</option><option value="preflight">Preflight</option><option value="in-flight">In-flight</option><option value="postflight">Postflight</option>
          </Select>
        </Field>
        <Field label="Default date range (days)" htmlFor="set-days" hint="Used as the starting view for trend pages.">
          <Input id="set-days" type="number" min={1} max={730} {...register('defaultDateRangeDays', { valueAsNumber: true, min: 1, max: 730 })} />
        </Field>
        <Field label="Minimum alert severity" htmlFor="set-sev">
          <Select id="set-sev" {...register('minimumSeverity')}>
            <option value="normal">Normal and above</option><option value="info">Info and above</option><option value="attention">Attention and above</option><option value="critical">Critical only</option>
          </Select>
        </Field>
        <div className="flex flex-col gap-3 self-end text-sm text-slate-200">
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-cyan-400" {...register('compactTables')} />Compact tables</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-cyan-400" {...register('showToasts')} />Show notification toasts</label>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" icon={Save} loading={saving} disabled={!isDirty}>Save preferences</Button>
        </div>
        {!isAdmin && <p className="sm:col-span-2 text-xs text-slate-500">Changing thresholds requires the Administrator demo role.</p>}
      </form>
    </Card>
  );
}

function ThresholdsForm({ settings, isAdmin, onSaved }) {
  const t = settings.thresholds;
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      ...Object.fromEntries(THRESHOLD_FIELDS.map(([key, , prop]) => [key, t[key][prop]])),
      adherenceMinimum: t.adherence.minimumPercent,
      adherenceWindow: t.adherence.windowDays,
      adherenceMissed: t.adherence.consecutiveMissedSessions,
      persistent: t.persistentAssessments,
    },
  });
  const submit = async (v) => {
    setSaving(true);
    try {
      const num = (x) => Number(x);
      const payload = {
        ...Object.fromEntries(THRESHOLD_FIELDS.map(([key, , prop]) => [key, { [prop]: num(v[key]) }])),
        adherence: { minimumPercent: num(v.adherenceMinimum), windowDays: num(v.adherenceWindow), consecutiveMissedSessions: num(v.adherenceMissed) },
        persistentAssessments: num(v.persistent),
      };
      await settingsService.update({ thresholds: payload });
      toast.success('Sample thresholds saved');
      onSaved();
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card title="Sample analysis thresholds" subtitle="Configurable demonstration logic.">
      <div role="note" className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-100">{t.thresholdsNotice}</div>
      <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        {THRESHOLD_FIELDS.map(([key, label, prop, hint]) => (
          <Field key={key} label={label} htmlFor={`th-${key}`} hint={hint}>
            <Input id={`th-${key}`} type="number" step="0.5" disabled={!isAdmin} {...register(key, { valueAsNumber: true })} />
          </Field>
        ))}
        <Field label="Adherence minimum (%)" htmlFor="th-adm" hint="Below this, adherence is flagged.">
          <Input id="th-adm" type="number" min={0} max={100} disabled={!isAdmin} {...register('adherenceMinimum', { valueAsNumber: true })} />
        </Field>
        <Field label="Adherence window (days)" htmlFor="th-adw">
          <Input id="th-adw" type="number" min={1} max={365} disabled={!isAdmin} {...register('adherenceWindow', { valueAsNumber: true })} />
        </Field>
        <Field label="Consecutive missed sessions" htmlFor="th-adx">
          <Input id="th-adx" type="number" min={1} max={30} disabled={!isAdmin} {...register('adherenceMissed', { valueAsNumber: true })} />
        </Field>
        <Field label="Persistent assessments" htmlFor="th-per" hint="Repeated changes in a row before escalation to critical.">
          <Input id="th-per" type="number" min={2} max={20} disabled={!isAdmin} {...register('persistent', { valueAsNumber: true })} />
        </Field>
        {isAdmin && (
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" icon={Save} loading={saving} disabled={!isDirty}>Save thresholds</Button>
          </div>
        )}
      </form>
    </Card>
  );
}

function MissionModal({ state, onClose, onSaved }) {
  const { can } = useAppContext();
  const open = !!state;
  const editing = !!state?.id;
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(missionFormSchema),
  });
  // Reset the form each time the modal opens with a different record.
  const key = state?.id ?? (open ? 'new' : 'closed');
  useFormReset(key, reset, state);

  const submit = async (values) => {
    setSaving(true);
    try {
      const payload = { ...values, endDate: values.endDate || null };
      if (editing) await missionService.update(state.id, payload);
      else await missionService.create(payload);
      toast.success(editing ? 'Mission updated' : 'Mission created');
      onSaved();
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit mission' : 'Add mission'} subtitle="Mark demonstration missions as fictional in the name."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="mission-form" loading={saving} disabled={!can('*')}>Save mission</Button>
        </>
      )}>
      <form id="mission-form" onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Code" htmlFor="m-code" error={errors.code?.message}><Input id="m-code" {...register('code')} /></Field>
        <Field label="Status" htmlFor="m-status" error={errors.status?.message}>
          <Select id="m-status" {...register('status')}><option value="planned">Planned</option><option value="active">Active</option><option value="completed">Completed</option></Select>
        </Field>
        <Field label="Name" htmlFor="m-name" error={errors.name?.message} className="sm:col-span-2"><Input id="m-name" {...register('name')} /></Field>
        <Field label="Start date" htmlFor="m-start" error={errors.startDate?.message}><Input id="m-start" type="date" {...register('startDate')} /></Field>
        <Field label="End date (optional)" htmlFor="m-end" error={errors.endDate?.message}><Input id="m-end" type="date" {...register('endDate')} /></Field>
      </form>
    </Modal>
  );
}

/** Resets react-hook-form values whenever the modal target changes. */
function useFormReset(key, reset, record) {
  useEffect(() => {
    reset({
      code: record?.code ?? '',
      name: record?.name ?? '',
      startDate: record?.startDate ? isoDay(record.startDate) : '',
      endDate: record?.endDate ? isoDay(record.endDate) : '',
      status: record?.status ?? 'planned',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
