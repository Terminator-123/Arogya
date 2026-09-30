import React, { useState } from 'react';
import { TRANSLATIONS, type Language } from '../utils/i18n';
import { MapPin, AlertTriangle, Activity, ShieldAlert, ChevronRight } from 'lucide-react';

interface VillageCluster {
  id: string;
  name: string;
  taluka: string;
  activeCases: number;
  redCases: number;
  yellowCases: number;
  greenCases: number;
  topSymptom: string;
  outbreakAlert?: string;
  ambulanceEta: string;
  ashaWorkers: string[];
}

const VILLAGES: VillageCluster[] = [
  {
    id: 'MH-PAL-01',
    name: 'Jawhar Tribal Sub-Center',
    taluka: 'Jawhar',
    activeCases: 14,
    redCases: 4,
    yellowCases: 7,
    greenCases: 3,
    topSymptom: 'High Fever & Acute Dehydration',
    outbreakAlert: 'Cluster Alert: Suspected Viral Gastroenteritis (4 cases in 24h)',
    ambulanceEta: '18 mins (PHC Jawhar)',
    ashaWorkers: ['Kavita Bhor', 'Sunita Jadhav']
  },
  {
    id: 'MH-PAL-02',
    name: 'Manor Rural Dispensary',
    taluka: 'Palghar',
    activeCases: 8,
    redCases: 2,
    yellowCases: 4,
    greenCases: 2,
    topSymptom: 'Chest Pain & Breathlessness',
    ambulanceEta: '12 mins (Sub-District Hospital)',
    ashaWorkers: ['Savita Pawar']
  },
  {
    id: 'MH-PAL-03',
    name: 'Mokhada Hill Hamlet',
    taluka: 'Mokhada',
    activeCases: 19,
    redCases: 6,
    yellowCases: 9,
    greenCases: 4,
    topSymptom: 'Persistent Cough & Malnutrition',
    outbreakAlert: 'Respiratory Infection Cluster (Pediatric spike)',
    ambulanceEta: '34 mins (Rough Terrain)',
    ashaWorkers: ['Meena Gaikwad', 'Vandana Wagh']
  },
  {
    id: 'MH-PAL-04',
    name: 'Vikramgad Primary Sub-Center',
    taluka: 'Vikramgad',
    activeCases: 6,
    redCases: 1,
    yellowCases: 3,
    greenCases: 2,
    topSymptom: 'Fever with Chills',
    ambulanceEta: '15 mins',
    ashaWorkers: ['Asha Shinde']
  },
  {
    id: 'MH-PAL-05',
    name: 'Dahanu Coastal Hamlet',
    taluka: 'Dahanu',
    activeCases: 11,
    redCases: 3,
    yellowCases: 5,
    greenCases: 3,
    topSymptom: 'Joint Pain & Skin Rash',
    ambulanceEta: '22 mins',
    ashaWorkers: ['Radha Tandel', 'Priti Raut']
  }
];

interface OutbreakMapProps {
  lang?: Language;
}

