import { useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import ExerciseForm from '../components/exercises/ExerciseForm.jsx';
import ExerciseHistory from '../components/exercises/ExerciseHistory.jsx';
import ExerciseAnalytics from '../components/exercises/ExerciseAnalytics.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { CATEGORIES } from '../utils/constants.js';

export default function ExerciseCountermeasures() {
  const { can, filters, notifyDataChanged } = useAppContext();
  const [category, setCategory] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const tabs = [{ value: 'all', label: 'All categories' }, ...CATEGORIES];

  return (
    <>
      <PageHeader
        title="Exercise countermeasures"
        subtitle="Prescribed countermeasure sessions, completion and adherence. Use the top bar to filter by astronaut, mission, phase and date."
        breadcrumbs={[{ label: 'Exercise countermeasures' }]}
        actions={can('exercises:write') && <Button icon={Plus} onClick={() => setFormOpen(true)}>Log session</Button>}
      />

      <div role="tablist" aria-label="Exercise categories" className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-700/50 bg-space-850/60 p-1 scrollbar-thin">
        {tabs.map((t) => (
          <button key={t.value} role="tab" aria-selected={category === t.value} onClick={() => setCategory(t.value)}
            className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${category === t.value ? 'bg-[var(--accent-fill)] text-on-accent' : 'text-secondary hover:bg-surface-raised hover:text-primary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <Card title="Adherence analytics" subtitle="Completion of prescribed sessions for the selected scope.">
          <ExerciseAnalytics astronautId={filters.astronautId} category={category} />
        </Card>
        <ExerciseHistory astronautId={filters.astronautId} category={category} />
      </div>

      <ExerciseForm open={formOpen} onClose={() => setFormOpen(false)} astronautId={filters.astronautId} onSaved={() => { setFormOpen(false); notifyDataChanged(); }} />
    </>
  );
}
