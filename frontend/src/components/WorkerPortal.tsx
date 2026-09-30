import React, { useState } from 'react';
import { db, type LocalPatient } from '../db/db';
import { encryptField } from '../utils/crypto';
import { evaluateClinicalTriage, type PatientVitals } from '../utils/triage';
import { SyncEngine } from '../services/syncEngine';
import { playHospitalChime } from '../utils/audioAlert';
import { TRANSLATIONS, type Language } from '../utils/i18n';
import { BodyOrganSelector } from './BodyOrganSelector';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { AlertCircle, CheckCircle2, ShieldCheck, HeartPulse } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto p-4 space-y-5 pb-12 font-sans">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-green-600" /> {t.ashaIntakeTitle}
        </h2>
        <p className="text-xs text-slate-500 mt-1">{t.ashaIntakeDesc}</p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">{t.savedSuccessTitle}</h4>
            <p className="text-xs text-emerald-700">{t.savedSuccessDesc}</p>
          </div>
        </div>
      )}

      {/* Dynamic Live Triage Card */}
      <div className={`p-4 rounded-xl border-2 transition-all ${
        liveTriage.category === 'RED'
          ? 'bg-red-50 border-red-500 text-red-900 shadow-sm'
          : liveTriage.category === 'YELLOW'
          ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
          : 'bg-emerald-50 border-emerald-500 text-emerald-900'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border">
            On-Device MEWS Risk Engine
          </span>
          <span className="font-extrabold text-base sm:text-lg">Clinical Score: {liveTriage.score}</span>
        </div>
        <div className="text-sm sm:text-base font-bold mt-1.5 flex items-center gap-1.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {liveTriage.category === 'RED' ? t.codeRed : liveTriage.category === 'YELLOW' ? t.codeYellow : t.codeGreen}
        </div>
        {liveTriage.flaggedReasons.length > 0 && (
          <ul className="text-xs list-disc list-inside mt-2 space-y-0.5 opacity-90">
            {liveTriage.flaggedReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        {/* Patient Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.patientName}</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.patientNamePlaceholder}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.villageCode}</label>
            <input
              type="text"
              value={villageCode}
              onChange={e => setVillageCode(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.age}</label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.gender}</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
            >
              <option value="Female">{t.female}</option>
              <option value="Male">{t.male}</option>
              <option value="Other">{t.other}</option>
            </select>
          </div>
        </div>

        {/* Vitals Grid with Quick Clinical Touch Inputs */}
        <div className="border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.vitalsTitle}</h4>
            <span className="text-[11px] text-slate-400">Updates live triage score</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">{t.spo2}</span>
              <input
                type="number"
                value={vitals.spo2}
                onChange={e => setVitals({ ...vitals, spo2: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded p-1.5 font-bold"
              />
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">{t.bpSystolic}</span>
              <input
                type="number"
                value={vitals.bpSystolic}
                onChange={e => setVitals({ ...vitals, bpSystolic: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded p-1.5 font-bold"
              />
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">{t.bpDiastolic}</span>
              <input
                type="number"
                value={vitals.bpDiastolic}
                onChange={e => setVitals({ ...vitals, bpDiastolic: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded p-1.5 font-bold"
              />
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">{t.pulse}</span>
              <input
                type="number"
                value={vitals.pulse}
                onChange={e => setVitals({ ...vitals, pulse: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded p-1.5 font-bold"
              />
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">{t.temp}</span>
              <input
                type="number"
                step="0.1"
                value={vitals.temp}
                onChange={e => setVitals({ ...vitals, temp: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded p-1.5 font-bold"
              />
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">{t.respRate}</span>
              <input
                type="number"
                value={vitals.respiratoryRate}
                onChange={e => setVitals({ ...vitals, respiratoryRate: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded p-1.5 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Anatomical Organ Symptom Selector */}
        <div className="border-t border-slate-200 pt-3">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            {t.bodySelectorTitle}
          </h4>
          <BodyOrganSelector
            selectedSymptoms={selectedSymptoms}
            onToggleSymptom={toggleSymptom}
            lang={lang}
          />
        </div>

        {/* Frontline Voice Note Recorder */}
        <div className="border-t border-slate-200 pt-3">
          <VoiceNoteRecorder onTranscribed={handleVoiceTranscribed} lang={lang} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">{t.fieldNotes}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t.fieldNotesPlaceholder}
            className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <ShieldCheck className="w-5 h-5" /> {t.saveBtn}
        </button>
      </form>
    </div>
  );
};
