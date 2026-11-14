import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Astronauts = lazy(() => import('./pages/Astronauts.jsx'));
const AstronautDetails = lazy(() => import('./pages/AstronautDetails.jsx'));
const BaselineAssessments = lazy(() => import('./pages/BaselineAssessments.jsx'));
const ExerciseCountermeasures = lazy(() => import('./pages/ExerciseCountermeasures.jsx'));
const MusclePerformance = lazy(() => import('./pages/MusclePerformance.jsx'));
const SensorData = lazy(() => import('./pages/SensorData.jsx'));
const AdaptiveInsights = lazy(() => import('./pages/AdaptiveInsights.jsx'));
const Alerts = lazy(() => import('./pages/Alerts.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><LoadingSpinner label="Loading page" /></div>}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Dashboard />} />
          <Route path="astronauts" element={<Astronauts />} />
          <Route path="astronauts/:id" element={<AstronautDetails />} />
          <Route path="baseline-assessments" element={<BaselineAssessments />} />
          <Route path="exercise-countermeasures" element={<ExerciseCountermeasures />} />
          <Route path="muscle-performance" element={<MusclePerformance />} />
          <Route path="sensor-data" element={<SensorData />} />
          <Route path="adaptive-insights" element={<AdaptiveInsights />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
