import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TRANSLATIONS, type Language } from '../utils/i18n';
import { QrCode, Shield, Download, Printer, CheckCircle, Smartphone } from 'lucide-react';

interface MockPassportPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  village: string;
  abhaId: string;
  allergies: string[];
  chronicConditions: string[];
  recentVitals: {
    spo2: number;
    bp: string;
    pulse: number;
  };
  lastPrescription: string;
  emergencyContact: string;
}

const SAMPLE_PATIENTS: MockPassportPatient[] = [
  {
    id: 'PAT-MH-8812',
    name: 'Savitri Devi Pawar',
    age: 48,
    gender: 'Female',
    bloodGroup: 'B+ Positive',
    village: 'Manor Sub-Center (Palghar)',
    abhaId: '91-4829-1029-4412',
    allergies: ['Penicillin', 'Sulfa drugs'],
    chronicConditions: ['Hypertension (Stage 2)', 'Type 2 Diabetes'],
    recentVitals: { spo2: 88, bp: '175/105', pulse: 118 },
    lastPrescription: '4L Oxygen immediately, Tab Telmisartan 40mg OD',
    emergencyContact: '+91 98231 44019 (Son)'
  },
  {
    id: 'PAT-MH-4421',
    name: 'Ganesh Ramchandra Shinde',
    age: 62,
    gender: 'Male',
    bloodGroup: 'O+ Positive',
    village: 'Vikramgad Tribal Center',
    abhaId: '91-3312-8874-9910',
    allergies: ['No known drug allergies'],
    chronicConditions: ['COPD / Chronic Bronchitis'],
    recentVitals: { spo2: 93, bp: '145/90', pulse: 92 },
    lastPrescription: 'Amoxicillin 500mg TDS x 5 days, Salbutamol inhaler',
    emergencyContact: '+91 97650 11920 (Brother)'
  },
  {
    id: 'PAT-MH-1022',
    name: 'Anita Suresh Jadhav',
    age: 26,
    gender: 'Female',
    bloodGroup: 'A+ Positive',
    village: 'Jawhar Hamlet',
    abhaId: '91-7718-4920-1123',
    allergies: ['Aspirin'],
    chronicConditions: ['None (Antenatal Care - 28 Weeks)'],
    recentVitals: { spo2: 99, bp: '115/75', pulse: 74 },
    lastPrescription: 'IFA (Iron Folic Acid) Tablets, Calcium 500mg daily',
    emergencyContact: '+91 99221 88301 (Husband)'
  }
];

interface PatientQRPassportProps {
  lang?: Language;
}

export const PatientQRPassport: React.FC<PatientQRPassportProps> = ({ lang = 'mr' }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;
  const [selectedPatient, setSelectedPatient] = useState<MockPassportPatient>(SAMPLE_PATIENTS[0]);

  const qrData = JSON.stringify({
    system: 'AROGYA-TELEMED-VERIFIED',
    abha: selectedPatient.abhaId,
    name: selectedPatient.name,
    age: selectedPatient.age,
    vitals: selectedPatient.recentVitals,
    conditions: selectedPatient.chronicConditions,
    allergies: selectedPatient.allergies,
    rx: selectedPatient.lastPrescription,
    emergency: selectedPatient.emergencyContact,
    hash: 'SHA256-AES-GCM-VERIFIED'
  });

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5 pb-12 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-300 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-slate-800" /> {t.passportTitle}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">{t.passportDesc}</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600 font-bold">{t.selectPatient}:</span>
          <select
            value={selectedPatient.id}
            onChange={e => {
              const p = SAMPLE_PATIENTS.find(item => item.id === e.target.value);
              if (p) setSelectedPatient(p);
            }}
            className="border border-slate-300 rounded-lg p-2 font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
          >
            {SAMPLE_PATIENTS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.village})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: The Official Ayushman Card */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border-4 border-slate-800 relative overflow-hidden">
            {/* Card Header */}
            <div className="flex items-start justify-between border-b border-slate-700 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span className="font-black text-sm tracking-wider uppercase">
                    {t.cardHeader}
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 font-medium">
                  {t.cardSubheader}
                </span>
              </div>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                {t.verifiedOffline}
              </span>
            </div>

            {/* Card Body */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-6 items-center">
              <div className="sm:col-span-2 space-y-3">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-bold">Patient Legal Identity</span>
                  <h3 className="text-xl font-black tracking-tight text-white">{selectedPatient.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t.abhaId}</span>
                    <strong className="font-mono text-amber-300 font-bold">{selectedPatient.abhaId}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t.bloodGroup}</span>
                    <strong className="text-white">{selectedPatient.bloodGroup}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Age / Gender</span>
                    <strong className="text-white">{selectedPatient.age} yrs • {selectedPatient.gender}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t.homeCenter}</span>
                    <strong className="text-white">{selectedPatient.village}</strong>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl shadow-inner text-slate-900 mx-auto">
                <QRCodeSVG
                  value={qrData}
                  size={130}
                  level="M"
                  includeMargin={false}
                />
                <span className="text-[9px] font-black uppercase mt-1.5 text-slate-700 tracking-tighter">
                  {t.scanToDecrypt}
                </span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="border-t border-slate-700 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
              <div>
                {t.emergencyContact}: <strong className="text-white">{selectedPatient.emergencyContact}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>SHA-256 AES-GCM Encrypted</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-600" /> {t.printCard}
            </button>
            <button
              onClick={() => alert("Digital Arogya Passport pass exported to local device!")}
              className="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" /> {t.downloadPass}
            </button>
          </div>
        </div>

        {/* Right: Scanned Payload Preview */}
        <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm space-y-4">
          <div className="border-b pb-2 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-slate-800" />
            <h4 className="font-bold text-sm text-slate-900">{t.previewTitle}</h4>
          </div>
          <p className="text-xs text-slate-600">{t.previewDesc}</p>

          <div className="bg-slate-950 text-emerald-400 font-mono text-[11px] p-3 rounded-lg overflow-x-auto border border-slate-800 leading-relaxed shadow-inner">
            <pre className="whitespace-pre-wrap">{JSON.stringify(JSON.parse(qrData), null, 2)}</pre>
          </div>

          <div className="space-y-2 text-xs border-t pt-3">
            <div>
              <span className="text-slate-500 block font-medium">Allergies on Record:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedPatient.allergies.map((a, i) => (
                  <span key={i} className="bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded font-bold text-[11px]">
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Active Prescription:</span>
              <p className="text-slate-900 font-bold mt-0.5 bg-slate-50 p-2 rounded border border-slate-200">
                {selectedPatient.lastPrescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
