import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDummyKeyForFallback";
let ai = null;
try {
  ai = new GoogleGenAI({ apiKey });
} catch (e) {
  console.log("Gemini client in fallback mode.");
}

// In-memory Master Database of Patients on Cloud
const masterPatients = new Map();

// Seed initial realistic mock patients so the doctor dashboard is immediately populated
masterPatients.set('PAT-DEMO-01', {
  id: 'PAT-DEMO-01',
  villageCode: 'MH-PAL-02 (Manor)',
  nameCipher: 'U2F2aXRhIFBhd2Fy', // Base64 for Savita Pawar
  nameIv: 'MTIzNDU2Nzg5MDEy',
  age: 48,
  gender: 'Female',
  vitals: { temp: 39.2, bpSystolic: 82, bpDiastolic: 54, pulse: 128, spo2: 88, respiratoryRate: 28 },
  symptoms: ['Chest Pain (Radiating)', 'Acute Shortness of Breath', 'High Fever (>3 days)'],
  notesCipher: '',
  notesIv: '',
  triageCategory: 'RED',
  triageScore: 9,
  doctorPrescription: 'Administer 4L oxygen immediately. Mobilize 108 Emergency Ambulance for Sub-District Hospital transfer.',
  version: 2,
  synced: true,
  updatedAt: Date.now() - 3600000
});

masterPatients.set('PAT-DEMO-02', {
  id: 'PAT-DEMO-02',
  villageCode: 'MH-PAL-04 (Vikramgad)',
  nameCipher: 'R2FuZXNoIFNoaW5kZQ==', // Base64 for Ganesh Shinde
  nameIv: 'MTIzNDU2Nzg5MDEy',
  age: 62,
  gender: 'Male',
  vitals: { temp: 37.8, bpSystolic: 155, bpDiastolic: 95, pulse: 98, spo2: 93, respiratoryRate: 20 },
  symptoms: ['Productive Cough', 'High Fever (>3 days)'],
  notesCipher: '',
  notesIv: '',
  triageCategory: 'YELLOW',
  triageScore: 4,
  doctorPrescription: 'Start Oral Amoxicillin 500mg TDS for 5 days. Monitor SpO2 twice daily.',
  version: 1,
  synced: true,
  updatedAt: Date.now() - 7200000
});

// 1. Sync & Conflict Resolution Endpoint (3-Way Merge)
app.post('/api/sync-record', (req, res) => {
  const incoming = req.body;
  if (!incoming || !incoming.id) {
    return res.status(400).json({ error: 'Missing record payload' });
  }

  const existing = masterPatients.get(incoming.id);

  if (!existing) {
    const saved = { ...incoming, synced: true, version: 1 };
    masterPatients.set(incoming.id, saved);
    console.log(`[SYNC] Registered new patient: ${incoming.id}`);
    return res.json({ status: 'CREATED', record: saved });
  }

  // Conflict Resolution: Overlapping edit merge
  if (incoming.version <= existing.version) {
    console.log(`[CONFLICT RESOLUTION] Merging fields for patient: ${incoming.id}`);
    const mergedRecord = {
      ...incoming,
      doctorPrescription: existing.doctorPrescription || incoming.doctorPrescription,
      version: existing.version + 1,
      updatedAt: Date.now(),
      synced: true
    };
    masterPatients.set(incoming.id, mergedRecord);
    return res.json({ status: 'CONFLICT_RESOLVED_MERGED', record: mergedRecord });
  }

  const updated = { ...incoming, version: incoming.version + 1, synced: true };
  masterPatients.set(incoming.id, updated);
  return res.json({ status: 'UPDATED', record: updated });
});

// 2. Doctor Referral Priority Queue
app.get('/api/referrals', (req, res) => {
  const records = Array.from(masterPatients.values());
  const priorityWeight = { RED: 3, YELLOW: 2, GREEN: 1 };
  const sorted = records.sort((a, b) => {
    if (priorityWeight[b.triageCategory] !== priorityWeight[a.triageCategory]) {
      return priorityWeight[b.triageCategory] - priorityWeight[a.triageCategory];
    }
    return b.triageScore - a.triageScore;
  });
  res.json(sorted);
});

// 3. Doctor Prescription update
app.post('/api/patient/:id/prescribe', (req, res) => {
  const { id } = req.params;
  const { prescription } = req.body;
  const patient = masterPatients.get(id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  patient.doctorPrescription = prescription;
  patient.version += 1;
  patient.updatedAt = Date.now();
  masterPatients.set(id, patient);
  console.log(`[PRESCRIBE] Prescription issued for ${id}`);
  res.json({ success: true, patient });
});

// 4. AI Referral Diagnostic Analysis (Gemini + Clinical Fallback)
app.post('/api/ai/referral-analysis', async (req, res) => {
  const { vitals, symptoms, triageCategory } = req.body;

  const prompt = `
    You are an expert emergency tele-physician advising a rural community health worker (ASHA).
    Patient Acuity Level: ${triageCategory}
    Observed Vitals: ${JSON.stringify(vitals)}
    Reported Symptoms: ${symptoms ? symptoms.join(', ') : 'None'}

    Provide concise guidance in exactly these 3 bullet points:
    1. Primary Clinical Suspicion: (1-2 sentences on likely emergency/condition)
    2. Pre-Hospital Field Actions: (immediate stabilization steps for the worker before ambulance arrival)
    3. Referral & Transport Urgency: (exact target facility recommendation, e.g., District ICU vs PHC OPD)
  `;

  try {
    if (process.env.GEMINI_API_KEY && ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt
      });
      return res.json({ analysis: response.text });
    }
    throw new Error("No API key configured");
  } catch (err) {
    let fallbackText = "";
    if (triageCategory === 'RED') {
      fallbackText = `• Primary Clinical Suspicion: Acute Cardiorespiratory Crisis / Impending Septic Shock.\n• Pre-Hospital Field Actions: Keep patient in high Fowler position, administer supplemental oxygen if available, maintain patent airway, do not give oral fluids.\n• Referral & Transport Urgency: Code RED Emergency Transfer immediately via 108 Ambulance to nearest Sub-District Hospital with ICU/ECG capability.`;
    } else if (triageCategory === 'YELLOW') {
      fallbackText = `• Primary Clinical Suspicion: Lower Respiratory Tract Infection / Hypertensive Urgency.\n• Pre-Hospital Field Actions: Rest in cool environment, monitor SpO2 and Blood Pressure every 30 minutes, administer antipyretic if febrile.\n• Referral & Transport Urgency: Priority Tele-Consultation within 4-6 hours at Primary Health Centre (PHC).`;
    } else {
      fallbackText = `• Primary Clinical Suspicion: Mild symptomatic condition, hemodynamically stable.\n• Pre-Hospital Field Actions: Oral hydration therapy, symptom management, educate family on danger signs.\n• Referral & Transport Urgency: Routine OPD follow-up if symptoms persist beyond 48 hours.`;
    }
    return res.json({ analysis: fallbackText });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Arogya Backend running on http://localhost:${PORT}`);
});
