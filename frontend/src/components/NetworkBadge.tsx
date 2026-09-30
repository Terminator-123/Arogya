import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';
import { SyncEngine } from '../services/syncEngine';
import { TRANSLATIONS, type Language } from '../utils/i18n';

interface NetworkBadgeProps {
  lang?: Language;
}

export const NetworkBadge: React.FC<NetworkBadgeProps> = ({ lang = 'mr' }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;
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
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-slate-200 px-4 sm:px-6 py-2 border-b border-slate-800 text-xs shadow-inner">
      <div className="flex items-center gap-2 font-medium">
        {online ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800 font-semibold">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> {t.netOnline}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-700 font-bold">
            <WifiOff className="w-3.5 h-3.5 text-amber-400" /> {t.netOffline}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>{t.outboxQueue}: <strong className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded">{pendingCount}</strong></span>
        </div>

        {online && (
          <button
            onClick={() => SyncEngine.triggerSync((s, c) => { setSyncing(s); setPendingCount(c); })}
            disabled={syncing}
            className="inline-flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded border border-slate-700 transition font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin text-emerald-400' : ''}`} />
            {syncing ? t.syncing : t.syncNow}
          </button>
        )}
      </div>
    </div>
  );
};