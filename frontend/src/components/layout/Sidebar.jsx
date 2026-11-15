import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Dumbbell, Activity, Radio, Sparkles, BellRing, FileBarChart, Settings, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/astronauts', label: 'Astronauts', icon: Users },
  { to: '/exercise-countermeasures', label: 'Exercise Countermeasures', short: 'Exercise', icon: Dumbbell },
  { to: '/muscle-performance', label: 'Muscle Performance', icon: Activity },
  { to: '/sensor-data', label: 'Sensor Data', icon: Radio },
  { to: '/adaptive-insights', label: 'Adaptive Insights', short: 'Insights', icon: Sparkles },
  { to: '/alerts', label: 'Alerts', icon: BellRing },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavItems({ collapsed, onNavigate }) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, short, icon: Icon }) => (
        <li key={to} className="group relative">
          <NavLink
            to={to}
            onClick={onNavigate}
            aria-label={label}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200 ${
                isActive ? 'bg-[var(--accent-fill)] text-on-accent' : 'text-secondary hover:bg-surface-raised hover:text-primary'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {!collapsed && <span className="truncate">{short ?? label}</span>}
          </NavLink>
          {collapsed && (
            <span role="tooltip" className="invisible pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-subtle bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-primary shadow-panel group-hover:visible group-focus-within:visible">
              {label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Brand({ collapsed }) {
  return (
    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
      <img src="/logo/msk-logo.svg" alt="" className="h-9 w-9 shrink-0 rounded-xl" />
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-wide text-primary">MSK Performance</p>
          <p className="truncate text-xs uppercase tracking-[0.18em] text-muted">Monitoring prototype</p>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Desktop and laptop */}
      <aside className={`no-print sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] transition-[width] duration-300 md:flex ${collapsed ? 'w-[76px]' : 'w-64'}`} aria-label="Primary navigation">
        <div className="flex items-center justify-between gap-2 px-4 py-5">
          <Brand collapsed={collapsed} />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 scrollbar-thin"><NavItems collapsed={collapsed} /></nav>
        <div className="border-t border-[var(--border)] p-3">
          <button type="button" onClick={onToggle} className={`btn-ghost w-full ${collapsed ? 'px-0' : ''}`} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /><span className="text-xs">Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Tablet and phones: drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-[rgba(15,23,42,0.65)]" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] p-4 shadow-[var(--shadow-panel)]">
            <div className="mb-4 flex items-center justify-between">
              <Brand collapsed={false} />
              <button type="button" onClick={onCloseMobile} className="btn-ghost p-1.5" aria-label="Close navigation"><X className="h-5 w-5" /></button>
            </div>
            <nav className="overflow-y-auto scrollbar-thin"><NavItems collapsed={false} onNavigate={onCloseMobile} /></nav>
          </aside>
        </div>
      )}
    </>
  );
}
