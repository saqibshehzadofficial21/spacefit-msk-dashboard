import { SensorAdapter } from './SensorAdapter.js';

const HEADER = ['timestamp', 'sensorType', 'metric', 'value', 'missionPhase', 'exerciseSessionId', 'notes'];

/**
 * Reads fictional sample files (CSV with header, or an array of objects).
 * Everything imported this way is FICTIONAL and is labelled 'simulated'.
 */
export class SampleImportAdapter extends SensorAdapter {
  constructor() {
    super({ name: 'Sample file import (fictional data)', dataSource: 'simulated', sourceType: 'sample-import' });
  }

  async read({ astronautId, csv, records }) {
    let rows;
    if (records?.length) {
      rows = records;
    } else if (csv) {
      const [headerLine, ...lines] = csv.split(/\r?\n/).filter((l) => l.trim().length);
      const header = headerLine.split(',').map((h) => h.trim());
      const missing = HEADER.slice(0, 5).filter((h) => !header.includes(h));
      if (missing.length) throw new Error(`CSV header is missing required column(s): ${missing.join(', ')}`);
      rows = lines.map((line) => {
        const cells = line.split(',').map((c) => c.trim());
        return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
      });
    } else {
      rows = [];
    }
    return rows.map((row, index) => ({
      ...row,
      value: typeof row.value === 'string' ? Number(row.value) : row.value,
      exerciseSessionId: row.exerciseSessionId || null,
      notes: row.notes ? `${row.notes} (sample import row ${index + 1})` : `Sample import row ${index + 1}`,
      astronautId,
      sourceType: 'sample-import',
      dataSource: 'simulated',
    }));
  }
}
