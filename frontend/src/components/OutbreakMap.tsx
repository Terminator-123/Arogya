import React, { useState } from 'react';
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

export const OutbreakMap: React.FC = () => {
  const [selectedVillage, setSelectedVillage] = useState<VillageCluster>(VILLAGES[0]);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'CRITICAL'>('ALL');

  const filteredVillages = filterLevel === 'CRITICAL'
    ? VILLAGES.filter(v => v.redCases >= 3 || v.outbreakAlert)
    : VILLAGES;

  const totalCases = VILLAGES.reduce((acc, v) => acc + v.activeCases, 0);
  const totalRed = VILLAGES.reduce((acc, v) => acc + v.redCases, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-green-600" /> Rural Village Outbreak & Epidemiology GIS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregates offline-synced triage data across Palghar tribal district sub-centers to spot disease clusters.
          </p>
        </div>

        {/* Global Acuity Ticker */}
        <div className="flex items-center gap-3">
          <div className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-center">
            <span className="block text-[10px] font-bold text-red-600 uppercase">Emergency Code Red</span>
            <span className="text-lg font-black text-red-700">{totalRed} Patients</span>
          </div>
          <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-center">
            <span className="block text-[10px] font-bold text-slate-600 uppercase">Total Field Cases</span>
            <span className="text-lg font-black text-slate-800">{totalCases} Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Sub-Center Map / Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-green-600" /> Sub-Center Surveillance Feed
            </h3>
            <div className="flex gap-1.5 text-xs">
              <button
                onClick={() => setFilterLevel('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  filterLevel === 'ALL' ? 'bg-green-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Villages ({VILLAGES.length})
              </button>
              <button
                onClick={() => setFilterLevel('CRITICAL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                  filterLevel === 'CRITICAL' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> High Risk Only
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
                    ? 'ring-2 ring-green-600 border-green-600 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {village.outbreakAlert && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl">
                    OUTBREAK RISK
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{village.name}</h4>
                    <span className="text-xs text-slate-500">Taluka: {village.taluka}</span>
                  </div>
                </div>

                {/* Patient Severity Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Active: <strong>{village.activeCases}</strong></span>
                    <span className="text-red-600 font-bold">{village.redCases} Critical</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div style={{ width: `${(village.redCases / village.activeCases) * 100}%` }} className="bg-red-500 h-full" />
                    <div style={{ width: `${(village.yellowCases / village.activeCases) * 100}%` }} className="bg-amber-400 h-full" />
                    <div style={{ width: `${(village.greenCases / village.activeCases) * 100}%` }} className="bg-green-500 h-full" />
                  </div>
                </div>

                <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between border-t pt-2">
                  <span className="truncate max-w-[170px]">Dominant: <strong>{village.topSymptom}</strong></span>
                  <span className="text-green-700 font-medium flex items-center">
                    Inspect <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Detailed Village Outbreak Deep Dive */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 sticky top-4">
            <div className="border-b pb-3">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {selectedVillage.id}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">{selectedVillage.name}</h3>
              <p className="text-xs text-slate-500">District: Palghar • Primary Care Cluster</p>
            </div>

            {selectedVillage.outbreakAlert ? (
              <div className="bg-red-50 border border-red-200 text-red-900 p-3 rounded-lg text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-700">
                  <ShieldAlert className="w-4 h-4 text-red-600" /> Epidemiological Anomaly Flagged
                </div>
                <p className="text-red-800 leading-relaxed">{selectedVillage.outbreakAlert}</p>
                <div className="pt-1 text-[11px] text-red-600 font-semibold">
                  Action: Automated notification sent to District Surveillance Officer (IDSP).
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-lg text-xs">
                <div className="font-bold text-emerald-800">Normal Epidemiological Baseline</div>
                <p className="text-emerald-700 mt-0.5">No acute localized transmission spikes detected.</p>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                <span className="block text-red-600 text-[10px] font-bold">Code Red</span>
                <span className="text-base font-extrabold text-red-700">{selectedVillage.redCases}</span>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                <span className="block text-amber-600 text-[10px] font-bold">Code Yellow</span>
                <span className="text-base font-extrabold text-amber-700">{selectedVillage.yellowCases}</span>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <span className="block text-emerald-600 text-[10px] font-bold">Code Green</span>
                <span className="text-base font-extrabold text-emerald-700">{selectedVillage.greenCases}</span>
              </div>
            </div>

            <div className="text-xs space-y-2 border-t pt-3 text-slate-600">
              <div>
                <span className="text-slate-400 block">108 Emergency Ambulance Transit Time:</span>
                <strong className="text-slate-800">{selectedVillage.ambulanceEta}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Assigned Frontline ASHA Workers:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedVillage.ashaWorkers.map((w, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => alert(`Emergency Tele-Alert broadcast to ${selectedVillage.name} ASHA team!`)}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer shadow-sm"
            >
              Broadcast Protocol to Village ASHA Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
