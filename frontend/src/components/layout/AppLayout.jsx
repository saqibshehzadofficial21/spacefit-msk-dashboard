import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { useAppContext } from '../../context/AppContext.jsx';
import { AlertTriangle } from 'lucide-react';

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
    <div className="flex min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-white">Skip to content</a>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <div className="no-print border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-center text-xs text-amber-200 sm:px-6">
          <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 -mt-0.5" aria-hidden="true" />
          Prototype with fictional demonstration data. Not a medical device and not NASA-approved. Does not diagnose any condition.
        </div>
        {referenceError && (
          <div role="alert" className="no-print border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-xs text-red-200">
            Reference lists could not be loaded: {referenceError}
          </div>
        )}
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div key={location.pathname} className="animate-fade-up mx-auto w-full max-w-[1500px]">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#131F35', color: '#E2E8F0', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '14px', fontSize: '14px' },
          success: { iconTheme: { primary: '#22C55E', secondary: '#131F35' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#131F35' } },
        }}
      />
    </div>
  );
}
