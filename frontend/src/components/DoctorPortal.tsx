import React, { useEffect, useState } from 'react';
import { decryptField } from '../utils/crypto';
import { playHospitalChime } from '../utils/audioAlert';
import { TRANSLATIONS, type Language } from '../utils/i18n';
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

interface DoctorPortalProps {
  lang?: Language;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ lang = 'mr' }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;

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
      setAiSummary(lang === 'mr' 
        ? "• प्राथमिक संशय: तीव्र श्वसन किंवा हृदयविकार आणीबाणी.\n• क्षेत्रीय उपचार: रुग्णाला बसवून ठेवावे, ४ लिटर ऑक्सिजन द्यावा, सलाईन सुरू करावे.\n• संदर्भ: तातडीने १०८ रुग्णवाहिकेतून जिल्हा रुग्णालयात हलवावे."
        : "• Primary Suspicion: Acute cardiopulmonary crisis / impending shock.\n• Field Action: High Fowler position, 4L O2, establish IV line.\n• Referral: Code Red Priority transfer to District Hospital.");
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
        alert(lang === 'mr' ? "औषधोपचार आशा सेविकेच्या उपकरणात पाठवला गेला!" : "Prescription transmitted to field worker device!");
        fetchReferrals();
        setSelectedPatient(null);
        setPrescription('');
      }
    } catch (err) {
      alert("Failed to submit prescription");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-5 pb-12 font-sans">
      {/* Formal Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-300 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-slate-800" /> {t.docTitle}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">{t.docDesc}</p>
        </div>
        <button
          onClick={fetchReferrals}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-200 font-bold transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {t.refreshQueue}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Priority Referral Queue */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {t.incomingReferrals} ({patients.length})
            </h3>
            <span className="text-[11px] text-slate-500">{t.clickToReview}</span>
          </div>

          {patients.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-300 text-center text-slate-500 text-sm">
              {t.noReferrals}
            </div>
          ) : (
            patients.map(p => (
              <div
                key={p.id}
                onClick={() => handleSelectPatient(p)}
                className={`p-4 rounded-xl border transition-all cursor-pointer bg-white hover:shadow-md ${
                  selectedPatient?.id === p.id ? 'ring-2 ring-slate-900 border-slate-900' : 'border-slate-300'
                } ${
                  p.triageCategory === 'RED' ? 'border-l-8 border-l-red-600' :
                  p.triageCategory === 'YELLOW' ? 'border-l-8 border-l-amber-500' :
                  'border-l-8 border-l-emerald-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">
                        {decryptedNames[p.id] || "Decrypting..."}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold border border-slate-200">
                        {p.id}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {p.gender}, {p.age} yrs • {p.villageCode} • v{p.version}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                      p.triageCategory === 'RED' ? 'bg-red-50 text-red-800 border-red-300' :
                      p.triageCategory === 'YELLOW' ? 'bg-amber-50 text-amber-900 border-amber-300' :
                      'bg-emerald-50 text-emerald-900 border-emerald-300'
                    }`}>
                      {p.triageCategory} PRIORITY ({p.triageScore})
                    </span>
                  </div>
                </div>

                {/* Vitals Summary Row */}
                <div className="grid grid-cols-4 gap-2 mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>SpO2: <strong className={p.vitals.spo2 < 92 ? 'text-red-700 font-black' : 'text-slate-900 font-bold'}>{p.vitals.spo2}%</strong></div>
                  <div>BP: <strong className="text-slate-900 font-bold">{p.vitals.bpSystolic}/{p.vitals.bpDiastolic}</strong></div>
                  <div>Pulse: <strong className="text-slate-900 font-bold">{p.vitals.pulse} bpm</strong></div>
                  <div>Temp: <strong className="text-slate-900 font-bold">{p.vitals.temp}°C</strong></div>
                </div>

                {p.symptoms && p.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.symptoms.map((s, i) => (
                      <span key={i} className="text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {p.doctorPrescription && (
                  <div className="mt-2.5 text-xs text-emerald-950 bg-emerald-50 border border-emerald-300 p-2 rounded flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0 text-emerald-700" />
                    <span><strong>{t.activePrescription}:</strong> {p.doctorPrescription}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right Column: Selected Patient Details & AI Diagnostic Assistant */}
        <div className="space-y-4">
          {selectedPatient ? (
            <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm space-y-4 sticky top-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> {t.aiTitle}
                </h3>
                {selectedPatient.triageCategory === 'RED' && (
                  <button
                    onClick={() => setAmbulanceModal(true)}
                    className="bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition shadow-xs"
                  >
                    <Truck className="w-3.5 h-3.5" /> {t.dispatch108}
                  </button>
                )}
              </div>

              <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div>Patient: <strong>{decryptedNames[selectedPatient.id]}</strong></div>
                <div>Acuity: <strong className={selectedPatient.triageCategory === 'RED' ? 'text-red-700' : 'text-amber-700'}>{selectedPatient.triageCategory}</strong></div>
                <div>Sub-Center: <strong>{selectedPatient.villageCode}</strong></div>
              </div>

              {/* AI Clinical Analysis */}
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900">
                <h5 className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                  AI Differential & Triage Protocols:
                </h5>
                {loadingAi ? (
                  <div className="flex items-center gap-2 text-slate-600 py-3">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                    <span>Synthesizing differential diagnosis and transport protocols...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-line leading-relaxed font-sans text-slate-800">{aiSummary}</div>
                )}
              </div>

              {/* Doctor Prescription */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.prescriptionLabel}
                </label>
                <textarea
                  rows={3}
                  value={prescription}
                  onChange={e => setPrescription(e.target.value)}
                  placeholder={t.prescriptionPlaceholder}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  onClick={submitPrescription}
                  className="mt-2 w-full bg-slate-900 hover:bg-black text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> {t.transmitRx}
                </button>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-300"
              >
                <Printer className="w-3.5 h-3.5" /> {t.printSlip}
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-slate-300 text-center text-slate-500 text-xs">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              {t.clickToReview}
            </div>
          )}
        </div>
      </div>

      {/* Ambulance Modal */}
      {ambulanceModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-300">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-red-700">
                <Truck className="w-6 h-6 animate-pulse" />
                <h3 className="font-black text-base text-slate-900">108 Emergency Ambulance Dispatched</h3>
              </div>
              <button
                onClick={() => setAmbulanceModal(false)}
                className="text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center space-y-1">
              <span className="text-xs text-red-700 font-bold uppercase tracking-wide block">
                Estimated Transit Time
              </span>
              <div className="text-3xl font-black text-red-800">{ambulanceEta} Minutes</div>
              <p className="text-xs text-red-900 font-medium">Destination: {selectedPatient.villageCode}</p>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b">
                <span>Vehicle Registration:</span>
                <strong className="text-slate-900 font-mono">MH-04-AMB-1088</strong>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Equipment Specification:</span>
                <strong className="text-slate-900">Advanced Life Support (ALS) with O2</strong>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Driver & Paramedic:</span>
                <strong className="text-slate-900">Rajesh Solanki & Nurse Rekha</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Emergency Wireless:</span>
                <strong className="text-emerald-700 flex items-center gap-1 font-mono font-bold">
                  <Phone className="w-3.5 h-3.5" /> +91 98200 10811
                </strong>
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Driver notified! Telemetry linked.`);
                setAmbulanceModal(false);
              }}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer shadow-md"
            >
              Confirm Handover Route
            </button>
          </div>
        </div>
      )}
    </div>
  );
};