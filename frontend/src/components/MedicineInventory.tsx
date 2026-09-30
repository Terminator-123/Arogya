import React, { useState } from 'react';
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
    category: 'Emergency Antidote',
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
    subCenter: 'Manor Dispensary',
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

export const MedicineInventory: React.FC = () => {
  const [medicines, setMedicines] = useState<MedicineStock[]>(INITIAL_MEDICINES);
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);

  const handleEmergencyDispatch = (id: string, name: string) => {
    setDispatchedId(id);
    setTimeout(() => {
      setMedicines(prev =>
        prev.map(m => (m.id === id ? { ...m, stockLevel: m.minRequired + 5, urgency: 'OPTIMAL' } : m))
      );
      setDispatchedId(null);
      alert(`Emergency 108 Ambulance Dispatch Confirmed for ${name}! Stock replenished.`);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 pb-12 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Pill className="w-6 h-6 text-green-600" /> Rural Sub-Center Medicine Stock & Restock Hub
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tracks life-saving antidotes and essential medicines in offline-prone rural clinics with one-click emergency resupply.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-red-100 text-red-800 font-bold px-3 py-1.5 rounded-lg border border-red-200 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-red-600" />
            {medicines.filter(m => m.urgency === 'CRITICAL').length} Critical Deficits
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {medicines.map(med => (
          <div
            key={med.id}
            className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between transition-all ${
              med.urgency === 'CRITICAL' ? 'border-red-300 ring-1 ring-red-200' :
              med.urgency === 'LOW' ? 'border-amber-300' : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {med.subCenter}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  med.urgency === 'CRITICAL' ? 'bg-red-100 text-red-800 animate-pulse' :
                  med.urgency === 'LOW' ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {med.urgency}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 mt-1">{med.name}</h4>
              <span className="text-xs text-slate-500 block">{med.category}</span>

              {/* Stock Indicator Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Available Stock:</span>
                  <strong className={med.stockLevel < med.minRequired ? 'text-red-600' : 'text-slate-800'}>
                    {med.stockLevel} / {med.minRequired} {med.unit}
                  </strong>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (med.stockLevel / med.minRequired) * 100)}%` }}
                    className={`h-full transition-all ${
                      med.urgency === 'CRITICAL' ? 'bg-red-500' :
                      med.urgency === 'LOW' ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              {med.urgency !== 'OPTIMAL' ? (
                <button
                  onClick={() => handleEmergencyDispatch(med.id, med.name)}
                  disabled={dispatchedId === med.id}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {dispatchedId === med.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispatching via 108...
                    </>
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5" /> Emergency 108 Resupply
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center text-xs text-emerald-700 font-semibold py-1.5 bg-emerald-50 rounded-lg flex items-center justify-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" /> Sufficient Buffer Stock
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
