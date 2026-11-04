import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

declare const __APP_BUILD_TIMESTAMP__: number | undefined;

export const VersionUpdateBanner: React.FC = () => {
  const [initialVersion, setInitialVersion] = useState<number | null>(null);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Global handler for stale chunk errors (e.g. when Vercel deletes old JS hashes after deployment)
  useEffect(() => {
    const handlePreloadError = () => {
      console.warn('[Vite] Preload error detected. Reloading for newest deployment...');
      window.location.reload();
    };
    window.addEventListener('vite:preloadError', handlePreloadError);
    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError);
    };
  }, []);

  // Fetch current version from /version.json
  const checkVersion = async () => {
    try {
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      const serverVersion = Number(data?.version);

      if (serverVersion) {
        setInitialVersion((prev) => {
          if (prev === null) {
            return serverVersion;
          }
          if (serverVersion > prev) {
            setHasNewUpdate(true);
          }
          return prev;
        });
      }
    } catch {
      // Quiet fail if offline
    }
  };

  useEffect(() => {
    // Initial check on mount
    checkVersion();

    // Check periodically every 45 seconds
    const interval = setInterval(checkVersion, 45000);

    // Also check immediately when user focuses back onto the browser tab
    const handleFocus = () => {
      checkVersion();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Hard reload from server without cache
    window.location.reload();
  };

  if (!hasNewUpdate || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-100 max-w-lg w-[calc(100%-2rem)] animate-in slide-in-from-top-4 duration-300">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-white/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
              New System Update Live!
            </h4>
            <p className="text-[11px] sm:text-xs text-blue-100 leading-tight">
              A fresh update has been deployed. Refresh to load the latest features.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded-xl bg-white text-blue-700 font-extrabold text-xs shadow-md hover:bg-blue-50 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
