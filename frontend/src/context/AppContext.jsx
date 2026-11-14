import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getStoredRole, ROLE_STORAGE_KEY, setApiRole } from '../services/api.js';
import { astronautService } from '../services/astronautService.js';
import { missionService } from '../services/missionService.js';
import { alertService } from '../services/alertService.js';
import { hasPermission, ROLE_LABELS } from '../utils/permissions.js';
import { buildFilterParams, readFilters, writeFilters } from '../utils/filters.js';

const AppContext = createContext(null);

/**
 * Application-wide state: demo role, global filters (astronaut / mission / phase / date range),
 * reference lists, notifications and a data version that pages watch to refresh after changes.
 * This replaces a conventional login context; see README "Demo authentication".
 */
export function AppProvider({ children }) {
  const [role, setRoleState] = useState(getStoredRole);
  const [filters, setFiltersState] = useState(readFilters);
  const [dataVersion, setDataVersion] = useState(0);
  const [astronauts, setAstronauts] = useState([]);
  const [missions, setMissions] = useState([]);
  const [newAlerts, setNewAlerts] = useState({ count: 0, items: [] });
  const [referenceError, setReferenceError] = useState(null);

  useEffect(() => { writeFilters(filters); }, [filters]);

  useEffect(() => {
    let active = true;
    Promise.all([astronautService.list({ pageSize: 200, sortBy: 'name', order: 'asc' }), missionService.list()])
      .then(([a, m]) => {
        if (!active) return;
        setAstronauts(a.data);
        setMissions(m.data);
        setReferenceError(null);
      })
      .catch((err) => { if (active) setReferenceError(err.message); });
    return () => { active = false; };
  }, [dataVersion, role]);

  useEffect(() => {
    let active = true;
    alertService.list({ reviewStatus: 'new', pageSize: 5 })
      .then((r) => { if (active) setNewAlerts({ count: r.meta.total, items: r.data }); })
      .catch(() => { if (active) setNewAlerts({ count: 0, items: [] }); });
    return () => { active = false; };
  }, [dataVersion, role]);

  const setRole = useCallback((next) => {
    try { localStorage.setItem(ROLE_STORAGE_KEY, next); } catch { /* ignore */ }
    setApiRole(next);
    setRoleState(next);
    setDataVersion((v) => v + 1);
    toast.success(`Demo role switched to ${ROLE_LABELS[next]}`);
  }, []);

  const setFilters = useCallback((patch) => {
    setFiltersState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  const notifyDataChanged = useCallback(() => setDataVersion((v) => v + 1), []);

  const value = useMemo(() => ({
    role,
    roleLabel: ROLE_LABELS[role],
    setRole,
    can: (permission) => hasPermission(role, permission),
    filters,
    setFilters,
    filterParams: buildFilterParams(filters),
    astronauts,
    missions,
    newAlerts,
    referenceError,
    dataVersion,
    notifyDataChanged,
  }), [role, setRole, filters, setFilters, astronauts, missions, newAlerts, referenceError, dataVersion, notifyDataChanged]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}
