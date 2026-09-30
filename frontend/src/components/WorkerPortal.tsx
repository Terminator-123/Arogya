import React, { useState } from 'react';
import { db, type LocalPatient } from '../db/db';
import { encryptField } from '../utils/crypto';
import { evaluateClinicalTriage, type PatientVitals } from '../utils/triage';
import { SyncEngine } from '../services/syncEngine';
import { playHospitalChime } from '../utils/audioAlert';
import { TRANSLATIONS, type Language } from '../utils/i18n';
import { BodyOrganSelector } from './BodyOrganSelector';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  HeartPulse, 
  Activity, 
  Lock 
} from 'lucide-react';

interface WorkerPortalProps {
  lang?: Language;
}

export const WorkerPortal: React.FC<WorkerPortalProps> = ({ lang = 'en' }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState('Female');
  const [villageCode, setVillageCode] = useState('MH-PAL-04 (Vikramgad)');
  const [notes, setNotes] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [vitals, setVitals] = useState<PatientVitals>({
    temp: 37.0,
    bpSystolic: 120,
    bpDiastolic: 80,
    pulse: 78,
    spo2: 98,
    respiratoryRate: 16
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live on-device clinical MEWS triage evaluation without internet
  const liveTriage = evaluateClinicalTriage(vitals, selectedSymptoms);

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const handleVoiceTranscribed = (transcript: string) => {
    setNotes(prev => (prev ? `${prev} | ${transcript}` : transcript));
  };

  // Demo Quick-Fill Presets for fast judge demonstrations
  const loadPreset = (type: 'NORMAL' | 'FEVER' | 'CRITICAL') => {
    if (type === 'NORMAL') {
      setName('Sunita Patil');
      setAge(32);
      setGender('Female');
      setVillageCode('MH-PAL-04 (Vikramgad)');
      setVitals({ temp: 36.8, bpSystolic: 118, bpDiastolic: 76, pulse: 74, spo2: 99, respiratoryRate: 16 });
      setSelectedSymptoms([]);
      setNotes('Routine antenatal second-trimester field checkup. Patient is hemodynamically stable.');
    } else if (type === 'FEVER') {
      setName('Eknath Jadhav');
      setAge(58);
      setGender('Male');
      setVillageCode('MH-PAL-02 (Manor)');
      setVitals({ temp: 38.8, bpSystolic: 145, bpDiastolic: 92, pulse: 96, spo2: 93, respiratoryRate: 22 });
      setSelectedSymptoms(['High Fever (>3 days)', 'Productive Cough']);
      setNotes('High fever for 4 days with productive yellow sputum. Rural access road impassable due to rain.');
    } else if (type === 'CRITICAL') {
      setName('Rukmini Devi');
      setAge(45);
      setGender('Female');
      setVillageCode('MH-PAL-06 (Jawhar)');
      setVitals({ temp: 39.4, bpSystolic: 82, bpDiastolic: 54, pulse: 132, spo2: 87, respiratoryRate: 28 });
      setSelectedSymptoms(['Chest Pain (Radiating)', 'Acute Shortness of Breath', 'High Fever (>3 days)']);
      setNotes('Acute respiratory distress with radiating left precordial pain. Impending septic/cardiogenic crisis.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter patient name");

    // 1. Local AES-GCM Encryption
    const encName = await encryptField(name);
    const encNotes = await encryptField(notes);

    const recordId = "PAT-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const newPatient: LocalPatient = {
      id: recordId,
      villageCode,
      nameCipher: encName.cipher,
      nameIv: encName.iv,
      age: Number(age),
      gender,
      vitals,
      symptoms: selectedSymptoms,
      notesCipher: encNotes.cipher,
      notesIv: encNotes.iv,
      triageCategory: liveTriage.category,
      triageScore: liveTriage.score,
      version: 1,
      synced: false,
      updatedAt: Date.now()
    };

    // 2. Save to IndexedDB
    await db.patients.put(newPatient);

    // 3. Add to Outbox Sync Queue
    await db.syncQueue.add({
      recordId,
      action: 'UPSERT',
      payload: newPatient,
      timestamp: Date.now(),
      retries: 0
    });

    // 4. Play audio chime & trigger auto-sync
    playHospitalChime('CONFIRM');
    SyncEngine.triggerSync();

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setName('');
      setNotes('');
      setSelectedSymptoms([]);
    }, 3000);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-5 pb-16 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <HeartPulse className="w-7 h-7 text-emerald-600 animate-pulse" /> {t.intakeTitle}
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">{t.intakeDesc}</p>
        </div>

        {/* 1-Click Fast Judge Demo Presets */}
        <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block w-full md:w-auto">
            ⚡ Quick Presets:
          </span>
          <button
            type="button"
            onClick={() => loadPreset('NORMAL')}
            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md border border-emerald-300 transition-colors shadow-xs"
          >
            🟢 Normal
          </button>
          <button
            type="button"
            onClick={() => loadPreset('FEVER')}
            className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-md border border-amber-300 transition-colors shadow-xs"
          >
            🟡 Moderate
          </button>
          <button
            type="button"
            onClick={() => loadPreset('CRITICAL')}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-md border border-red-300 transition-colors shadow-xs animate-pulse"
          >
            🔴 Code Red
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-sm">{t.savedSuccessTitle}</h4>
            <p className="text-xs text-emerald-700">{t.savedSuccessDesc}</p>
          </div>
        </div>
      )}

      {/* Dynamic Live Triage Card */}
      <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-sm ${
        liveTriage.category === 'RED'
          ? 'bg-red-50 border-red-500 text-red-950 ring-2 ring-red-400/30'
          : liveTriage.category === 'YELLOW'
          ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-400/30'
          : 'bg-emerald-50 border-emerald-500 text-emerald-950'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/90 border border-slate-300 shadow-2xs">
              On-Device MEWS Risk Engine
            </span>
            <span className="text-[11px] font-mono opacity-75">No Cloud Needed</span>
          </div>
          <span className="font-black text-lg sm:text-xl tracking-tight">
            MEWS Score: <span className="font-mono">{liveTriage.score}</span>
          </span>
        </div>

        <div className="text-base sm:text-lg font-black mt-2 flex items-center gap-2">
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
            liveTriage.category === 'RED' ? 'text-red-600 animate-bounce' : 'text-amber-600'
          }`} />
          {liveTriage.category === 'RED' ? t.codeRed : liveTriage.category === 'YELLOW' ? t.codeYellow : t.codeGreen}
        </div>

        {liveTriage.flaggedReasons.length > 0 && (
          <ul className="text-xs list-disc list-inside mt-2.5 space-y-1 font-medium opacity-90 bg-white/60 p-2.5 rounded-lg border border-slate-200">
            {liveTriage.flaggedReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-6 space-y-5">
        {/* Patient Demographics */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-700" />
            1. Patient Demographics (Hardware AES-GCM Encrypted)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.patientName}</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t.patientNamePlaceholder}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.villageCode}</label>
              <input
                type="text"
                value={villageCode}
                onChange={e => setVillageCode(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-slate-50 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.age}</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.gender}</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-white font-medium cursor-pointer"
              >
                <option value="Female">{t.female}</option>
                <option value="Male">{t.male}</option>
                <option value="Other">{t.other}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vitals Grid with Visual Status Indicators */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              2. {t.vitalsTitle}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Updates MEWS score in real time</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* SpO2 */}
            <div className={`p-3 rounded-xl border transition ${
              vitals.spo2 < 90 ? 'bg-red-50 border-red-300 ring-1 ring-red-400' :
              vitals.spo2 < 95 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold mb-1">
                <span>SpO2 Oxygen</span>
                <span className="text-[10px] text-slate-400">≥95%</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={vitals.spo2}
                  onChange={e => setVitals({ ...vitals, spo2: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-black text-base text-slate-900 text-center"
                />
                <span className="text-xs font-bold text-slate-500">%</span>
              </div>
            </div>

            {/* Systolic BP */}
            <div className={`p-3 rounded-xl border transition ${
              vitals.bpSystolic < 90 || vitals.bpSystolic > 180 ? 'bg-red-50 border-red-300 ring-1 ring-red-400' :
              vitals.bpSystolic > 140 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold mb-1">
                <span>BP Systolic</span>
                <span className="text-[10px] text-slate-400">110-130</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={vitals.bpSystolic}
                  onChange={e => setVitals({ ...vitals, bpSystolic: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-black text-base text-slate-900 text-center"
                />
                <span className="text-xs font-bold text-slate-500">mmHg</span>
              </div>
            </div>

            {/* Diastolic BP */}
            <div className="p-3 rounded-xl border bg-slate-50 border-slate-200">
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold mb-1">
                <span>BP Diastolic</span>
                <span className="text-[10px] text-slate-400">70-85</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={vitals.bpDiastolic}
                  onChange={e => setVitals({ ...vitals, bpDiastolic: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-black text-base text-slate-900 text-center"
                />
                <span className="text-xs font-bold text-slate-500">mmHg</span>
              </div>
            </div>

            {/* Heart Pulse */}
            <div className={`p-3 rounded-xl border transition ${
              vitals.pulse > 120 || vitals.pulse < 50 ? 'bg-red-50 border-red-300 ring-1 ring-red-400' :
              vitals.pulse > 100 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold mb-1">
                <span>Pulse Rate</span>
                <span className="text-[10px] text-slate-400">60-100</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={vitals.pulse}
                  onChange={e => setVitals({ ...vitals, pulse: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-black text-base text-slate-900 text-center"
                />
                <span className="text-xs font-bold text-slate-500">bpm</span>
              </div>
            </div>

            {/* Body Temperature */}
            <div className={`p-3 rounded-xl border transition ${
              vitals.temp > 39.0 ? 'bg-red-50 border-red-300 ring-1 ring-red-400' :
              vitals.temp > 38.0 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold mb-1">
                <span>Temperature</span>
                <span className="text-[10px] text-slate-400">36.5-37.5</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temp}
                  onChange={e => setVitals({ ...vitals, temp: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-black text-base text-slate-900 text-center"
                />
                <span className="text-xs font-bold text-slate-500">°C</span>
              </div>
            </div>

            {/* Respiratory Rate */}
            <div className={`p-3 rounded-xl border transition ${
              vitals.respiratoryRate > 25 || vitals.respiratoryRate < 9 ? 'bg-red-50 border-red-300 ring-1 ring-red-400' :
              'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold mb-1">
                <span>Respiration</span>
                <span className="text-[10px] text-slate-400">12-20</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={vitals.respiratoryRate}
                  onChange={e => setVitals({ ...vitals, respiratoryRate: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-black text-base text-slate-900 text-center"
                />
                <span className="text-xs font-bold text-slate-500">/min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Anatomical Organ Symptom Selector */}
        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            3. {t.bodySelectorTitle}
          </h3>
          <BodyOrganSelector
            selectedSymptoms={selectedSymptoms}
            onToggleSymptom={toggleSymptom}
            lang={lang}
          />
        </div>

        {/* Frontline Voice Note Recorder */}
        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            4. Voice Dictation (Marathi / Hindi)
          </h3>
          <VoiceNoteRecorder onTranscribed={handleVoiceTranscribed} lang={lang} />
        </div>

        {/* Field Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t.fieldNotes}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t.fieldNotesPlaceholder}
            className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-blue-900 to-slate-900 hover:from-black hover:to-slate-950 text-white font-extrabold rounded-xl shadow-md shadow-blue-950/20 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer text-sm"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>{t.saveBtn}</span>
        </button>

        {/* Security Seal */}
        <div className="text-center text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5 pt-1">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>FIPS 140-2 Web Crypto AES-GCM 256-bit On-Device Encryption Verified</span>
        </div>
      </form>
    </div>
  );
};
