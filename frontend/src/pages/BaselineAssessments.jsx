import { useState } from 'react';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import { Field, Select } from '../components/common/Input.jsx';
import AssessmentPanel from '../components/performance/AssessmentPanel.jsx';
import { useAppContext } from '../context/AppContext.jsx';

/** Baselines are recorded per astronaut. Each astronaut's later measurements are compared only with their own baseline. */
export default function BaselineAssessments() {
  const { astronauts } = useAppContext();
  const [astronautId, setAstronautId] = useState(null);
  const selected = astronautId ?? astronauts[0]?.id ?? 'all';

  return (
    <>
      <PageHeader
        title="Baseline assessments"
        subtitle="Pre-mission reference measurements. Compare current results against the individual's own baseline, never against other astronauts."
        breadcrumbs={[{ label: 'Baseline assessments' }]}
      />
      <Card className="mb-6" glass>
        <Field label="Astronaut" htmlFor="base-ast" hint="Baselines are shown for one astronaut at a time.">
          <Select id="base-ast" value={selected} onChange={(e) => setAstronautId(e.target.value)} className="max-w-md">
            {astronauts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
          </Select>
        </Field>
      </Card>
      <AssessmentPanel astronautId={selected} />
    </>
  );
}
