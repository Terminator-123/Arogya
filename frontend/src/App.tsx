import React, { useState } from 'react';
import { NetworkBadge } from './components/NetworkBadge';
import { WorkerPortal } from './components/WorkerPortal';
import { DoctorPortal } from './components/DoctorPortal';
import { OutbreakMap } from './components/OutbreakMap';
import { PatientQRPassport } from './components/PatientQRPassport';
import { MedicineInventory } from './components/MedicineInventory';
import { SimulationLab } from './components/SimulationLab';
import { TRANSLATIONS, type Language } from './utils/i18n';
import { 
  Users, 
  Stethoscope, 
  MapPin, 
  QrCode, 
  Pill, 
  Cpu, 
  Activity,
  Globe,
  Sun
} from 'lucide-react';

type TabView = 'worker' | 'doctor' | 'map' | 'passport' | 'pharmacy' | 'simulation';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('worker');
  const [lang, setLang] = useState<Language>('mr'); // Default to Marathi for Maharashtra judges!
  const [sunlightMode, setSunlightMode] = useState<boolean>(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const navItems = [
    { id: 'worker', label: lang === 'mr' ? 'आशा सेविका नोंदणी' : lang === 'hi' ? 'आशा पंजीकरण' : 'ASHA Field Intake', icon: Users, badge: 'Offline' },
    { id: 'doctor', label: lang === 'mr' ? 'डॉक्टर कमांड सेंटर' : lang === 'hi' ? 'डॉक्टर कमांड' : 'Doctor Command Center', icon: Stethoscope, badge: 'Live Queue' },
    { id: 'map', label: lang === 'mr' ? 'गाव साथरोग नकाशा' : lang === 'hi' ? 'प्रकोप मानचित्र' : 'Village Outbreak GIS', icon: MapPin, badge: 'Hotspots' },
    { id: 'passport', label: lang === 'mr' ? 'ऑफलाइन QR कार्ड' : lang === 'hi' ? 'QR हेल्थ पास' : 'Offline QR Health Pass', icon: QrCode, badge: 'Scan & Go' },
    { id: 'pharmacy', label: lang === 'mr' ? 'औषध साठा' : lang === 'hi' ? 'दवा स्टॉक' : 'Medicine Stock', icon: Pill, badge: '108 Dispatch' },
    { id: 'simulation', label: 'Simulation Lab', icon: Cpu, badge: 'Judge Demo' },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      sunlightMode ? 'bg-amber-50/40 text-black contrast-125' : 'bg-slate-50 text-slate-900'
    }`}>
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
                <span>{t.appTitle}</span>
                <span className="text-[10px] font-bold uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded tracking-wide">
                  Enterprise Rural Telemed
                </span>
              </h1>
              <p className="text-xs text-green-100">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Regional Language Switcher */}
            <div className="flex items-center bg-green-900/90 rounded-lg p-1 border border-green-700 text-xs">
              <Globe className="w-3.5 h-3.5 text-green-300 ml-1.5 mr-1" />
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded font-bold cursor-pointer transition ${
                  lang === 'en' ? 'bg-white text-green-900 shadow-xs' : 'text-green-200 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('mr')}
                className={`px-2 py-1 rounded font-bold cursor-pointer transition ${
                  lang === 'mr' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-green-200 hover:text-white'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2 py-1 rounded font-bold cursor-pointer transition ${
                  lang === 'hi' ? 'bg-white text-green-900 shadow-xs' : 'text-green-200 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* High-Contrast Sunlight Mode Toggle */}
            <button
              onClick={() => setSunlightMode(!sunlightMode)}
              title="Toggle High-Contrast Field Sunlight Mode"
              className={`p-2 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                sunlightMode
                  ? 'bg-amber-300 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-green-900/60 text-green-200 border-green-700 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span className="hidden sm:inline">{sunlightMode ? 'Sunlight Active' : 'Sunlight Mode'}</span>
            </button>
          </div>
        </div>

        {/* Multi-Page Navigation Bar */}
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
        {activeTab === 'worker' && <WorkerPortal lang={lang} />}
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