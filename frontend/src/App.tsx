import React, { useState } from 'react';
import { NetworkBadge } from './components/NetworkBadge';
import { WorkerPortal } from './components/WorkerPortal';
import { DoctorPortal } from './components/DoctorPortal';
import { Users, Stethoscope } from 'lucide-react';

export const App: React.FC = () => {
  const [view, setView] = useState<'worker' | 'doctor'>('worker');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <NetworkBadge />

      <header className="bg-green-800 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <span>Sanjeevani</span>
            <span className="text-[10px] font-semibold uppercase bg-green-600 px-2 py-0.5 rounded tracking-wide border border-green-400">
              PWA v1.0
            </span>
          </h1>
          <p className="text-xs text-green-100">Offline-First Rural Telemedicine & Asynchronous Priority Referral</p>
        </div>

        {/* View Switcher so you can easily show both roles to judges */}
        <div className="flex bg-green-900 p-1 rounded-lg border border-green-700">
          <button
            onClick={() => setView('worker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              view === 'worker' ? 'bg-white text-green-900 shadow' : 'text-green-200 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> ASHA Worker App (Offline PWA)
          </button>
          <button
            onClick={() => setView('doctor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              view === 'doctor' ? 'bg-white text-green-900 shadow' : 'text-green-200 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" /> Doctor Command Center
          </button>
        </div>
      </header>

      <main className="flex-1">
        {view === 'worker' ? <WorkerPortal /> : <DoctorPortal />}
      </main>
    </div>
  );
};

export default App;