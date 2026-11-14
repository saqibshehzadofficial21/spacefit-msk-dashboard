# Sensor adapters

The prototype ships three adapters that feed the same validated storage path:

| Adapter | Use | `dataSource` | `sourceType` |
| --- | --- | --- | --- |
| `ManualEntryAdapter` | Authorised user types a measurement | `manual` | `manual` |
| `SampleImportAdapter` | Fictional CSV/JSON sample file | `simulated` | `sample-import` |
| `SimulatedStreamAdapter` | Generated demonstration stream | `simulated` | `simulated-stream` |

No live hardware adapter is implemented. A future adapter for IMU, force or pressure hardware should:

1. Extend `SensorAdapter` and implement `async read(input)`.
2. Return normalised records using only metrics listed in `src/analysis/metricCatalog.js` (`SENSOR_METRICS`).
3. Use `dataSource: 'actual-sensor'` only for real connected hardware.
4. Never claim bone density, bone microarchitecture or muscle mass measurement.

Records are validated by `src/validators/sensorValidator.js` before saving.
