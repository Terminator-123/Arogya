import React, { useState } from 'react';
import { TRANSLATIONS, type Language } from '../utils/i18n';
import { Cpu, GitMerge, Wifi, CheckCircle2, Zap } from 'lucide-react';

interface SimulationLabProps {
  lang?: Language;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({ lang = 'mr' }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;
  const [networkMode, setNetworkMode] = useState<'4G' | '2G' | 'ZERO'>('2G');
  const [conflictResolved, setConflictResolved] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const simulateConflict = () => {
    setIsMerging(true);
    setConflictResolved(false);
    setTimeout(() => {
      setIsMerging(false);
      setConflictResolved(true);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5 pb-12 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-300 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-slate-800" /> {t.simTitle}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">{t.simDesc}</p>
        </div>
        <span className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-full border border-slate-300">
          {t.benchBadge}
        </span>
      </div>

      {/* Simulator 1: Network Throttler */}
      <div className="bg-white rounded-xl border border-slate-300 p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-slate-700" /> {t.netEmulatorTitle}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setNetworkMode('4G')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              networkMode === '4G' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <span className="font-bold text-xs block">{t.mode4g}</span>
            <span className={`text-[11px] ${networkMode === '4G' ? 'text-slate-300' : 'text-slate-500'}`}>100 Mbps • 15ms latency</span>
          </button>

          <button
            onClick={() => setNetworkMode('2G')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              networkMode === '2G' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <span className="font-bold text-xs block">{t.mode2g}</span>
            <span className={`text-[11px] ${networkMode === '2G' ? 'text-slate-300' : 'text-slate-500'}`}>20 kbps • 850ms latency • 30% drop</span>
          </button>

          <button
            onClick={() => setNetworkMode('ZERO')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              networkMode === 'ZERO' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <span className="font-bold text-xs block">{t.modeZero}</span>
            <span className={`text-[11px] ${networkMode === 'ZERO' ? 'text-slate-300' : 'text-slate-500'}`}>0 kbps • 100% loss (100% Offline)</span>
          </button>
        </div>

        {/* Live Network Benchmark */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-300">
          <div>
            <span className="text-xs text-slate-600 block mb-1 font-medium">{t.stdPayload}:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">84.2 KB</span>
              <span className="text-xs text-red-700 font-bold">Timeout on 2G</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Transmits heavy HTML and uncompressed DOM state.</p>
          </div>

          <div>
            <span className="text-xs text-slate-600 block mb-1 font-medium">{t.arogyaPayload}:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-800">1.18 KB</span>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                {t.bandwidthSaved}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">Minimal encrypted delta JSON. Synchronizes in 0.12s on GPRS!</p>
          </div>
        </div>
      </div>

      {/* Simulator 2: 3-Way Conflict Merge Playground */}
      <div className="bg-white rounded-xl border border-slate-300 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-slate-800" /> {t.mergeTitle}
            </h3>
            <p className="text-xs text-slate-600">{t.mergeDesc}</p>
          </div>

          <button
            onClick={simulateConflict}
            disabled={isMerging}
            className="bg-slate-900 hover:bg-black text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isMerging ? 'animate-spin' : ''}`} />
            {isMerging ? t.mergingText : t.simulateCollision}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Branch A */}
          <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
              {t.branchA}
            </span>
            <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
              <div>Base Version: <strong>v1.0</strong></div>
              <div>SpO2: <span className="line-through text-slate-400">95%</span> &rarr; <strong className="text-red-700">88% (Updated)</strong></div>
              <div>Pulse: <span className="line-through text-slate-400">76</span> &rarr; <strong className="text-red-700">128 bpm (Updated)</strong></div>
              <div>State: <span className="text-amber-800 font-bold">Offline Disk</span></div>
            </div>
          </div>

          {/* Merge Icon */}
          <div className="text-center py-2 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 mb-1">
              <GitMerge className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 uppercase">3-Way Atomic Merge</span>
            <span className="text-[10px] text-slate-500">Zero Data Loss</span>
          </div>

          {/* Branch B */}
          <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
              {t.branchB}
            </span>
            <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
              <div>Base Version: <strong>v1.0</strong></div>
              <div>Doctor Rx: <strong className="text-slate-900">"4L O2 + ALS Transfer"</strong></div>
              <div>Acuity: <strong className="text-red-700">CODE RED Priority</strong></div>
              <div>State: <span className="text-emerald-800 font-bold">Cloud Server</span></div>
            </div>
          </div>
        </div>

        {/* Resolved State */}
        {conflictResolved && (
          <div className="bg-emerald-50 border-2 border-emerald-600 p-4 rounded-xl text-xs space-y-2 animate-fade-in shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" /> {t.mergeSuccess}
              </span>
              <span className="bg-emerald-200 text-emerald-950 font-bold px-2 py-0.5 rounded text-[10px]">
                Deterministic
              </span>
            </div>
            <p className="text-emerald-900 text-[11px] leading-relaxed font-medium">
              {t.mergeSuccessDesc}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
