/**
 * SENSOR ADAPTER INTERFACE
 * ------------------------
 * Every way of bringing measurements into the platform implements this contract. The rest of the
 * application only sees normalised records, so a future hardware adapter can be added without
 * changing services, routes or the React frontend.
 *
 *   class MyHardwareAdapter extends SensorAdapter {
 *     constructor() { super({ name: 'My IMU bridge', dataSource: 'actual-sensor', sourceType: 'adapter' }); }
 *     async read(input) { ...return an array of { astronautId, sensorType, metric, value, timestamp, missionPhase, ... } }
 *   }
 *
 * Rules:
 *  - dataSource must describe provenance honestly ('actual-sensor' only for real connected hardware).
 *  - Records returned by read() are validated by sensorSchema before they are saved.
 *  - Adapters must not return values for metrics outside SENSOR_METRICS.
 */
export class SensorAdapter {
  constructor({ name, dataSource, sourceType, status = 'available' }) {
    if (new.target === SensorAdapter) throw new Error('SensorAdapter is abstract');
    this.name = name;
    this.dataSource = dataSource;
    this.sourceType = sourceType;
    this.status = status;
  }

  /** @returns {Promise<object[]>} normalised, not-yet-validated measurement objects */
  // eslint-disable-next-line no-unused-vars
  async read(input) {
    throw new Error(`${this.name} does not implement read()`);
  }

  describe() {
    return { name: this.name, dataSource: this.dataSource, sourceType: this.sourceType, status: this.status };
  }
}
