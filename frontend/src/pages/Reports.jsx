import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { Field, Select } from '../components/common/Input.jsx';
import ReportFilters from '../components/reports/ReportFilters.jsx';
import ReportPreview from '../components/reports/ReportPreview.jsx';
import ReportExport from '../components/reports/ReportExport.jsx';
import { reportService } from '../services/reportService.js';
import { useFetch } from '../hooks/useFetch.js';
import { formatDateTime } from '../utils/formatters.js';
import { useAppContext } from '../context/AppContext.jsx';

export default function Reports() {
  const { notifyDataChanged, dataVersion } = useAppContext();
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const history = useFetch(() => reportService.list({ pageSize: 20, sortBy: 'generatedAt', order: 'desc' }), [dataVersion]);
  const initial = searchParams.get('astronautId') ? { astronautId: searchParams.get('astronautId') } : undefined;

  const generate = async (payload) => {
    setGenerating(true);
    setError(null);
    try {
      const res = await reportService.generate(payload);
      setReport(res.data);
      toast.success('Report generated from stored records');
      notifyDataChanged();
    } catch (err) {
      setError(err.message);
      toast.error(`Report failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const openPast = async (id) => {
    if (!id) return;
    try {
      const res = await reportService.get(id);
      setReport(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Create a report from stored records with clear scope and data-source notes. Export as CSV or PDF, or print."
        breadcrumbs={[{ label: 'Reports' }]}
      />

      <div className="flex flex-col gap-6">
        <ReportFilters initial={initial} onGenerate={generate} generating={generating} />
        {error && <ErrorState message={error} />}

        <div className="grid gap-6 xl:grid-cols-4">
          <Card className="xl:col-span-3" title="Report preview" subtitle={report ? 'Review, then export or print.' : 'Generate a report to see it here.'}
            actions={report && <ReportExport report={report} />}>
            {report ? <ReportPreview report={report} /> : (
              <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">No report selected. Use the filters above to generate one.</div>
            )}
          </Card>
          <Card title="Saved reports" subtitle="Snapshots stored in reports.json.">
            <Field label="Open a saved report" htmlFor="saved-rep">
              <Select id="saved-rep" value={report?.id ?? ''} onChange={(e) => openPast(e.target.value)}>
                <option value="">Select a report…</option>
                {(history.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.title} · {formatDateTime(r.generatedAt)}</option>)}
              </Select>
            </Field>
            {history.loading && <p className="mt-3 text-xs text-slate-500">Loading saved reports…</p>}
            <p className="mt-3 text-xs text-slate-500">{history.data?.length ?? 0} saved report(s).</p>
          </Card>
        </div>
      </div>
    </>
  );
}
