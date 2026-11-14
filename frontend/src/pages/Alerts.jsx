import PageHeader from '../components/layout/PageHeader.jsx';
import AlertsPanel from '../components/alerts/AlertsPanel.jsx';
import { useAppContext } from '../context/AppContext.jsx';

export default function Alerts() {
  const { filters } = useAppContext();
  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle="Persistent or significant changes that need specialist review. Alerts are added once per cause and are not duplicated when analysis re-runs."
        breadcrumbs={[{ label: 'Alerts' }]}
      />
      <AlertsPanel astronautId={filters.astronautId} />
    </>
  );
}
