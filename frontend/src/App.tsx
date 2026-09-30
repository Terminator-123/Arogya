import React, { useState, useEffect } from 'react';
import { NetworkBadge } from './components/NetworkBadge';
import { WorkerPortal } from './components/WorkerPortal';
import { AIVisionScanner } from './components/AIVisionScanner';
import { AIChatbot } from './components/AIChatbot';
import { DoctorPortal } from './components/DoctorPortal';
import { OutbreakMap } from './components/OutbreakMap';
import { PatientQRPassport } from './components/PatientQRPassport';
import { MedicineInventory } from './components/MedicineInventory';
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
  Database,
  Activity,
  Globe,
  Sun,
  Moon,
  PhoneCall,
  Menu,
  X,
  Clock,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

type TabView = 'worker' | 'scanner' | 'chat' | 'doctor' | 'map' | 'passport' | 'pharmacy' | 'database';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('worker');
  const [lang, setLang] = useState<Language>('mr');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('arogya-theme') === 'dark';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) + ' IST'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('arogya-theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('arogya-theme', 'light');
    }
  }, [darkMode]);

  const navItems = [
    { id: 'worker', label: t.tabWorker, icon: Users, badge: null },
    { id: 'scanner', label: t.tabScanner, icon: Camera, badge: 'AI' },
    { id: 'chat', label: t.tabChat, icon: Bot, badge: 'AI Sathi' },
    { id: 'doctor', label: t.tabDoctor, icon: Stethoscope, badge: 'Urgent' },
    { id: 'map', label: t.tabMap, icon: MapPin, badge: 'GIS' },
    { id: 'passport', label: t.tabPassport, icon: QrCode, badge: 'ABHA' },
    { id: 'pharmacy', label: t.tabPharmacy, icon: Pill, badge: 'Stock' },
    { id: 'database', label: t.tabDatabase, icon: Database, badge: 'SQLite' },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors relative selection:bg-blue-600 selection:text-white ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* 1. Formal Top Government Ribbon */}
      <div className="bg-slate-950 text-slate-300 text-[11px] px-4 sm:px-6 py-1.5 border-b border-slate-800 flex flex-wrap items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">🇮🇳 {lang === 'mr' ? 'सत्यमेव जयते' : lang === 'hi' ? 'सत्यमेव जयते' : 'Satyameva Jayate'}</span>
          <span className="text-slate-500">|</span>
          <span>{t.govHeader}</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{currentTime || '14:30:00 IST'}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.districtBadge}</span>
          </div>
        </div>
      </div>

      {/* 2. Real-time Connection Bar */}
      <NetworkBadge lang={lang} />

      {/* 3. Main Formal Header */}
      <header className="bg-white border-b border-slate-200/90 shadow-sm sticky top-0 z-30 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center text-white shadow-md shadow-blue-950/20 border border-slate-800 ring-2 ring-emerald-500/30">
              <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase flex items-center gap-1.5">
                  {t.appTitle}
                </h1>
                <span className="text-[10px] font-extrabold uppercase bg-blue-900 text-blue-100 px-2 py-0.5 rounded-md border border-blue-800 tracking-wider shadow-xs">
                  NHM v2.5
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Offline-First
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Action Center (108 Emergency, Language, Sunlight, Mobile Menu) */}
          <div className="flex items-center gap-2">
            {/* 108 Emergency Hotline Hotkey */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="hidden lg:flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm shadow-red-600/30 cursor-pointer animate-pulse"
              title="108 Emergency Ambulance Dispatch Protocol"
            >
              <PhoneCall className="w-3.5 h-3.5 text-white" />
              <span>१०८ Emergency</span>
            </button>

            {/* Regional Language Switcher */}
            <div className="flex items-center bg-slate-100/90 rounded-lg p-1 border border-slate-300 text-xs shadow-xs">
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-md font-bold cursor-pointer transition ${
                  lang === 'en' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:text-black'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('mr')}
                className={`px-2 py-1 rounded-md font-bold cursor-pointer transition ${
                  lang === 'mr' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:text-black'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2 py-1 rounded-md font-bold cursor-pointer transition ${
                  lang === 'hi' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:text-black'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? t.themeLight : t.themeDark}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                darkMode
                  ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
              <span className="hidden sm:inline">{darkMode ? t.themeLight : t.themeDark}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 4. Desktop Navigation Bar with Badges */}
        <div className="hidden sm:block border-t border-slate-200 bg-slate-50/80 px-4 sm:px-6">
          <nav className="max-w-7xl mx-auto flex space-x-1.5 overflow-x-auto py-2 scrollbar-none">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabView)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                        isActive
                          ? 'bg-emerald-400 text-slate-950'
                          : item.badge === 'Urgent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 5. Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white p-3 space-y-1 shadow-lg animate-fade-in">
            <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">
              {lang === 'mr' ? 'आरोग्य विभाग विभागणी' : 'Telemedicine Modules'}
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabView);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={() => {
                setShowEmergencyModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg text-xs font-bold bg-red-600 text-white mt-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>१०८ Emergency Ambulance Dispatch</span>
            </button>
          </div>
        )}
      </header>

      {/* 6. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 sm:pb-8">
        {activeTab === 'worker' && <WorkerPortal lang={lang} />}
        {activeTab === 'scanner' && <AIVisionScanner lang={lang} />}
        {activeTab === 'chat' && <AIChatbot lang={lang} />}
        {activeTab === 'doctor' && <DoctorPortal lang={lang} />}
        {activeTab === 'map' && <OutbreakMap lang={lang} />}
        {activeTab === 'passport' && <PatientQRPassport lang={lang} />}
        {activeTab === 'pharmacy' && <MedicineInventory lang={lang} />}
        {activeTab === 'database' && <DatabaseExplorer lang={lang} />}
      </main>

      {/* 7. Persistent Floating Quick Action Button (FAB) for AI Chatbot */}
      {activeTab !== 'chat' && (
        <button
          onClick={() => setActiveTab('chat')}
          className="fixed bottom-20 sm:bottom-6 right-5 bg-gradient-to-r from-blue-900 to-slate-900 hover:from-black hover:to-slate-950 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 border border-slate-700 z-40 cursor-pointer"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <Bot className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold tracking-wide">
            {lang === 'mr' ? 'आरोग्य साथी AI' : lang === 'hi' ? 'आरोग्य साथी AI' : 'Arogya Sathi AI'}
          </span>
        </button>
      )}

      {/* 8. Mobile Native Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-300 py-2 px-3 flex items-center justify-around z-40 shadow-xl">
        <button
          onClick={() => setActiveTab('worker')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'worker' ? 'text-blue-900' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Intake</span>
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'scanner' ? 'text-blue-900' : 'text-slate-500'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span>Scanner</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'chat' ? 'text-blue-900' : 'text-slate-500'
          }`}
        >
          <Bot className="w-5 h-5" />
          <span>AI Sathi</span>
        </button>

        <button
          onClick={() => setActiveTab('doctor')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'doctor' ? 'text-blue-900' : 'text-slate-500'
          }`}
        >
          <Stethoscope className="w-5 h-5" />
          <span>Doctor</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-500"
        >
          <Menu className="w-5 h-5" />
          <span>More...</span>
        </button>
      </div>

      {/* 9. Emergency 108 Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-red-300 shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-red-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-lg">
                <ShieldAlert className="w-6 h-6" />
                <span>१०८ Emergency Medical Response</span>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-slate-800">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-950 font-medium">
                🚨 <strong>National Emergency Protocol (Palghar District):</strong> Dial 108 immediately for Advanced Life Support (ALS) Ambulance transfer for Code Red MEWS patients or severe envenomation.
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Ambulance Emergency Dispatch:</span>
                  <a href="tel:108" className="font-bold text-red-600 text-base hover:underline">
                    📞 108 (Toll-Free)
                  </a>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Palghar District Civil Hospital:</span>
                  <span className="font-mono text-slate-900">+91 2525 252200</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Manor Sub-District Hospital:</span>
                  <span className="font-mono text-slate-900">+91 2525 272102</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-end">
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;