import { Download, FileText, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button.jsx';
import { reportService } from '../../services/reportService.js';

/** Downloads the server-generated CSV or PDF. Print uses the browser print dialog on the report preview only. */
export default function ReportExport({ report }) {
  const download = async (format) => {
    try {
      const blob = await reportService.exportBlob(report.id, format);
      const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.reportType}-${report.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`${format.toUpperCase()} export downloaded`);
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };
  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button variant="secondary" icon={Download} onClick={() => download('csv')}>Export CSV</Button>
      <Button variant="secondary" icon={FileText} onClick={() => download('pdf')}>Export PDF</Button>
      <Button variant="ghost" icon={Printer} onClick={() => window.print()}>Print report</Button>
    </div>
  );
}
