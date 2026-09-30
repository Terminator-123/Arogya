# 🏥 Arogya: National Rural Telemedicine & Distributed Triage Network

> **Hackconquest 2026 | TCET Mumbai**  
> **Problem Statement 01:** Offline-First Rural Telemedicine PWA  
> *Government of Maharashtra • Public Health Department • National Health Mission (NHM)*

---

## 🌟 Key Capabilities

1. **Formal Government & Clinical UI**
   - Structured after National Health Mission (NHM) standards with clean slate/navy palette, official headers, and district surveillance integration.

2. **Full Multi-Language Localization (English / मराठी / हिंदी)**
   - True deep localization across **ALL 6 pages** (Intake, Doctor Command, Outbreak GIS, QR Passport, Pharmacy, Simulation Lab).

3. **Field Sunlight Mode (High-Contrast Anti-Glare)**
   - High-contrast outdoor mode engineered for frontline ASHA workers operating under direct sunlight.

4. **100% Offline-First PWA & Web Crypto AES-GCM Encryption**
   - Service Workers with complete App Shell precaching.
   - Client-side AES-GCM 256-bit encryption protecting patient data on local IndexedDB storage.

5. **On-Device MEWS Clinical Risk Engine**
   - Calculates Modified Early Warning Scores (MEWS) on-device without cloud dependency.

6. **Distributed 3-Way Merge Conflict Resolution**
   - Atomic field-level merge preserving concurrent edits between rural health workers and tele-physicians.

7. **Offline Ayushman ABHA QR Health Passport**
   - Generates scannable offline QR health cards for paper or mobile wallet use.

8. **108 Emergency Ambulance GPS Dispatch**
   - Real-time transit telemetry and driver dispatch protocol for Code Red emergencies.

---

## 🚀 Quick Start Guide

### 1. Start the Backend
```bash
cd backend
npm install
npm start
```
*Backend: `http://localhost:5000`*

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend: `http://localhost:5173`*
