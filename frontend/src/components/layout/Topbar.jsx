import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, ChevronDown, Menu, Moon, Search, Settings, ShieldCheck, Sun } from 'lucide-react';
import { useAppContext } from '../../context/AppContext.jsx';
import { PHASES } from '../../utils/constants.js';
import { DATE_PRESETS } from '../../utils/filters.js';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../utils/permissions.js';
import { formatDate } from '../../utils/formatters.js';
import { SEVERITY_TONE } from '../../utils/formatters.js';
import StatusBadge from '../common/StatusBadge.jsx';

const selectClass = 'input-base h-10 w-auto min-w-[9rem] py-1.5 text-sm';

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

export default function Topbar({ onOpenMenu }) {
  const navigate = useNavigate();
  const { astronauts, missions, filters, setFilters, newAlerts, role, roleLabel, setRole } = useAppContext();
  const [query, setQuery] = useState('');
  const [openMenu, setOpenMenu] = useState(null); // 'notifications' | 'profile'
  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  });
  const menuRef = useRef(null);
  useOutsideClose(menuRef, () => setOpenMenu(null));

  useEffect(() => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('msk-theme', theme); } catch { /* ignore */ }
  }, [theme]);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/astronauts?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="no-print sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <button type="button" onClick={onOpenMenu} className="btn-ghost p-2 md:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>

        <form onSubmit={submitSearch} className="relative min-w-[12rem] flex-1 md:max-w-[420px]" role="search">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search astronauts or IDs"
            aria-label="Global search for astronauts"
            className="input-base h-10 pl-9"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Global filters">
          <label className="sr-only" htmlFor="flt-astronaut">Astronaut</label>
          <select id="flt-astronaut" className={selectClass} value={filters.astronautId} onChange={(e) => setFilters({ astronautId: e.target.value })}>
            <option value="all">All astronauts</option>
            {astronauts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
          </select>

          <label className="sr-only" htmlFor="flt-mission">Mission</label>
          <select id="flt-mission" className={selectClass} value={filters.missionId} onChange={(e) => setFilters({ missionId: e.target.value, astronautId: 'all' })}>
            <option value="all">All missions</option>
            {missions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <label className="sr-only" htmlFor="flt-phase">Mission phase</label>
          <select id="flt-phase" className={selectClass} value={filters.missionPhase} onChange={(e) => setFilters({ missionPhase: e.target.value })}>
            <option value="all">All phases</option>
            {PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          <label className="sr-only" htmlFor="flt-range">Date range</label>
          <select id="flt-range" className={selectClass} value={filters.preset} onChange={(e) => setFilters({ preset: e.target.value })}>
            {DATE_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {filters.preset === 'custom' && (
            <>
              <label className="sr-only" htmlFor="flt-start">Start date</label>
              <input id="flt-start" type="date" className={`${selectClass} min-w-0`} value={filters.startDate} max={filters.endDate || undefined} onChange={(e) => setFilters({ startDate: e.target.value })} />
              <label className="sr-only" htmlFor="flt-end">End date</label>
              <input id="flt-end" type="date" className={`${selectClass} min-w-0`} value={filters.endDate} min={filters.startDate || undefined} onChange={(e) => setFilters({ endDate: e.target.value })} />
            </>
          )}
        </div>

        <div ref={menuRef} className="ml-auto flex items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              className="btn-ghost relative p-2"
              aria-label={`Notifications, ${newAlerts.count} new alert${newAlerts.count === 1 ? '' : 's'}`}
              aria-expanded={openMenu === 'notifications'}
              onClick={() => setOpenMenu(openMenu === 'notifications' ? null : 'notifications')}
            >
              <Bell className="h-5 w-5" />
              {newAlerts.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full border border-status-critical-border bg-status-critical-bg px-1 text-xs font-bold text-status-critical">{newAlerts.count > 9 ? '9+' : newAlerts.count}</span>
              )}
            </button>
            {openMenu === 'notifications' && (
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-2 shadow-[var(--shadow-panel)]" role="menu">
                <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">New alerts</p>
                {newAlerts.items.length === 0 && <p className="px-2 py-3 text-sm text-[var(--text-muted)]">No alerts awaiting review.</p>}
                <ul className="flex flex-col gap-1">
                  {newAlerts.items.map((a) => (
                    <li key={a.id}>
                      <Link to="/alerts" onClick={() => setOpenMenu(null)} className="block rounded-lg px-2 py-2 hover:bg-[var(--surface-alt)]">
                        <div className="flex items-center justify-between gap-2">
                          <StatusBadge tone={SEVERITY_TONE[a.severity] ?? 'neutral'}>{a.severity}</StatusBadge>
                          <span className="text-xs text-[var(--text-muted)]">{formatDate(a.generatedAt)}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{a.astronautId}: {a.description}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="/alerts" onClick={() => setOpenMenu(null)} className="btn-secondary mt-2 w-full text-xs">Open alert centre</Link>
              </div>
            )}
          </div>

          <Link to="/settings" className="btn-ghost hidden p-2 sm:inline-flex" aria-label="Settings"><Settings className="h-5 w-5" /></Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn-ghost p-2"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
          </button>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] hover:border-[var(--accent)]/40"
              aria-expanded={openMenu === 'profile'}
              aria-haspopup="menu"
              onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-status-info-bg text-xs font-bold text-status-info">{roleLabel.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
              <span className="hidden text-left md:block">
                <span className="block text-xs leading-none text-[var(--text-muted)]">Demo role</span>
                <span className="block text-sm font-medium leading-tight text-[var(--text-primary)]">{roleLabel}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
            </button>
            {openMenu === 'profile' && (
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 shadow-[var(--shadow-panel)]" role="menu">
                <p className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Demo role</p>
                <div className="mt-2 flex flex-col gap-1.5" role="radiogroup" aria-label="Select demo role">
                  {Object.keys(ROLE_LABELS).map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={role === r}
                      onClick={() => { setRole(r); setOpenMenu(null); }}
                      className={`flex items-start gap-3 rounded-xl border p-2.5 text-left transition ${role === r ? 'border-[var(--accent)]/60 bg-[var(--accent-soft)]' : 'border-[var(--border)] hover:border-[var(--text-muted)]'}`}
                    >
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-[var(--accent)]/60">{role === r && <Check className="h-3 w-3 text-[var(--accent)]" />}</span>
                      <span>
                        <span className="block text-sm font-semibold text-[var(--text-primary)]">{ROLE_LABELS[r]}</span>
                        <span className="block text-xs leading-snug text-[var(--text-muted)]">{ROLE_DESCRIPTIONS[r]}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 border-t border-[var(--border)] pt-2">
                  <Link to="/settings" onClick={() => setOpenMenu(null)} className="btn-ghost w-full justify-start text-sm"><Settings className="h-4 w-4" />Settings and system</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
