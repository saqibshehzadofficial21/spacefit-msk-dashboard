import PDFDocument from 'pdfkit';

const csvEscape = (value) => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV with one block per report section, separated by a blank line and a "Section:" title row. */
export function reportToCsv(report) {
  const lines = [
    `Report,${csvEscape(report.title)}`,
    `Generated,${csvEscape(report.generatedAt)}`,
    `Astronaut,${csvEscape(report.scope.astronaut)}`,
    `Mission,${csvEscape(report.scope.mission)}`,
    `Mission phase,${csvEscape(report.scope.missionPhase)}`,
    `Period,${csvEscape(report.scope.period)}`,
    `Data source summary,${csvEscape(report.dataSourceSummary.map((d) => `${d.label}: ${d.count}`).join('; '))}`,
    '',
  ];
  for (const section of report.sections) {
    lines.push(`Section,${csvEscape(section.title)}`);
    lines.push(section.columns.map(csvEscape).join(','));
    section.rows.forEach((row) => lines.push(row.map(csvEscape).join(',')));
    lines.push('');
  }
  lines.push('Disclaimer,"Prototype output. Not a clinical document. Simulated demonstration data is labelled as such."');
  return `﻿${lines.join('\r\n')}\r\n`;
}

/** PDF export (PDFKit). Long tables are truncated in the PDF with a note; the CSV carries the full rows. */
export function reportToPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true, info: { Title: report.title, Subject: 'Astronaut MSK monitoring prototype report' } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const navy = '#0B1220';
    const blue = '#2563EB';
    const muted = '#64748B';
    const pageWidth = doc.page.width - 80;

    doc.rect(0, 0, doc.page.width, 84).fill(navy);
    doc.fillColor('#E2E8F0').font('Helvetica-Bold').fontSize(18).text(report.title, 40, 26, { width: pageWidth });
    doc.fillColor('#38BDF8').font('Helvetica').fontSize(9).text('Astronaut Musculoskeletal Health & Performance Monitoring System (prototype)', 40, 56);
    doc.y = 100;

    const meta = [
      ['Generated', report.generatedAt],
      ['Astronaut', report.scope.astronaut],
      ['Mission', report.scope.mission],
      ['Mission phase', report.scope.missionPhase],
      ['Reporting period', report.scope.period],
      ['Equipment / category / metric', `${report.scope.equipment} / ${report.scope.category} / ${report.scope.metric}`],
    ];
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(11).text('Report information');
    doc.moveDown(0.3);
    meta.forEach(([k, v]) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(muted).text(`${k}: `, { continued: true }).font('Helvetica').fillColor(navy).text(String(v));
    });

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(navy).text('KPI summary');
    doc.moveDown(0.3);
    report.kpis.forEach((k) => {
      doc.font('Helvetica').fontSize(9).fillColor(navy).text(`${k.label}: `, { continued: true }).font('Helvetica-Bold').text(String(k.value ?? '—'));
    });

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(navy).text('Data source information');
    doc.moveDown(0.3);
    if (!report.dataSourceSummary.length) doc.font('Helvetica').fontSize(9).fillColor(muted).text('No records in the selected scope.');
    report.dataSourceSummary.forEach((d) => doc.font('Helvetica').fontSize(9).fillColor(navy).text(`${d.label}: ${d.count} record(s)`));

    const MAX_PDF_ROWS = 60;
    const bottom = () => doc.page.height - 60;
    const ensureSpace = (h) => { if (doc.y + h > bottom()) doc.addPage(); };

    for (const section of report.sections) {
      doc.moveDown(1);
      ensureSpace(60);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(blue).text(section.title);
      doc.moveDown(0.3);
      const cols = section.columns;
      const widths = cols.map(() => pageWidth / cols.length);
      const drawRow = (cells, header = false) => {
        const rowHeight = 18;
        ensureSpace(rowHeight + 2);
        const y = doc.y;
        if (header) doc.rect(40, y, pageWidth, rowHeight).fill('#E8EEF9');
        cells.forEach((cell, i) => {
          doc.fillColor(header ? navy : '#1E293B').font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(header ? 7.5 : 7)
            .text(String(cell ?? '—'), 40 + i * widths[i] + 3, y + 4, { width: widths[i] - 6, height: rowHeight - 4, ellipsis: true, lineBreak: false });
        });
        doc.y = y + rowHeight;
        doc.moveTo(40, doc.y).lineTo(40 + pageWidth, doc.y).strokeColor('#CBD5E1').lineWidth(0.3).stroke();
      };
      if (!section.rows.length) {
        doc.font('Helvetica').fontSize(9).fillColor(muted).text('No records in this section for the selected filters.');
        continue;
      }
      drawRow(cols, true);
      section.rows.slice(0, MAX_PDF_ROWS).forEach((row) => drawRow(row));
      if (section.totalRows > MAX_PDF_ROWS) {
        doc.moveDown(0.3).font('Helvetica-Oblique').fontSize(8).fillColor(muted).text(`Showing ${MAX_PDF_ROWS} of ${section.totalRows} rows. Use CSV export for the complete table.`);
      }
    }

    doc.moveDown(1);
    ensureSpace(50);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(navy).text('Notes and limitations');
    report.notes.forEach((n) => doc.font('Helvetica').fontSize(8.5).fillColor(muted).text(`• ${n}`));

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc.font('Helvetica').fontSize(7.5).fillColor(muted).text(
        `Prototype output, not a clinical document. Page ${i + 1} of ${range.count}`,
        40, doc.page.height - 35, { width: pageWidth, align: 'center', lineBreak: false },
      );
    }
    doc.end();
  });
}
