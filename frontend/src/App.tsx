import React, { useState } from 'react';
import { NetworkBadge } from './components/NetworkBadge';
import { WorkerPortal } from './components/WorkerPortal';
import { DoctorPortal } from './components/DoctorPortal';
import { OutbreakMap } from './components/OutbreakMap';
import { PatientQRPassport } from './components/PatientQRPassport';
import { MedicineInventory } from './components/MedicineInventory';
import { SimulationLab } from './components/SimulationLab';
import { 
  Users, 
  Stethoscope, 
  MapPin, 
  QrCode, 
  Pill, 
  Cpu, 
  Activity 
} from 'lucide-react';

type TabView = 'worker' | 'doctor' | 'map' | 'passport' | 'pharmacy' | 'simulation';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('worker');

  const navItems = [
    { id: 'worker', label: 'ASHA Field Intake', icon: Users, badge: 'Offline' },
    { id: 'doctor', label: 'Doctor Command Center', icon: Stethoscope, badge: 'Live Queue' },
    { id: 'map', label: 'Village Outbreak GIS', icon: MapPin, badge: 'Hotspots' },
    { id: 'passport', label: 'Offline QR Health Pass', icon: QrCode, badge: 'Scan & Go' },
    { id: 'pharmacy', label: 'Medicine Stock', icon: Pill, badge: '108 Dispatch' },
    { id: 'simulation', label: 'Simulation Lab', icon: Cpu, badge: 'Judge Demo' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Real-Time Connection Bar */}
      <NetworkBadge />

      {/* Main Header */}
      <header className="bg-green-800 text-white shadow-md border-b border-green-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <Activity className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                <span>Sanjeevani</span>
                <span className="text-[10px] font-bold uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded tracking-wide">
                  Enterprise Rural Telemed
                </span>
              </h1>
              <p className="text-xs text-green-100">
                100% Offline-First PWA • On-Device MEWS Triage • Zero-Bandwidth Distributed Sync
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs bg-green-900/60 px-3 py-1.5 rounded-lg border border-green-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>District: <strong>Palghar Tribal Belt (MH)</strong></span>
          </div>
        </div>

        {/* Interactive Multi-Page Navigation Bar */}
        <div className="bg-green-900/80 border-t border-green-700/60 px-4 sm:px-6">
          <nav className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-2 scrollbar-none">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabView)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-green-900 shadow-md ring-1 ring-white/50'
                      : 'text-green-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-green-700' : 'text-green-300'}`} />
                  <span>{item.label}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                    isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-black/20 text-green-200'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1">
        {activeTab === 'worker' && <WorkerPortal />}
        {activeTab === 'doctor' && <DoctorPortal />}
        {activeTab === 'map' && <OutbreakMap />}
        {activeTab === 'passport' && <PatientQRPassport />}
        {activeTab === 'pharmacy' && <MedicineInventory />}
        {activeTab === 'simulation' && <SimulationLab />}
      </main>
    </div>
  );
};

export default App;