export const OutbreakMap: React.FC<OutbreakMapProps> = ({ lang = 'mr' }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;
  const [selectedVillage, setSelectedVillage] = useState<VillageCluster>(VILLAGES[0]);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'CRITICAL'>('ALL');

  const filteredVillages = filterLevel === 'CRITICAL'
    ? VILLAGES.filter(v => v.redCases >= 3 || v.outbreakAlert)
    : VILLAGES;

  const totalCases = VILLAGES.reduce((acc, v) => acc + v.activeCases, 0);
  const totalRed = VILLAGES.reduce((acc, v) => acc + v.redCases, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-5 pb-12 font-sans">
      {/* Formal Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-300 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-slate-800" /> {t.mapTitle}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">{t.mapDesc}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-center">
            <span className="block text-[10px] font-bold text-red-700 uppercase">{t.criticalAlerts}</span>
            <span className="text-lg font-black text-red-800">{totalRed}</span>
          </div>
          <div className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-center">
            <span className="block text-[10px] font-bold text-slate-700 uppercase">{t.totalCases}</span>
            <span className="text-lg font-black text-slate-900">{totalCases}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Village Grid */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-700" /> {t.subCenterFeed}
            </h3>
            <div className="flex gap-1.5 text-xs">
              <button
                onClick={() => setFilterLevel('ALL')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer border ${
                  filterLevel === 'ALL' 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t.filterAll} ({VILLAGES.length})
              </button>
              <button
                onClick={() => setFilterLevel('CRITICAL')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer border flex items-center gap-1 ${
                  filterLevel === 'CRITICAL' 
                    ? 'bg-red-700 text-white border-red-700' 
                    : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> {t.filterHigh}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredVillages.map(village => (
              <div
                key={village.id}
                onClick={() => setSelectedVillage(village)}
                className={`p-4 rounded-xl border transition-all cursor-pointer bg-white relative overflow-hidden ${
                  selectedVillage.id === village.id
                    ? 'ring-2 ring-slate-900 border-slate-900 shadow-md'
                    : 'border-slate-300 hover:border-slate-400 hover:shadow-xs'
                }`}
              >
                {village.outbreakAlert && (
                  <div className="absolute top-0 right-0 bg-red-700 text-white text-[9px] font-black px-2 py-0.5 rounded-bl tracking-wider">
                    {t.outbreakRisk}
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{village.name}</h4>
                    <span className="text-xs text-slate-500 font-medium">Taluka: {village.taluka}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[11px] mb-1 font-medium">
                    <span className="text-slate-600">{t.activeLabel}: <strong>{village.activeCases}</strong></span>
                    <span className="text-red-700 font-bold">{village.redCases} Critical</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex border border-slate-200">
                    <div style={{ width: `${(village.redCases / village.activeCases) * 100}%` }} className="bg-red-600 h-full" />
                    <div style={{ width: `${(village.yellowCases / village.activeCases) * 100}%` }} className="bg-amber-400 h-full" />
                    <div style={{ width: `${(village.greenCases / village.activeCases) * 100}%` }} className="bg-emerald-600 h-full" />
                  </div>
                </div>

                <div className="mt-2.5 text-[11px] text-slate-600 flex items-center justify-between border-t pt-2">
                  <span className="truncate max-w-[170px]">Symptoms: <strong>{village.topSymptom}</strong></span>
                  <span className="text-slate-900 font-bold flex items-center gap-0.5">
                    {t.inspectVillage} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Village Surveillance Deep-Dive */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm space-y-4 sticky top-4">
            <div className="border-b pb-3">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {selectedVillage.id}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">{selectedVillage.name}</h3>
              <p className="text-xs text-slate-500 font-medium">Public Health Department • Palghar Division</p>
            </div>

            {selectedVillage.outbreakAlert ? (
              <div className="bg-red-50 border border-red-200 text-red-900 p-3 rounded-lg text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-800">
                  <ShieldAlert className="w-4 h-4 text-red-700" /> Epidemiological Anomaly Flagged
                </div>
                <p className="text-red-950 leading-relaxed font-medium">{selectedVillage.outbreakAlert}</p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3 rounded-lg text-xs">
                <div className="font-bold text-emerald-900">Normal Epidemiological Baseline</div>
                <p className="text-emerald-800 mt-0.5">No localized pathogen clustering detected in last 72 hours.</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-red-50 p-2 rounded-lg border border-red-200">
                <span className="block text-red-700 text-[10px] font-bold">Code Red</span>
                <span className="text-base font-black text-red-800">{selectedVillage.redCases}</span>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                <span className="block text-amber-800 text-[10px] font-bold">Code Yellow</span>
                <span className="text-base font-black text-amber-900">{selectedVillage.yellowCases}</span>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <span className="block text-emerald-800 text-[10px] font-bold">Code Green</span>
                <span className="text-base font-black text-emerald-900">{selectedVillage.greenCases}</span>
              </div>
            </div>

            <div className="text-xs space-y-2 border-t pt-3 text-slate-700">
              <div>
                <span className="text-slate-500 block">{t.transitTime}:</span>
                <strong className="text-slate-900 font-bold">{selectedVillage.ambulanceEta}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">{t.assignedWorkers}:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedVillage.ashaWorkers.map((w, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => alert(`Direct protocol broadcast sent to ${selectedVillage.name} ASHA team!`)}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer shadow-xs"
            >
              {t.broadcastAlert}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
