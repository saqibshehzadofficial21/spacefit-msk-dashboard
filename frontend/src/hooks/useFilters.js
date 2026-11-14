import { useAppContext } from '../context/AppContext.jsx';

/** Global filters (astronaut, mission, phase, date range) and helpers for pages. */
export function useFilters() {
  const { filters, setFilters, filterParams } = useAppContext();
  return { filters, setFilters, params: filterParams };
}
