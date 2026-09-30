import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  initDatabase,
  getAllPatients,
  getPatientById,
  syncOrMergePatient,
  setDoctorPrescription,
  getInventory,
  updateInventoryStock,
  getAuditLogs,
  logChatMessage,
  getDatabaseStats
} from './database.js';

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

// Initialize SQLite Persistent Database
await initDatabase();

// ----------------------------------------------------
// 1. Sync & Conflict Resolution Endpoint (3-Way Merge with SQLite)
// ----------------------------------------------------
app.post('/api/sync-record', async (req, res) => {
  const incoming = req.body;
  if (!incoming || !incoming.id) {
    return res.status(400).json({ error: 'Missing record payload' });
  }

  try {
    const result = await syncOrMergePatient(incoming);
    console.log(`[SQLITE SYNC] Result for ${incoming.id}: ${result.status}`);
    return res.json(result);
  } catch (err) {
    console.error(`[SQLITE SYNC ERROR] ${err.message}`);
    return res.status(500).json({ error: 'Database sync error', details: err.message });
  }
});

// ----------------------------------------------------
// 2. Doctor Referral Priority Queue (SQLite)
// ----------------------------------------------------
app.get('/api/referrals', async (req, res) => {
  try {
    const records = await getAllPatients();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve referrals', details: err.message });
  }
});

// ----------------------------------------------------
// 3. Get Single Patient (SQLite)
// ----------------------------------------------------
app.get('/api/patient/:id', async (req, res) => {
  try {
    const patient = await getPatientById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: 'Database query error', details: err.message });
  }
});

