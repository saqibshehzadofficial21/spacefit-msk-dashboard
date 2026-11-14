import { useFetch } from '../hooks/useFetch.js';
import { settingsService } from '../services/settingsService.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import InsightsPanel from '../components/insights/InsightsPanel.jsx';
import { useAppContext } from '../context/AppContext.jsx';

export default function AdaptiveInsights() {
  const { filters } = useAppContext();
  const settings = useFetch(() => settingsService.get(), []);
  const analysis = settings.data?.system?.analysis;

  return (
    <>
      <PageHeader
        title="Adaptive insights"
        subtitle="Rule-based interpretation of each astronaut's own baseline and recent records. Insights describe measurement differences and never identify a cause."
        breadcrumbs={[{ label: 'Adaptive insights' }]}
      />
      <Card className="mb-6" title="Analysis engine" subtitle="Layer 1 (rules) always runs. Layer 2 (narrative) is optional and falls back to rule text.">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <StatusBadge tone="ok" dot>Rule engine active</StatusBadge>
          {analysis && <StatusBadge tone="neutral" dot>{analysis.layer2}</StatusBadge>}
        </div>
      </Card>
      <InsightsPanel astronautId={filters.astronautId} />
    </>
  );
}
