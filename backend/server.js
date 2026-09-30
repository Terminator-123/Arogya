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

// 5. Interactive Clinical Tele-Health AI Chatbot (Gemini + Offline Fallback)
app.post('/api/ai/chat', async (req, res) => {
  const { message, lang } = req.body;
  if (!message) return res.status(400).json({ reply: 'Please provide a clinical message.' });

  const systemInstructions = `
    You are 'Arogya Sathi' (आरोग्य साथी), an expert rural clinical tele-medicine AI assistant for frontline ASHA health workers and medical officers in Maharashtra, India.
    Language Requested: ${lang === 'mr' ? 'Marathi (मराठी)' : lang === 'hi' ? 'Hindi (हिंदी)' : 'English'}.
    Guidelines:
    1. Respond crisply, clearly, and with emergency clinical authority.
    2. Provide step-by-step pre-hospital stabilization instructions.
    3. State dosages clearly according to Indian National Health Mission (NHM) standards.
    4. Highlight red-flag warning signs and when to call 108 Ambulance immediately.
    5. Always answer in the requested language (${lang}).
  `;

  try {
    if (process.env.GEMINI_API_KEY && ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `${systemInstructions}\n\nUser Question: ${message}`
      });
      return res.json({ reply: response.text });
    }
    throw new Error("No API key configured");
  } catch (err) {
    // High-fidelity fallback database for typical emergency questions
    const q = message.toLowerCase();
    let fallback = "";

    if (q.includes("snake") || q.includes("सर्प") || q.includes("साप")) {
      fallback = lang === 'mr' 
        ? "🐍 सर्पदंश प्रथमोपचार प्रोटोकॉल (NHM):\n१. रुग्णाला शांत ठेवा आणि हालचाल करू देऊ नका. प्रभावित अवयव हृदयाच्या खाली स्थिर (Splint) करा.\n२. कोणतीही काप किंवा दोरी (Tourniquet) बांधू नका.\n३. तातडीने १०८ रुग्णवाहिका बोलावून जवळच्या प्राथमिक आरोग्य केंद्रात (PHC) १० कुप्या (Vials) Polyvalent ASV सलाईनमधून सुरू करा."
        : "🐍 Snakebite Emergency Protocol (NHM):\n1. Immobilize the bitten limb using a splint at heart level; keep patient calm.\n2. DO NOT apply arterial tourniquets, incisions, or suction.\n3. Immediately dispatch 108 ALS Ambulance to nearest center stocked with 10 vials of Polyvalent ASV.";
    } else if (q.includes("fever") || q.includes("ताप") || q.includes("बुखार") || q.includes("para")) {
      fallback = lang === 'mr'
        ? "🌡️ ताप व्यवस्थापन (बालरुग्ण व प्रौढ):\n१. प्रौढांसाठी: पॅरासिटामॉल ६५० मिग्रॅ (Paracetamol) दर ६-८ तासांनी जेवणानंतर.\n२. बालकांसाठी: १०-१५ मिग्रॅ/किलो वजनानुसार सिरप. डोक्यावर थंड पाण्याच्या पट्ट्या ठेवा.\n३. जर ताप ३ दिवसांपेक्षा जास्त असेल किंवा अंगावर लाल चट्टे असतील, तर डेंग्यू/मलेरिया तपासणीसाठी तात्काळ पाठवा."
        : "🌡️ Fever Management Protocol:\n1. Adults: Paracetamol 650mg TDS PRN.\n2. Pediatrics: 10-15 mg/kg per dose. Sponge with room-temperature water.\n3. If fever > 3 days with petechiae, test stat for Dengue/Malaria and monitor SpO2.";
    } else if (q.includes("ors") || q.includes("diarrhea") || q.includes("उलटी") || q.includes("जुलाब")) {
      fallback = lang === 'mr'
        ? "💧 जलसंजीवन (ORS) द्रावण प्रमाण:\n१. १ पाकीट WHO ORS १ लिटर स्वच्छ उकळून थंड केलेल्या पाण्यात पूर्ण विरघळवावे.\n२. प्रत्येक जुलाबानंतर मुलांसाठी अर्धा ते १ कप, प्रौढांसाठी १ ते २ कप द्यावे.\n३. सोबत लहान मुलांना झिंक (Zinc 20mg) सलग १४ दिवस द्यावे."
        : "💧 Dehydration & ORS Protocol:\n1. Mix 1 sachet WHO ORS in exactly 1 Liter of clean boiled/cooled water.\n2. Administer 100-200ml after every loose stool.\n3. Co-prescribe Zinc Dispersible Tablets (20mg daily for 14 days in children).";
    } else {
      fallback = lang === 'mr'
        ? `🏥 आरोग्य साथी सहाय्यक:\nतुमच्या प्रश्नासाठी ('${message}') राष्ट्रीय ग्रामीण आरोग्य मानकांनुसार:\n१. रुग्णाचे Vitals (SpO2, BP, नाडी) तपासा.\n२. स्थिती गंभीर असल्यास १०८ रुग्णवाहिकेशी संपर्क करा.\n३. जिल्हा रुग्णालयातील डॉक्टरांचा टेलि-सल्ला घ्या.`
        : `🏥 Arogya Sathi Clinical Guidance:\nRegarding your query ('${message}'):\n1. Ensure patent airway and record baseline SpO2 and Blood Pressure.\n2. Stabilize patient locally and verify against on-device MEWS triage.\n3. Contact District Medical Officer via Tele-Referral queue or 108 dispatch.`;
    }

    return res.json({ reply: fallback });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Arogya Backend running on http://localhost:${PORT}`);
});
