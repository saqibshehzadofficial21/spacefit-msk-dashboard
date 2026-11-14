import { useState } from 'react';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import { Field, Select } from '../components/common/Input.jsx';
import MuscleDashboard from '../components/performance/MuscleDashboard.jsx';
import { useAppContext } from '../context/AppContext.jsx';

export default function MusclePerformance() {
  const { astronauts } = useAppContext();
  const [astronautId, setAstronautId] = useState(null);
  const selected = astronautId ?? astronauts[0]?.id ?? 'all';

  return (
    <>
      <PageHeader
        title="Muscle performance"
        subtitle="Strength, movement and functional measures compared with each astronaut's own baseline. These are performance indicators, not muscle-mass measurements."
        breadcrumbs={[{ label: 'Muscle performance' }]}
      />
      <Card className="mb-6" glass>
        <Field label="Astronaut" htmlFor="mp-ast">
          <Select id="mp-ast" value={selected} onChange={(e) => setAstronautId(e.target.value)} className="max-w-md">
            {astronauts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
          </Select>
        </Field>
      </Card>
      <MuscleDashboard astronautId={selected} />
    </>
  );
}
