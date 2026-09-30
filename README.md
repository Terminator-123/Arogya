# 🏥 Sanjeevani: Offline-First Rural Telemedicine PWA

> **Hackconquest 2026 | TCET Mumbai**  
> **Problem Statement 01:** Offline-First Rural Telemedicine PWA  
> *Enabling frontline rural health workers (ASHA/ANM) to record vitals, compute clinical risk asynchronously, and seamlessly synchronize over intermittent low-bandwidth networks.*

---

## 🌟 Key Features

1. **100% Offline-First PWA Architecture**
   - Built on Service Workers and IndexedDB (`Dexie.js`) with complete App Shell caching.
   - Operates with zero network connectivity in remote tribal and rural areas.

2. **Client-Side AES-GCM Encrypted Local Storage**
   - Patient Identifiable Information (PII) and clinical notes are encrypted using the Web Crypto API (`AES-GCM 256-bit`) before hitting local storage.

3. **On-Device Clinical Triage Engine (MEWS)**
   - Calculates **Modified Early Warning Scores (MEWS)** on-device without requiring cloud API calls.
   - Categorizes patients into **RED (Code Red Emergency)**, **YELLOW (Priority OPD)**, and **GREEN (Routine)** with instant visual feedback.

4. **Low-Bandwidth Outbox Queue & Conflict Resolution**
   - Outbox sync pattern queues local updates and automatically flushes them when connectivity resumes.
   - 3-Way Field-Level Merge engine handles overlapping updates between field workers and tele-physicians.

5. **AI-Assisted Emergency Referral Intelligence**
   - Automated differential diagnosis and pre-hospital field action plans powered by Google Gemini API with fallback clinical protocols.

---

## 🏗️ System Architecture

```
[ Rural Health Worker (PWA / Mobile) ]
   │
   ├── Service Worker (Static Asset Cache)
   ├── Web Crypto API (AES-GCM Local Encryption)
   ├── Local IndexedDB (Dexie.js - Patient Store)
   ├── On-Device MEWS Risk Engine
   └── Outbox Sync Queue
           │
           │ (Background Sync on Network Restore)
           ▼
[ District Tele-Health Server (Node.js/Express) ]
   │
   ├── 3-Way Field Merge & Conflict Resolution Engine
   ├── Gemini AI Diagnostic Assistant
   └── Priority-Sorted Clinical Referral Queue (Red > Yellow > Green)
           │
           ▼
[ Doctor's Command Center (Web Dashboard) ]
```

---

## 🚀 Quick Start Guide

### 1. Start the Backend
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000`*

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend opens on `http://localhost:5173`*
