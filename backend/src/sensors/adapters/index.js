import { ManualEntryAdapter } from './ManualEntryAdapter.js';
import { SampleImportAdapter } from './SampleImportAdapter.js';
import { SimulatedStreamAdapter } from './SimulatedStreamAdapter.js';

export const adapters = {
  manual: new ManualEntryAdapter(),
  sampleImport: new SampleImportAdapter(),
  simulated: new SimulatedStreamAdapter(),
};

/** Honest status list for the Settings page. No live hardware is connected in this prototype. */
export function describeAdapters() {
  return [
    ...Object.values(adapters).map((a) => a.describe()),
    { name: 'Live IMU / force / pressure hardware', dataSource: 'actual-sensor', sourceType: 'adapter', status: 'not implemented (interface documented only; see src/sensors/adapters/README.md)' },
  ];
}
