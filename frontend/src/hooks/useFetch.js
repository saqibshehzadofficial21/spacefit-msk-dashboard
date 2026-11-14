import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';

/**
 * Runs an async fetcher whenever `deps` or the global data version change.
 * Keeps previous data visible while reloading to avoid layout jumps.
 */
export function useFetch(fetcher, deps = [], { enabled = true } = {}) {
  const { dataVersion } = useAppContext();
  const [state, setState] = useState({ data: null, meta: null, loading: enabled, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(fetcher)
      .then((res) => {
        if (active) setState({ data: res?.data ?? res, meta: res?.meta ?? null, loading: false, error: null });
      })
      .catch((err) => {
        if (active) setState((s) => ({ ...s, loading: false, error: err.message || 'Request failed' }));
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, dataVersion, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
