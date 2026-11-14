import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { insightService } from '../../services/insightService.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAppContext } from '../../context/AppContext.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import { Skeleton } from '../common/LoadingSpinner.jsx';
import Pagination from '../common/Pagination.jsx';
import { Field, Select } from '../common/Input.jsx';
import InsightCard from './InsightCard.jsx';
import { ALERT_CATEGORIES } from '../../utils/constants.js';
import { SEVERITIES } from '../../utils/constants.js';

/** Lists insights for the scope with filters, review actions and an analysis run button. */
export default function InsightsPanel({ astronautId = 'all', showRun = true, compactCards = false }) {
  const { can, notifyDataChanged, astronauts, filterParams } = useAppContext();
  const [severity, setSeverity] = useState('all');
  const [category, setCategory] = useState('all');
  const [review, setReview] = useState('all');
  const [page, setPage] = useState(1);
  const [running, setRunning] = useState(false);

  const query = useMemo(() => ({
    astronautId: astronautId === 'all' ? filterParams.astronautId : astronautId,
    severity, category, reviewStatus: review, page, pageSize: 6, sortBy: 'measurementDate', order: 'desc',
  }), [astronautId, filterParams.astronautId, severity, category, review, page]);
  const key = JSON.stringify(query);
  const { data, meta, loading, error, reload } = useFetch(() => insightService.list(query), [key]);

  const runAnalysis = async () => {
    setRunning(true);
    try {
      const target = astronautId !== 'all' ? astronautId : null;
      const result = await insightService.analyse(target);
      toast.success(`Analysis complete: ${result.data.insightsCreated} insight(s), ${result.data.alertsCreated} new alert(s)`);
      notifyDataChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRunning(false);
    }
  };

  const applyReview = async (insight, status) => {
    try {
      await insightService.updateReview(insight.id, status);
      toast.success('Review status updated');
      notifyDataChanged();
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const astronautName = (id) => astronauts.find((a) => a.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-5">
      <Card
        title="Filter insights"
        subtitle="Insights compare each astronaut only with their own baseline."
        actions={showRun && can('insights:analyse') ? <Button icon={Play} loading={running} onClick={runAnalysis}>Run analysis</Button> : null}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Severity" htmlFor="ins-sev"><Select id="ins-sev" value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}><option value="all">All severities</option>{SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}<option value="normal">Normal</option></Select></Field>
          <Field label="Category" htmlFor="ins-cat"><Select id="ins-cat" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}><option value="all">All categories</option>{ALERT_CATEGORIES.filter((c) => c.value !== 'specialist-review').map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select></Field>
          <Field label="Review status" htmlFor="ins-rev"><Select id="ins-rev" value={review} onChange={(e) => { setReview(e.target.value); setPage(1); }}><option value="all">All</option><option value="unreviewed">Unreviewed</option><option value="reviewed">Reviewed</option><option value="referred-to-specialist">Referred to specialist</option></Select></Field>
        </div>
        {astronautId === 'all' && <p className="mt-3 text-xs text-slate-500">Showing insights for {filterParams.astronautId === 'all' ? 'all astronauts' : astronautName(filterParams.astronautId)}.</p>}
      </Card>

      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <Skeleton className="h-64" /> : !data?.length ? (
        <EmptyState title="No insights match these filters" description="Run the analysis after recording baseline and performance assessments, or widen the filters." action={showRun && can('insights:analyse') ? <Button icon={Play} onClick={runAnalysis} loading={running}>Run analysis</Button> : null} />
      ) : (
        <div className={`grid gap-4 ${compactCards ? '' : 'xl:grid-cols-2'}`}>
          {data.map((insight) => (
            <div key={insight.id} className="flex flex-col gap-2">
              <InsightCard insight={insight} compact={compactCards} canReview={can('insights:write')} onReview={applyReview} />
              <p className="px-1 text-[11px] text-slate-500">{astronautName(insight.astronautId)}</p>
            </div>
          ))}
        </div>
      )}
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
