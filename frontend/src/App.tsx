import React, { useState, useEffect } from 'react';
import { NetworkBadge } from './components/NetworkBadge';
import { WorkerPortal } from './components/WorkerPortal';
import { AIVisionScanner } from './components/AIVisionScanner';
import { AIChatbot } from './components/AIChatbot';
import { DoctorPortal } from './components/DoctorPortal';
import { OutbreakMap } from './components/OutbreakMap';
import { PatientQRPassport } from './components/PatientQRPassport';
import { MedicineInventory } from './components/MedicineInventory';
import { SimulationLab } from './components/SimulationLab';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { TRANSLATIONS, type Language } from './utils/i18n';
import { 
  Users, 
  Camera,
  Bot,
  Stethoscope, 
  MapPin, 
  QrCode, 
  Pill, 
  Cpu, 
  Database,
  Activity,
  Globe,
  Sun
} from 'lucide-react';

type TabView = 'worker' | 'scanner' | 'chat' | 'doctor' | 'map' | 'passport' | 'pharmacy' | 'simulation' | 'database';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('worker');
  const [lang, setLang] = useState<Language>('mr');
  const [sunlightMode, setSunlightMode] = useState<boolean>(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;

  useEffect(() => {
    if (sunlightMode) {
      document.body.classList.add('sunlight-theme');
    } else {
      document.body.classList.remove('sunlight-theme');
    }
  }, [sunlightMode]);

  const navItems = [
    { id: 'worker', label: t.tabWorker, icon: Users },
    { id: 'scanner', label: t.tabScanner, icon: Camera },
    { id: 'chat', label: t.tabChat, icon: Bot },
    { id: 'doctor', label: t.tabDoctor, icon: Stethoscope },
    { id: 'map', label: t.tabMap, icon: MapPin },
    { id: 'passport', label: t.tabPassport, icon: QrCode },
    { id: 'pharmacy', label: t.tabPharmacy, icon: Pill },
    { id: 'simulation', label: t.tabSimulation, icon: Cpu },
    { id: 'database', label: t.tabDatabase, icon: Database },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors relative ${
      sunlightMode ? 'bg-amber-100 text-black' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Formal Top Government Ribbon */}
      <div className="bg-slate-950 text-slate-300 text-[11px] px-4 sm:px-6 py-1 border-b border-slate-800 flex flex-wrap items-center justify-between font-medium">
        <span>{t.govHeader}</span>
        <span className="hidden sm:inline text-slate-400 font-mono">{t.districtBadge}</span>
      </div>

      {/* Real-time Connection Bar with language support */}
      <NetworkBadge lang={lang} />

      {/* Main Formal Header */}
      <header className="bg-white border-b border-slate-300 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {t.appTitle}
                </h1>
                <span className="text-[10px] font-black uppercase bg-slate-900 text-emerald-400 px-2 py-0.5 rounded tracking-wider">
                  TELEMED v2.5
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Regional Language Switcher */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-300 text-xs shadow-xs">
              <Globe className="w-3.5 h-3.5 text-slate-600 ml-1.5 mr-1" />
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition ${
                  lang === 'en' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:text-black'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('mr')}
                className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition ${
                  lang === 'mr' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:text-black'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition ${
                  lang === 'hi' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:text-black'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* High-Contrast Sunlight Mode Toggle */}
            <button
              onClick={() => setSunlightMode(!sunlightMode)}
              title="Toggle High-Contrast Field Sunlight Mode"
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                sunlightMode
                  ? 'bg-amber-400 text-black border-black ring-2 ring-black font-black'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Sun className={`w-4 h-4 ${sunlightMode ? 'text-black' : 'text-amber-500'}`} />
              <span>{sunlightMode ? t.sunlightActive : t.sunlightMode}</span>
            </button>
          </div>
        </div>

        {/* Formal Tabbed Navigation */}
        <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6">
          <nav className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto py-2 scrollbar-none">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabView)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'worker' && <WorkerPortal lang={lang} />}
        {activeTab === 'scanner' && <AIVisionScanner lang={lang} />}
        {activeTab === 'chat' && <AIChatbot lang={lang} />}
        {activeTab === 'doctor' && <DoctorPortal lang={lang} />}
        {activeTab === 'map' && <OutbreakMap lang={lang} />}
        {activeTab === 'passport' && <PatientQRPassport lang={lang} />}
        {activeTab === 'pharmacy' && <MedicineInventory lang={lang} />}
        {activeTab === 'simulation' && <SimulationLab lang={lang} />}
        {activeTab === 'database' && <DatabaseExplorer lang={lang} />}
      </main>

      {/* Persistent Floating Quick Action Button (FAB) for AI Chatbot */}
      {activeTab !== 'chat' && (
        <button
          onClick={() => setActiveTab('chat')}
          className="fixed bottom-6 right-6 bg-slate-900 hover:bg-black text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 border-2 border-slate-700 z-40 cursor-pointer"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <Bot className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold tracking-wide">
            {lang === 'mr' ? 'आरोग्य साथी AI' : lang === 'hi' ? 'आरोग्य साथी AI' : 'Arogya Sathi AI'}
          </span>
        </button>
      )}
    </div>
  );
};

export default App;