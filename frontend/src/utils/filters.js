export const FILTER_STORAGE_KEY = 'msk.filters';

export const DATE_PRESETS = [
  { value: 'all', label: 'All recorded dates' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '180d', label: 'Last 180 days' },
  { value: 'custom', label: 'Custom range' },
];

export const DEFAULT_FILTERS = { astronautId: 'all', missionId: 'all', missionPhase: 'all', preset: 'all', startDate: '', endDate: '' };

/** Converts the top-bar filters into API query parameters. */
export function buildFilterParams(f) {
  const params = { astronautId: f.astronautId, missionId: f.missionId, missionPhase: f.missionPhase };
  if (f.preset === 'custom') {
    if (f.startDate) params.startDate = f.startDate;
    if (f.endDate) params.endDate = f.endDate;
  } else if (f.preset && f.preset !== 'all') {
    const days = Number(f.preset.replace('d', ''));
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    params.startDate = start.toISOString().slice(0, 10);
    params.endDate = end.toISOString().slice(0, 10);
  }
  return params;
}

export function readFilters() {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : DEFAULT_FILTERS;
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function writeFilters(filters) {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    /* storage unavailable (private mode): filters still work for this session */
  }
}
