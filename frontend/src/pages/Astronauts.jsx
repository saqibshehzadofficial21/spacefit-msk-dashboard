import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/layout/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import Pagination from '../components/common/Pagination.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { Field, Select, SearchBox } from '../components/common/Input.jsx';
import AstronautTable from '../components/astronauts/AstronautTable.jsx';
import AstronautForm from '../components/astronauts/AstronautForm.jsx';
import { astronautService } from '../services/astronautService.js';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useAppContext } from '../context/AppContext.jsx';
import { PHASES } from '../utils/constants.js';

export default function Astronauts() {
  const { can, notifyDataChanged, missions } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const debouncedQ = useDebounce(q, 300);
  const [status, setStatus] = useState('all');
  const [missionId, setMissionId] = useState('all');
  const [phase, setPhase] = useState('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const params = { q: debouncedQ, status, missionId, missionPhase: phase, page, pageSize: 10, sortBy: 'name', order: 'asc' };
  const list = useFetch(() => astronautService.list(params), [JSON.stringify(params)]);

  const onSearch = (value) => {
    setQ(value);
    setPage(1);
    setSearchParams(value ? { q: value } : {}, { replace: true });
  };

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (a) => { setEditing(a); setFormOpen(true); };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await astronautService.remove(toDelete.id);
      toast.success(`${toDelete.name} and their linked records were removed`);
      setToDelete(null);
      notifyDataChanged();
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Astronauts"
        subtitle="Demonstration crew records. Names and identifiers are fictional and are not linked to real astronauts."
        breadcrumbs={[{ label: 'Astronauts' }]}
        actions={can('astronauts:write') && <Button icon={Plus} onClick={openCreate}>Add astronaut</Button>}
      />

      <Card className="mb-6" glass>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="md:col-span-2 xl:col-span-2">
            <SearchBox id="ast-search" label="Search by name, ID or mission" value={q} onChange={onSearch} placeholder="e.g. AST-001 or Mission name" />
          </div>
          <Field label="Status" htmlFor="ast-status">
            <Select id="ast-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="all">All statuses</option><option value="active">Active</option><option value="on-hold">On hold</option><option value="completed">Completed</option>
            </Select>
          </Field>
          <Field label="Mission" htmlFor="ast-mission">
            <Select id="ast-mission" value={missionId} onChange={(e) => { setMissionId(e.target.value); setPage(1); }}>
              <option value="all">All missions</option>{missions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
          <Field label="Mission phase" htmlFor="ast-phase">
            <Select id="ast-phase" value={phase} onChange={(e) => { setPhase(e.target.value); setPage(1); }}>
              <option value="all">All phases</option>{PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
          </Field>
        </div>
      </Card>

      {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : (
        <Card>
          <AstronautTable
            rows={list.data ?? []}
            loading={list.loading}
            canEdit={can('astronauts:write')}
            canDelete={can('astronauts:delete')}
            onEdit={openEdit}
            onDelete={setToDelete}
            onSearchReset={() => onSearch('')}
          />
          <Pagination meta={list.meta} onPage={setPage} />
        </Card>
      )}

      <AstronautForm
        open={formOpen}
        astronaut={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); notifyDataChanged(); }}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete astronaut?"
        message={toDelete ? `${toDelete.name} (${toDelete.id}) and all linked baselines, performance, exercise, sensor, insight and alert records will be removed from the demo store. This cannot be undone.` : ''}
        confirmLabel="Delete astronaut"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