// ----------------------------------------------------
// 4. Doctor Prescription update (SQLite)
// ----------------------------------------------------
app.post('/api/patient/:id/prescribe', async (req, res) => {
  const { id } = req.params;
  const { prescription } = req.body;

  try {
    const updated = await setDoctorPrescription(id, prescription);
    if (!updated) return res.status(404).json({ error: 'Patient not found' });
    console.log(`[SQLITE PRESCRIBE] Prescription recorded for ${id}`);
    res.json({ success: true, patient: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record prescription', details: err.message });
  }
});

// ----------------------------------------------------
// 5. Pharmacy Inventory Endpoints (SQLite)
// ----------------------------------------------------
app.get('/api/inventory', async (req, res) => {
  try {
    const items = await getInventory();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory', details: err.message });
  }
});

app.post('/api/inventory/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  if (stock === undefined) return res.status(400).json({ error: 'Stock quantity required' });

  try {
    const updated = await updateInventoryStock(id, Number(stock));
    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock', details: err.message });
  }
});

// ----------------------------------------------------
// 6. Database Health & Audit Inspector Endpoint
// ----------------------------------------------------
app.get('/api/db/stats', async (req, res) => {
  try {
    const stats = await getDatabaseStats();
    const auditLogs = await getAuditLogs(15);
    res.json({
      status: 'HEALTHY',
      stats,
      recentAuditLogs: auditLogs
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get DB stats', details: err.message });
  }
});

// ----------------------------------------------------
// 7. AI Referral Diagnostic Analysis (Gemini + Clinical Fallback)
// ----------------------------------------------------
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

// ----------------------------------------------------
// 8. Interactive Clinical AI Chatbot (Gemini + Offline Fallback + SQLite Logging)
// ----------------------------------------------------
app.post('/api/ai/chat', async (req, res) => {
  const { message, lang } = req.body;
  if (!message) return res.status(400).json({ reply: 'Please provide a clinical message.' });

  // Log user message to database
  await logChatMessage('user', message, lang || 'en');

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

  let botReply = "";

  try {
    if (process.env.GEMINI_API_KEY && ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `${systemInstructions}\n\nUser Question: ${message}`
      });
      botReply = response.text;
    } else {
      throw new Error("No API key configured");
    }
  } catch (err) {
    // High-fidelity fallback database for typical emergency questions
    const q = message.toLowerCase();

    if (q.includes("snake") || q.includes("सर्प") || q.includes("साप")) {
      botReply = lang === 'mr' 
        ? "🐍 सर्पदंश प्रथमोपचार प्रोटोकॉल (NHM):\n१. रुग्णाला शांत ठेवा आणि हालचाल करू देऊ नका. प्रभावित अवयव हृदयाच्या खाली स्थिर (Splint) करा.\n२. कोणतीही काप किंवा दोरी (Tourniquet) बांधू नका.\n३. तातडीने १०८ रुग्णवाहिका बोलावून जवळच्या प्राथमिक आरोग्य केंद्रात (PHC) १० कुप्या (Vials) Polyvalent ASV सलाईनमधून सुरू करा."
        : "🐍 Snakebite Emergency Protocol (NHM):\n1. Immobilize the bitten limb using a splint at heart level; keep patient calm.\n2. DO NOT apply arterial tourniquets, incisions, or suction.\n3. Immediately dispatch 108 ALS Ambulance to nearest center stocked with 10 vials of Polyvalent ASV.";
    } else if (q.includes("fever") || q.includes("ताप") || q.includes("बुखार") || q.includes("para")) {
      botReply = lang === 'mr'
        ? "🌡️ ताप व्यवस्थापन (बालरुग्ण व प्रौढ):\n१. प्रौढांसाठी: पॅरासिटामॉल ६५० मिग्रॅ (Paracetamol) दर ६-८ तासांनी जेवणानंतर.\n२. बालकांसाठी: १०-१५ मिग्रॅ/किलो वजनानुसार सिरप. डोक्यावर थंड पाण्याच्या पट्ट्या ठेवा.\n३. जर ताप ३ दिवसांपेक्षा जास्त असेल किंवा अंगावर लाल चट्टे असतील, तर डेंग्यू/मलेरिया तपासणीसाठी तात्काळ पाठवा."
        : "🌡️ Fever Management Protocol:\n1. Adults: Paracetamol 650mg TDS PRN.\n2. Pediatrics: 10-15 mg/kg per dose. Sponge with room-temperature water.\n3. If fever > 3 days with petechiae, test stat for Dengue/Malaria and monitor SpO2.";
    } else if (q.includes("ors") || q.includes("diarrhea") || q.includes("उलटी") || q.includes("जुलाब")) {
      botReply = lang === 'mr'
        ? "💧 जलसंजीवन (ORS) द्रावण प्रमाण:\n१. १ पाकीट WHO ORS १ लिटर स्वच्छ उकळून थंड केलेल्या पाण्यात पूर्ण विरघळवावे.\n२. प्रत्येक जुलाबानंतर मुलांसाठी अर्धा ते १ कप, प्रौढांसाठी १ ते २ कप द्यावे.\n३. सोबत लहान मुलांना झिंक (Zinc 20mg) सलग १४ दिवस द्यावे."
        : "💧 Dehydration & ORS Protocol:\n1. Mix 1 sachet WHO ORS in exactly 1 Liter of clean boiled/cooled water.\n2. Administer 100-200ml after every loose stool.\n3. Co-prescribe Zinc Dispersible Tablets (20mg daily for 14 days in children).";
    } else {
      botReply = lang === 'mr'
        ? `🏥 आरोग्य साथी सहाय्यक:\nतुमच्या प्रश्नासाठी ('${message}') राष्ट्रीय ग्रामीण आरोग्य मानकांनुसार:\n१. रुग्णाचे Vitals (SpO2, BP, नाडी) तपासा.\n२. स्थिती गंभीर असल्यास १०८ रुग्णवाहिकेशी संपर्क करा.\n३. जिल्हा रुग्णालयातील डॉक्टरांचा टेलि-सल्ला घ्या.`
        : `🏥 Arogya Sathi Clinical Guidance:\nRegarding your query ('${message}'):\n1. Ensure patent airway and record baseline SpO2 and Blood Pressure.\n2. Stabilize patient locally and verify against on-device MEWS triage.\n3. Contact District Medical Officer via Tele-Referral queue or 108 dispatch.`;
    }
  }

  // Log bot response to database
  await logChatMessage('assistant', botReply, lang || 'en');
  return res.json({ reply: botReply });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🏥 Arogya Backend with SQLite running on http://localhost:${PORT}`);
});
