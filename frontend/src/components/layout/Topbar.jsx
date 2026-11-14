import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, Search, Settings, ShieldCheck, Check } from 'lucide-react';
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
  const menuRef = useRef(null);
  useOutsideClose(menuRef, () => setOpenMenu(null));

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/astronauts?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-700/40 bg-space-900/85 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <button type="button" onClick={onOpenMenu} className="btn-ghost p-2 md:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>

        <form onSubmit={submitSearch} className="relative min-w-[12rem] flex-1 md:max-w-xs" role="search">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search astronauts or IDs…"
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
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{newAlerts.count > 9 ? '9+' : newAlerts.count}</span>
              )}
            </button>
            {openMenu === 'notifications' && (
              <div className="glass absolute right-0 z-50 mt-2 w-80 p-2 shadow-panel" role="menu">
                <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">New alerts</p>
                {newAlerts.items.length === 0 && <p className="px-2 py-3 text-sm text-slate-400">No alerts awaiting review.</p>}
                <ul className="flex flex-col gap-1">
                  {newAlerts.items.map((a) => (
                    <li key={a.id}>
                      <Link to="/alerts" onClick={() => setOpenMenu(null)} className="block rounded-lg px-2 py-2 hover:bg-space-700/80">
                        <div className="flex items-center justify-between gap-2">
                          <StatusBadge tone={SEVERITY_TONE[a.severity] ?? 'neutral'}>{a.severity}</StatusBadge>
                          <span className="text-[11px] text-slate-500">{formatDate(a.generatedAt)}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-300">{a.astronautId}: {a.description}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="/alerts" onClick={() => setOpenMenu(null)} className="btn-secondary mt-2 w-full text-xs">Open alert centre</Link>
              </div>
            )}
          </div>

          <Link to="/settings" className="btn-ghost hidden p-2 sm:inline-flex" aria-label="Settings"><Settings className="h-5 w-5" /></Link>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-space-800 px-2.5 py-1.5 text-sm hover:border-cyan-400/40"
              aria-expanded={openMenu === 'profile'}
              aria-haspopup="menu"
              onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 text-xs font-bold text-white">{roleLabel.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
              <span className="hidden text-left md:block">
                <span className="block text-xs leading-none text-slate-400">Demo role</span>
                <span className="block text-sm font-medium leading-tight text-slate-100">{roleLabel}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </button>
            {openMenu === 'profile' && (
              <div className="glass absolute right-0 z-50 mt-2 w-80 p-3 shadow-panel" role="menu">
                <p className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Demo role (prototype only)</p>
                <p className="mt-1 px-1 text-[11px] leading-relaxed text-amber-200/80">Role switching demonstrates permissions. It is not production identity management.</p>
                <div className="mt-2 flex flex-col gap-1.5" role="radiogroup" aria-label="Select demo role">
                  {Object.keys(ROLE_LABELS).map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={role === r}
                      onClick={() => { setRole(r); setOpenMenu(null); }}
                      className={`flex items-start gap-3 rounded-xl border p-2.5 text-left transition ${role === r ? 'border-cyan-400/50 bg-accent/10' : 'border-slate-700/50 hover:border-slate-500'}`}
                    >
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-cyan-300/60">{role === r && <Check className="h-3 w-3 text-cyan-300" />}</span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-100">{ROLE_LABELS[r]}</span>
                        <span className="block text-[11px] leading-snug text-slate-400">{ROLE_DESCRIPTIONS[r]}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 border-t border-slate-700/40 pt-2">
                  <Link to="/settings" onClick={() => setOpenMenu(null)} className="btn-ghost w-full justify-start text-sm"><Settings className="h-4 w-4" />Settings and system</Link>
                </div>
              </div>
            )}
          </div>
          {/* Phone-size shortcut: menu button opens the drawer; this keeps the mobile header compact. */}
        </div>
      </div>
    </header>
  );
}
