import { SensorAdapter } from './SensorAdapter.js';

/** Demonstration stream generator. Output is SIMULATED and always labelled as such. */
const DEFAULTS = { acceleration: 2.5, angularVelocity: 90, orientation: 0, peakPressure: 220, loadBalance: 50, appliedForce: 150, movementVelocity: 0.9, jointAngle: 120 };

export class SimulatedStreamAdapter extends SensorAdapter {
  constructor() {
    super({ name: 'Simulated sensor stream (demonstration)', dataSource: 'simulated', sourceType: 'simulated-stream' });
  }

  /**
   * @param {object} input {astronautId, sensorType, metric, samples, missionPhase, declinePercent}
   * @param {number} referenceValue baseline value for the metric when one exists, else a fixed demo constant
   */
  async read({ astronautId, sensorType, metric, samples, missionPhase, declinePercent = 0, referenceValue }) {
    const start = referenceValue ?? DEFAULTS[metric] ?? 1;
    const now = Date.now();
    const out = [];
    for (let i = 0; i < samples; i += 1) {
      const progress = samples > 1 ? i / (samples - 1) : 0;
      const decline = 1 - (declinePercent / 100) * progress;
      const noise = 1 + (Math.random() - 0.5) * 0.04; // +/-2% noise
      out.push({
        astronautId,
        sensorType,
        metric,
        value: Number((start * decline * noise).toFixed(3)),
        timestamp: new Date(now - (samples - i) * 60000 * 5).toISOString(),
        missionPhase,
        exerciseSessionId: null,
        sourceType: 'simulated-stream',
        dataSource: 'simulated',
        notes: 'SIMULATED demonstration value, not a connected-hardware measurement',
      });
    }
    return out;
  }
}
