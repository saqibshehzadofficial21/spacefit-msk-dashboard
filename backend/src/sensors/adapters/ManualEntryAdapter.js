import { SensorAdapter } from './SensorAdapter.js';

/** Authorised users type measurements into the form. Stored as 'manual'. */
export class ManualEntryAdapter extends SensorAdapter {
  constructor() {
    super({ name: 'Manual entry', dataSource: 'manual', sourceType: 'manual' });
  }

  async read(input) {
    return [{ ...input, sourceType: 'manual', dataSource: 'manual' }];
  }
}
