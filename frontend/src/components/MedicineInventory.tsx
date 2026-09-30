import React, { useState } from 'react';
import { TRANSLATIONS, type Language } from '../utils/i18n';
import { Pill, AlertOctagon, Truck, Check, RefreshCw } from 'lucide-react';

interface MedicineStock {
  id: string;
  name: string;
  category: string;
  stockLevel: number;
  minRequired: number;
  unit: string;
  subCenter: string;
  urgency: 'CRITICAL' | 'LOW' | 'OPTIMAL';
}

const INITIAL_MEDICINES: MedicineStock[] = [
  {
    id: 'MED-01',
    name: 'Polyvalent Anti-Snake Venom (ASV)',
    category: 'Emergency Antidote (ICU)',
    stockLevel: 2,
    minRequired: 10,
    unit: 'vials',
    subCenter: 'Jawhar Tribal Sub-Center',
    urgency: 'CRITICAL'
  },
  {
    id: 'MED-02',
    name: 'Oral Rehydration Salts (ORS) WHO Formula',
    category: 'Dehydration / Diarrhea',
    stockLevel: 14,
    minRequired: 50,
    unit: 'sachets',
    subCenter: 'Jawhar Tribal Sub-Center',
    urgency: 'LOW'
  },
  {
    id: 'MED-03',
    name: 'Paracetamol 650mg Tab',
    category: 'Antipyretic / Analgesic',
    stockLevel: 120,
    minRequired: 80,
    unit: 'tablets',
    subCenter: 'Manor Rural Dispensary',
    urgency: 'OPTIMAL'
  },
  {
    id: 'MED-04',
    name: 'Normal Saline 0.9% IV Infusion (500ml)',
    category: 'IV Resuscitation Fluids',
    stockLevel: 3,
    minRequired: 15,
    unit: 'bottles',
    subCenter: 'Mokhada Hill Hamlet',
    urgency: 'CRITICAL'
  },
  {
    id: 'MED-05',
    name: 'Amoxicillin 500mg Capsules',
    category: 'Broad-Spectrum Antibiotic',
    stockLevel: 28,
    minRequired: 60,
    unit: 'capsules',
    subCenter: 'Vikramgad Sub-Center',
    urgency: 'LOW'
  },
  {
    id: 'MED-06',
    name: 'Iron Folic Acid (IFA) Tablets (Maternal)',
    category: 'Antenatal Nutrition',
    stockLevel: 240,
    minRequired: 150,
    unit: 'tablets',
    subCenter: 'Dahanu Sub-Center',
    urgency: 'OPTIMAL'
  }
];

interface MedicineInventoryProps {
  lang?: Language;
}

export const MedicineInventory: React.FC<MedicineInventoryProps> = ({ lang = 'mr' }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;
  const [medicines, setMedicines] = useState<MedicineStock[]>(INITIAL_MEDICINES);
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);

  const handleEmergencyDispatch = (id: string, name: string) => {
    setDispatchedId(id);
    setTimeout(() => {
      setMedicines(prev =>
        prev.map(m => (m.id === id ? { ...m, stockLevel: m.minRequired + 5, urgency: 'OPTIMAL' } : m))
      );
      setDispatchedId(null);
      alert(lang === 'mr' ? `१०८ रुग्णवाहिका द्वारे ${name} चा पुरवठा रवाना करण्यात आला!` : `Emergency 108 Ambulance Dispatch Confirmed for ${name}! Stock replenished.`);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-5 pb-12 font-sans">
      {/* Formal Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-300 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-slate-800" /> {t.pharmacyTitle}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">{t.pharmacyDesc}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-red-50 text-red-800 font-bold px-3 py-1.5 rounded-lg border border-red-200 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-red-600" />
            {medicines.filter(m => m.urgency === 'CRITICAL').length} {t.criticalDeficits}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {medicines.map(med => (
          <div
            key={med.id}
            className={`bg-white rounded-xl border p-4.5 shadow-xs flex flex-col justify-between transition-all ${
              med.urgency === 'CRITICAL' ? 'border-red-300 ring-1 ring-red-300' :
              med.urgency === 'LOW' ? 'border-amber-300' : 'border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {med.subCenter}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  med.urgency === 'CRITICAL' ? 'bg-red-50 text-red-800 border-red-200 animate-pulse' :
                  med.urgency === 'LOW' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                  'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}>
                  {med.urgency}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 mt-1">{med.name}</h4>
              <span className="text-xs text-slate-500 font-medium block">{med.category}</span>

              {/* Stock Indicator Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-600">{t.availableStock}:</span>
                  <strong className={med.stockLevel < med.minRequired ? 'text-red-700 font-bold' : 'text-slate-900'}>
                    {med.stockLevel} / {med.minRequired} {med.unit}
                  </strong>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                  <div
                    style={{ width: `${Math.min(100, (med.stockLevel / med.minRequired) * 100)}%` }}
                    className={`h-full transition-all ${
                      med.urgency === 'CRITICAL' ? 'bg-red-600' :
                      med.urgency === 'LOW' ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              {med.urgency !== 'OPTIMAL' ? (
                <button
                  onClick={() => handleEmergencyDispatch(med.id, med.name)}
                  disabled={dispatchedId === med.id}
                  className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {dispatchedId === med.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t.dispatching}
                    </>
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5" /> {t.emergencyResupply}
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center text-xs text-emerald-900 font-bold py-1.5 bg-emerald-50 rounded-lg flex items-center justify-center gap-1 border border-emerald-200">
                  <Check className="w-4 h-4 text-emerald-700" /> {t.sufficientStock}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
