import PageHeader from '../components/layout/PageHeader.jsx';
import SensorPanel from '../components/sensors/SensorPanel.jsx';
import { useAppContext } from '../context/AppContext.jsx';

export default function SensorData() {
  const { filters } = useAppContext();
  return (
    <>
      <PageHeader
        title="Sensor data"
        subtitle="Manual entries, imported sample files and simulated stream data. Every record shows its data source; simulated values are not hardware measurements."
        breadcrumbs={[{ label: 'Sensor data' }]}
      />
      <SensorPanel astronautId={filters.astronautId} title="Sensor measurements" />
    </>
  );
}
