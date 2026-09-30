import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';
import { SyncEngine } from '../services/syncEngine';

export const NetworkBadge: React.FC = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPending = async () => {
    const count = await SyncEngine.getPendingCount();
    setPendingCount(count);
  };

  useEffect(() => {
    refreshPending();

    const handleOnline = () => {
      setOnline(true);
      SyncEngine.triggerSync((isSyncing, remaining) => {
        setSyncing(isSyncing);
        setPendingCount(remaining);
      });
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(refreshPending, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2 border-b border-slate-200 shadow-sm text-xs sm:text-sm">
      <div className="flex items-center gap-2 font-medium">
        {online ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Wifi className="w-4 h-4 text-emerald-600 animate-pulse" /> Low-Bandwidth Mode (Online)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
            <WifiOff className="w-4 h-4 text-amber-600" /> Offline Mode (IndexedDB Active)
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Database className="w-4 h-4 text-slate-500" />
          <span>Outbox Queue: <strong className="text-slate-800">{pendingCount}</strong></span>
        </div>

        {online && (
          <button
            onClick={() => SyncEngine.triggerSync((s, c) => { setSyncing(s); setPendingCount(c); })}
            disabled={syncing}
            className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded border border-slate-300 transition text-slate-700 font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-green-600' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
};