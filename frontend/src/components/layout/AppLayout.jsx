import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { useAppContext } from '../../context/AppContext.jsx';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('msk.sidebarCollapsed') === '1'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { referenceError } = useAppContext();

  useEffect(() => {
    try { localStorage.setItem('msk.sidebarCollapsed', collapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [collapsed]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[var(--accent-fill)] focus:px-3 focus:py-2 focus:text-on-accent">Skip to content</a>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        {referenceError && (
          <div role="alert" className="no-print border-b border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-2 text-center text-xs text-[var(--danger)]">
            Reference lists could not be loaded: {referenceError}
          </div>
        )}
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div key={location.pathname} className="animate-fade-up mx-auto w-full max-w-[1280px]">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '14px', fontSize: '14px', boxShadow: 'var(--shadow-panel)' },
          success: { iconTheme: { primary: 'var(--status-ok-text)', secondary: 'var(--surface-raised)' } },
          error: { iconTheme: { primary: 'var(--status-critical-text)', secondary: 'var(--surface-raised)' } },
        }}
      />
    </div>
  );
}
