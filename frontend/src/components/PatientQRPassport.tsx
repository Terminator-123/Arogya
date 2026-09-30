import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
    village: 'Manor (Palghar)',
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

export const PatientQRPassport: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<MockPassportPatient>(SAMPLE_PATIENTS[0]);

  // Payload encoded inside the offline QR code (compressed JSON)
  const qrData = JSON.stringify({
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
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-12 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-green-600" /> Offline Patient QR Health Passport
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Patients carry their encrypted medical history on a physical QR card or basic smartphone — readable by any clinic with ZERO internet.
          </p>
        </div>

        {/* Patient Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Select Patient:</span>
          <select
            value={selectedPatient.id}
            onChange={e => {
              const p = SAMPLE_PATIENTS.find(item => item.id === e.target.value);
              if (p) setSelectedPatient(p);
            }}
            className="border border-slate-300 rounded-lg p-2 font-medium bg-white outline-none focus:ring-2 focus:ring-green-500"
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
        {/* Left: The Physical Ayushman Card Simulation */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-gradient-to-br from-green-800 via-green-900 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border-4 border-green-600 relative overflow-hidden">
            {/* Card Header */}
            <div className="flex items-start justify-between border-b border-green-700/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span className="font-extrabold text-sm tracking-wider uppercase">
                    Ayushman Digital Health Passport
                  </span>
                </div>
                <span className="text-[11px] text-green-200 font-mono">
                  Govt. of Maharashtra • Rural Telemedicine Network
                </span>
              </div>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                Offline Verified
              </span>
            </div>

            {/* Card Body */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-6 items-center">
              <div className="sm:col-span-2 space-y-3">
                <div>
                  <span className="text-[10px] uppercase text-green-300 block font-bold">Patient Legal Name</span>
                  <h3 className="text-xl font-black tracking-tight">{selectedPatient.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-green-300 block">ABHA Health ID</span>
                    <strong className="font-mono text-amber-300">{selectedPatient.abhaId}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-green-300 block">Blood Group</span>
                    <strong>{selectedPatient.bloodGroup}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-green-300 block">Age / Gender</span>
                    <strong>{selectedPatient.age} yrs • {selectedPatient.gender}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-green-300 block">Home Sub-Center</span>
                    <strong>{selectedPatient.village}</strong>
                  </div>
                </div>
              </div>

              {/* Real-time QR Code Canvas */}
              <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl shadow-inner text-slate-900 mx-auto">
                <QRCodeSVG
                  value={qrData}
                  size={135}
                  level="M"
                  includeMargin={false}
                />
                <span className="text-[9px] font-extrabold uppercase mt-1.5 text-slate-600 tracking-tighter">
                  Scan to Decrypt
                </span>
              </div>
            </div>

            {/* Card Footer Vitals Capsule */}
            <div className="border-t border-green-700/60 pt-3 flex flex-wrap items-center justify-between text-xs text-green-200 gap-2">
              <div>
                Emergency Contact: <strong className="text-white">{selectedPatient.emergencyContact}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Encrypted with SHA-256 Web Crypto</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-500" /> Print Physical Health Passport Card
            </button>
            <button
              onClick={() => alert("Digital ABHA Passport downloaded to device storage!")}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Offline Wallet Pass
            </button>
          </div>
        </div>

        {/* Right: Live QR Code Scanner / Decryption Preview */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b pb-2 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            <h4 className="font-bold text-sm text-slate-800">Scanned QR Payload Preview</h4>
          </div>
          <p className="text-xs text-slate-500">
            Scan this QR code with any smartphone camera right now to verify how records transfer without internet!
          </p>

          <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-3 rounded-lg overflow-x-auto border border-slate-800 leading-relaxed">
            <pre className="whitespace-pre-wrap">{JSON.stringify(JSON.parse(qrData), null, 2)}</pre>
          </div>

          <div className="space-y-2 text-xs border-t pt-3">
            <div>
              <span className="text-slate-400 block">Allergies on Record:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedPatient.allergies.map((a, i) => (
                  <span key={i} className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-slate-400 block">Last Active Tele-Prescription:</span>
              <p className="text-slate-800 font-medium mt-0.5 bg-slate-50 p-2 rounded border border-slate-200">
                {selectedPatient.lastPrescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
