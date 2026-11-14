import * as reportService from '../services/reportService.js';
import { reportToCsv, reportToPdf } from '../services/exportService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { AppError } from '../utils/AppError.js';
import { audit, listResponse } from './crudHelpers.js';

export const list = async (req, res) => listResponse(res, await reportService.listReports(req.valid), 'Reports retrieved');
export const get = async (req, res) => sendSuccess(res, { data: await reportService.getReport(req.params.id), message: 'Report retrieved' });
export const generate = async (req, res) => {
  const report = await reportService.generateReport(req.valid, req.user.role);
  await audit(req, 'generate', 'report', report.id, `${report.reportType}: ${report.recordCount} records`);
  return sendSuccess(res, { status: 201, data: report, message: 'Report generated and saved' });
};
export const exportReport = async (req, res) => {
  const report = await reportService.getReport(req.params.id);
  const format = String(req.query.format || 'csv').toLowerCase();
  const safeName = report.reportType.replace(/[^a-z-]/g, '');
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}-${report.id}.csv"`);
    return res.send(reportToCsv(report));
  }
  if (format === 'pdf') {
    const buffer = await reportToPdf(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}-${report.id}.pdf"`);
    return res.send(buffer);
  }
  throw new AppError(400, 'Unsupported export format', ['format must be "csv" or "pdf"']);
};
