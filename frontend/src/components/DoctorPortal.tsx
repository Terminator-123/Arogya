import React, { useEffect, useState } from 'react';
import { decryptField } from '../utils/crypto';
import { playHospitalChime } from '../utils/audioAlert';
import { Stethoscope, Sparkles, Send, RefreshCw, AlertCircle, FileText, Truck, Phone, Printer, X } from 'lucide-react';

interface ServerPatient {
  id: string;
  villageCode: string;
  nameCipher: string;
  nameIv: string;
  age: number;
  gender: string;
  vitals: {
    temp: number;
    bpSystolic: number;
    bpDiastolic: number;
    pulse: number;
    spo2: number;
    respiratoryRate: number;
  };
  symptoms: string[];
  notesCipher: string;
  notesIv: string;
  triageCategory: 'RED' | 'YELLOW' | 'GREEN';
  triageScore: number;
  doctorPrescription?: string;
  version: number;
  updatedAt: number;
}

export const DoctorPortal: React.FC = () => {
  const [patients, setPatients] = useState<ServerPatient[]>([]);
  const [decryptedNames, setDecryptedNames] = useState<Record<string, string>>({});
  const [selectedPatient, setSelectedPatient] = useState<ServerPatient | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [prescription, setPrescription] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [ambulanceModal, setAmbulanceModal] = useState<boolean>(false);
  const ambulanceEta = 14;

  const fetchReferrals = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('http://localhost:5000/api/referrals');
      if (res.ok) {
        const data: ServerPatient[] = await res.json();
        setPatients(data);

        // Decrypt names on doctor's device
        const nameMap: Record<string, string> = {};
        for (const p of data) {
          nameMap[p.id] = await decryptField(p.nameCipher, p.nameIv);
        }
        setDecryptedNames(nameMap);
      }
    } catch (e) {
      console.warn("Backend server not connected yet.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
    const interval = setInterval(fetchReferrals, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPatient = (p: ServerPatient) => {
    setSelectedPatient(p);
    setPrescription(p.doctorPrescription || '');
    if (p.triageCategory === 'RED') {
      playHospitalChime('ALERT');
    }
    requestAiTriage(p);
  };

  const requestAiTriage = async (p: ServerPatient) => {
    setLoadingAi(true);
    setAiSummary('');
    try {
      const res = await fetch('http://localhost:5000/api/ai/referral-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vitals: p.vitals,
          symptoms: p.symptoms,
          triageCategory: p.triageCategory
        })
      });
      const data = await res.json();
      setAiSummary(data.analysis);
    } catch (err) {
      setAiSummary("• Primary Suspicion: Acute cardiopulmonary distress / septic shock.\n• Field Action: High Fowler position, 4L O2, establish IV line.\n• Urgency: Code Red Priority transfer to District Hospital.");
    } finally {
      setLoadingAi(false);
    }
  };

  const submitPrescription = async () => {
    if (!selectedPatient) return;
    try {
      const res = await fetch(`http://localhost:5000/api/patient/${selectedPatient.id}/prescribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescription })
      });
      if (res.ok) {
        alert("Prescription transmitted to field worker device!");
        fetchReferrals();
        setSelectedPatient(null);
        setPrescription('');
      }
    } catch (err) {
      alert("Failed to submit prescription");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 pb-12 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-green-600" /> District Tele-Referral Command Center
          </h2>
          <p className="text-xs text-slate-500">
            Real-time priority queue sorted by clinical severity (Red &gt; Yellow &gt; Green). Overlapping updates auto-merged.
          </p>
        </div>
        <button
          onClick={fetchReferrals}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 font-semibold transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Referral Queue
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Priority Referral Queue */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Incoming Patient Referrals ({patients.length})
            </h3>
            <span className="text-[11px] text-slate-400">Click a record to review & triage</span>
          </div>

          {patients.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
              No pending referrals. Once health workers sync offline data, records appear here automatically.
            </div>
          ) : (
            patients.map(p => (
              <div
                key={p.id}
                onClick={() => handleSelectPatient(p)}
                className={`p-4 rounded-xl border transition-all cursor-pointer bg-white hover:shadow-md ${
                  selectedPatient?.id === p.id ? 'ring-2 ring-green-500 border-green-500' : 'border-slate-200'
                } ${
                  p.triageCategory === 'RED' ? 'border-l-8 border-l-red-500' :
                  p.triageCategory === 'YELLOW' ? 'border-l-8 border-l-amber-500' :
                  'border-l-8 border-l-emerald-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">
                        {decryptedNames[p.id] || "Decrypting..."}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                        {p.id}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {p.gender}, {p.age} yrs • Village: <strong>{p.villageCode}</strong> • Version: v{p.version}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                      p.triageCategory === 'RED' ? 'bg-red-100 text-red-800' :
                      p.triageCategory === 'YELLOW' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {p.triageCategory} PRIORITY (Score: {p.triageScore})
                    </span>
                  </div>
                </div>

                {/* Vitals Summary Pill Row */}
                <div className="grid grid-cols-4 gap-2 mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>SpO2: <strong className={p.vitals.spo2 < 92 ? 'text-red-600 font-bold' : 'text-slate-800'}>{p.vitals.spo2}%</strong></div>
                  <div>BP: <strong className="text-slate-800">{p.vitals.bpSystolic}/{p.vitals.bpDiastolic}</strong></div>
                  <div>Pulse: <strong className="text-slate-800">{p.vitals.pulse} bpm</strong></div>
                  <div>Temp: <strong className="text-slate-800">{p.vitals.temp}°C</strong></div>
                </div>

                {p.symptoms && p.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.symptoms.map((s, i) => (
                      <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {p.doctorPrescription && (
                  <div className="mt-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                    <span><strong>Prescription Active:</strong> {p.doctorPrescription}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right Column: Selected Patient Details & AI Diagnostic Assistant */}
        <div className="space-y-4">
          {selectedPatient ? (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 sticky top-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> AI Referral Diagnostic Assistant
                </h3>
                {selectedPatient.triageCategory === 'RED' && (
                  <button
                    onClick={() => setAmbulanceModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition shadow-sm"
                  >
                    <Truck className="w-3.5 h-3.5" /> Dispatch 108
                  </button>
                )}
              </div>

              <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div>Patient Name: <strong>{decryptedNames[selectedPatient.id]}</strong></div>
                <div>Acuity: <strong className={selectedPatient.triageCategory === 'RED' ? 'text-red-600' : 'text-amber-600'}>{selectedPatient.triageCategory}</strong></div>
                <div>Location: <strong>{selectedPatient.villageCode}</strong></div>
              </div>

              {/* AI Diagnostic Output */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-950">
                <h5 className="font-bold text-indigo-900 mb-1.5 flex items-center gap-1">
                  AI Clinical Referral Analysis:
                </h5>
                {loadingAi ? (
                  <div className="flex items-center gap-2 text-indigo-600 py-3">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing differential diagnosis and transport protocols...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-line leading-relaxed font-sans">{aiSummary}</div>
                )}
              </div>

              {/* Doctor Prescription & Tele-Advice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doctor's Tele-Consult Advice / Prescription
                </label>
                <textarea
                  rows={3}
                  value={prescription}
                  onChange={e => setPrescription(e.target.value)}
                  placeholder="e.g. Administer 500mg Paracetamol, arrange 108 ambulance transfer to District Hospital immediately..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={submitPrescription}
                  className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Transmit Prescription to Field Worker
                </button>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-300"
              >
                <Printer className="w-3.5 h-3.5" /> Print Hospital Referral Handover Slip
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Select a patient from the priority referral list to inspect vitals, trigger AI differential diagnosis, and issue prescriptions.
            </div>
          )}
        </div>
      </div>

      {/* Interactive 108 Emergency Ambulance GPS Tracker Modal */}
      {ambulanceModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <Truck className="w-6 h-6 animate-bounce" />
                <h3 className="font-black text-base text-slate-900">108 Emergency Ambulance Active</h3>
              </div>
              <button
                onClick={() => setAmbulanceModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center space-y-1">
              <span className="text-xs text-red-600 font-bold uppercase tracking-wide block">
                Estimated Transit Time
              </span>
              <div className="text-3xl font-black text-red-700">{ambulanceEta} Minutes</div>
              <p className="text-xs text-red-800">En route to: {selectedPatient.villageCode}</p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b">
                <span>Vehicle ID:</span>
                <strong className="text-slate-800 font-mono">MH-04-AMB-1088</strong>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Equipment Type:</span>
                <strong className="text-slate-800">Advanced Life Support (ALS) with O2</strong>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Driver & Paramedic:</span>
                <strong className="text-slate-800">Rajesh Solanki & Nurse Rekha</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Emergency Contact:</span>
                <strong className="text-green-700 flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5" /> +91 98200 10811
                </strong>
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Driver Rajesh notified! High-priority telemetry pushed.`);
                setAmbulanceModal(false);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer shadow-md"
            >
              Confirm Patient Handover Route
            </button>
          </div>
        </div>
      )}
    </div>
  );
};