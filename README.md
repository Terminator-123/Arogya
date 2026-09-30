# 🏥 Arogya (आरोग्य): National Rural Telemedicine & Distributed Triage Network

> **Hackconquest 2026 | TCET Mumbai**  
> **Problem Statement 01:** Offline-First Rural Telemedicine PWA  
> *Government of Maharashtra • Public Health Department • National Health Mission (NHM)*

---

## 🌟 Key Capabilities & Modules

1. **Formal Government & Clinical UI**
   - Structured following National Health Mission (NHM) standards with an authoritative slate/navy palette, official headers, and district surveillance integration.

2. **Full Multi-Language Localization (English / मराठी / हिंदी)**
   - True deep localization across **ALL pages** (Intake, Doctor Command, Outbreak GIS, QR Passport, Pharmacy, Simulation Lab, AI Chatbot).

3. **Clinical Dark & Light Mode**
   - Eye-friendly clinical night mode engineered for tele-physician overnight shifts, low-light hospital wards, and reduced battery consumption on frontline mobile devices.

4. **100% Offline-First PWA & Web Crypto AES-GCM Encryption**
   - Service Workers with complete App Shell precaching via Workbox.
   - Client-side AES-GCM 256-bit encryption protecting patient vitals and medical records on local IndexedDB storage.

5. **On-Device MEWS Clinical Risk Engine**
   - Calculates Modified Early Warning Scores (MEWS) on-device without cloud dependency, categorizing cases into Green (Normal), Yellow (Observation), and Red (Critical).

6. **On-Device AI Vision Clinical & Snakebite Scanner**
   - Neural detection of necrotic tissue, envenomation fang marks, cellulitis, and wound healing indices with simulated canvas bounding boxes and instant WHO/NHM anti-venom triage.

7. **Arogya Sathi AI (आरोग्य साथी एआय) Clinical Chatbot**
   - Dual-engine clinical assistant: Connects to Google Gemini API when online, with instant client-side offline emergency fallback for snakebites, pediatric dosages, and severe dehydration.
   - Accessible via dedicated navigation tab or persistent 1-click floating action button (FAB) on all screens.

8. **Distributed 3-Way Merge Conflict Resolution**
   - Atomic field-level merge preserving concurrent edits between rural health workers and tele-physicians when reconnecting after connectivity blackouts.

9. **Offline Ayushman ABHA QR Health Passport**
   - Generates and scans offline compressed QR health cards for instant patient identification in network dead zones.

10. **108 Emergency Ambulance GPS Dispatch & Hotline**
    - Live transit telemetry, driver dispatch protocol for Code Red emergencies, and quick-access 108 emergency response desk.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Git

### 1. Start the Backend API
```bash
cd backend
npm install
npm start
```
*Backend runs at: `http://localhost:5000`*

### 2. Start the Frontend PWA
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

---

## 📱 Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas API, Web Audio API, Service Workers.
- **Backend:** Node.js, Express, Google Gemini SDK, CORS, RESTful API.
- **Storage & Security:** IndexedDB (Dexie/Local), Web Crypto API (AES-GCM 256-bit).
- **Standards:** National Health Mission (NHM) / WHO Clinical Triage Protocols.
