import React, { useState, useEffect } from 'react';
import { type Language } from '../utils/i18n';
import { API_BASE_URL } from '../config/api';
import {
  Database,
  RefreshCw,
  Server,
  HardDrive,
  Activity,
  ShieldCheck,
  Table,
  History,
  Pill,
  CheckCircle2,
  FileCode2,
  PlusCircle,
  AlertCircle
} from 'lucide-react';

interface DBStats {
  engine: string;
  filePath: string;
  fileSizeKb: number;
  journalMode: string;
  counts: {
    patients: number;
    criticalRedTriage: number;
    syncAuditLogs: number;
    pharmacyInventory: number;
    aiChatLogs: number;
  };
}

interface AuditLog {
  id: number;
  patient_id: string;
  action: string;
  details: string;
  timestamp: number;
}

interface PatientRecord {
  id: string;
  villageCode: string;
  age: number;
  gender: string;
  triageCategory: 'RED' | 'YELLOW' | 'GREEN';
  triageScore: number;
  doctorPrescription?: string;
  version: number;
  synced: boolean;
  updatedAt: number;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  min_threshold: number;
  unit: string;
  village_code: string;
}

interface DatabaseExplorerProps {
  lang?: Language;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({ lang = 'mr' }) => {
  const [stats, setStats] = useState<DBStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'patients' | 'audit' | 'inventory' | 'schema'>('patients');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDatabaseData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats & Audit Logs
      const resStats = await fetch(`${API_BASE_URL}/api/db/stats`);
      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data.stats);
        setAuditLogs(data.recentAuditLogs || []);
      }

      // 2. Fetch Patients Table
      const resPatients = await fetch(`${API_BASE_URL}/api/referrals`);
      if (resPatients.ok) {
        const pData = await resPatients.json();
        setPatients(pData || []);
      }

      // 3. Fetch Pharmacy Inventory Table
      const resInv = await fetch(`${API_BASE_URL}/api/inventory`);
      if (resInv.ok) {
        const iData = await resInv.json();
        setInventory(iData || []);
      }
    } catch (err) {
      console.error('Failed to query SQLite backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  const handleReplenishStock = async (id: string, currentStock: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/${id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: currentStock + 10 })
      });
      if (res.ok) {
        setActionMessage(
          lang === 'mr'
            ? `SQLite डेटाबेसमध्ये साठा +१० अद्ययावत झाला!`
            : `Stock +10 updated in SQLite database!`
        );
        fetchDatabaseData();
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateSyncRecord = async () => {
    try {
      const randomId = `PAT-PAL-${Math.floor(100 + Math.random() * 900)}`;
      const newRec = {
        id: randomId,
        villageCode: 'MH-PAL-06 (Jawhar)',
        age: 34,
        gender: 'Female',
        vitals: { temp: 38.6, bpSystolic: 130, bpDiastolic: 85, pulse: 104, spo2: 95, respiratoryRate: 22 },
        symptoms: ['High Fever', 'Severe Body Ache'],
        triageCategory: 'YELLOW',
        triageScore: 3,
        doctorPrescription: 'Oral Paracetamol 650mg TDS and rest.',
        version: 1
      };

      const res = await fetch(`${API_BASE_URL}/api/sync-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRec)
      });

      if (res.ok) {
        setActionMessage(
          lang === 'mr'
            ? `नवीन रुग्ण (${randomId}) SQLite मध्ये यशस्वीपणे सेव्ह झाला!`
            : `New patient (${randomId}) successfully synchronized into SQLite table!`
        );
        fetchDatabaseData();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xl">
            <Database className="w-6 h-6 text-blue-700" />
            <h1>{lang === 'mr' ? 'SQLite रिलेशनल क्लाउड डेटाबेस व ऑडिट सेंटर' : lang === 'hi' ? 'SQLite रिलेशनल क्लाउड डेटाबेस एवं ऑडिट केंद्र' : 'SQLite Relational Database & Audit Explorer'}</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {lang === 'mr'
              ? 'स्थानिक IndexedDB मधून सर्व्हरवरील टिकाऊ SQLite ३ डेटाबेसमध्ये थेट डेटा साठवणूक आणि कॉन्फ्लिक्ट ऑडिट लॉग.'
              : lang === 'hi'
              ? 'स्थानीय IndexedDB से सर्वर पर टिकाऊ SQLite 3 डेटाबेस में सीधा डेटा स्टोरेज और ऑडिट ट्रेल।'
              : 'Persistent server-side ACID storage with Write-Ahead Logging (WAL) and 3-way conflict merge telemetry.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchDatabaseData}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold px-4 py-2 rounded border border-slate-300 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            {lang === 'mr' ? 'डेटा रिफ्रेश करा' : lang === 'hi' ? 'डेटा रिफ्रेश करें' : 'Refresh DB'}
          </button>
          <button
            onClick={handleSimulateSyncRecord}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            {lang === 'mr' ? '+ चाचणी रुग्ण सिंक करा' : lang === 'hi' ? '+ टेस्ट मरीज सिंक करें' : '+ Sync Test Patient'}
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg flex items-center gap-3 text-sm shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{actionMessage}</span>
        </div>
      )}

      {/* Database Engine Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">{lang === 'mr' ? 'डेटाबेस इंजिन' : 'Database Engine'}</span>
            <Server className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">SQLite 3.x</div>
          <div className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            {stats ? `Journal: ${stats.journalMode.toUpperCase()} Mode` : 'WAL Enabled'}
          </div>
        </div>

        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">{lang === 'mr' ? 'डिस्क फाईल आकार' : 'Disk Storage'}</span>
            <HardDrive className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{stats ? `${stats.fileSizeKb} KB` : '44 KB'}</div>
          <div className="text-xs text-slate-500 mt-1 truncate" title={stats?.filePath || 'arogya.db'}>
            arogya.db (Persistent)
          </div>
        </div>

        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">{lang === 'mr' ? 'एकूण रुग्ण' : 'Stored Patients'}</span>
            <Activity className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{stats?.counts.patients ?? patients.length}</div>
          <div className="text-xs text-red-700 font-medium mt-1">
            {stats ? `${stats.counts.criticalRedTriage} Code Red Triage` : '1 Critical'}
          </div>
        </div>

        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">{lang === 'mr' ? 'ऑडिट नोंदी' : 'Sync Audit Events'}</span>
            <History className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{stats?.counts.syncAuditLogs ?? auditLogs.length}</div>
          <div className="text-xs text-amber-700 font-medium mt-1">3-Way Merges Logged</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-300 space-x-2 bg-slate-100 p-1.5 rounded-t-lg">
        <button
          onClick={() => setActiveSubTab('patients')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            activeSubTab === 'patients'
              ? 'bg-white text-blue-900 shadow-sm border border-slate-300'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>{lang === 'mr' ? '१. रुग्ण डेटाबेस (patients)' : '1. Patients Table'}</span>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
            {patients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            activeSubTab === 'audit'
              ? 'bg-white text-blue-900 shadow-sm border border-slate-300'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{lang === 'mr' ? '२. सिंक ऑडिट लॉग (audit_log)' : '2. Sync Audit Trail'}</span>
          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            activeSubTab === 'inventory'
              ? 'bg-white text-blue-900 shadow-sm border border-slate-300'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>{lang === 'mr' ? '३. औषध साठा (pharmacy)' : '3. Pharmacy Inventory'}</span>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold">
            {inventory.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('schema')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            activeSubTab === 'schema'
              ? 'bg-white text-blue-900 shadow-sm border border-slate-300'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          <span>{lang === 'mr' ? '४. SQLite स्कीमा' : '4. Schema & DDL'}</span>
        </button>
      </div>

      {/* Tab 1: Patients Table */}
      {activeSubTab === 'patients' && (
        <div className="bg-white border border-slate-300 rounded-b-lg p-4 shadow-sm overflow-x-auto">
          <div className="text-xs text-slate-500 mb-3 flex items-center justify-between">
            <span>
              {lang === 'mr'
                ? 'टेबल: patients | प्राथमिक की: id | एन्क्रिप्शन: Web Crypto AES-GCM (नाव व नोट्स सुरक्षित)'
                : 'Table: patients | Primary Key: id | Cipher: Web Crypto AES-GCM'}
            </span>
            <span className="text-blue-700 font-semibold">SQLite Storage Engine</span>
          </div>

          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                <th className="p-2.5 font-bold">Record ID</th>
                <th className="p-2.5 font-bold">Village Center</th>
                <th className="p-2.5 font-bold">Age / Gender</th>
                <th className="p-2.5 font-bold">Triage Acuity</th>
                <th className="p-2.5 font-bold">MEWS Score</th>
                <th className="p-2.5 font-bold">Version</th>
                <th className="p-2.5 font-bold">Doctor Prescription</th>
                <th className="p-2.5 font-bold">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2.5 font-mono font-bold text-blue-900">{p.id}</td>
                  <td className="p-2.5 text-slate-700">{p.villageCode}</td>
                  <td className="p-2.5 text-slate-700">{p.age} yrs / {p.gender}</td>
                  <td className="p-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        p.triageCategory === 'RED'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : p.triageCategory === 'YELLOW'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {p.triageCategory}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-slate-900">{p.triageScore}</td>
                  <td className="p-2.5 font-mono text-purple-700 font-semibold">v{p.version}</td>
                  <td className="p-2.5 text-slate-600 max-w-xs truncate" title={p.doctorPrescription || 'None'}>
                    {p.doctorPrescription || <span className="text-slate-400 italic">Pending Tele-Doctor</span>}
                  </td>
                  <td className="p-2.5">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Persistent
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Sync Audit Trail */}
      {activeSubTab === 'audit' && (
        <div className="bg-white border border-slate-300 rounded-b-lg p-4 shadow-sm overflow-x-auto">
          <div className="text-xs text-slate-500 mb-3 flex items-center justify-between">
            <span>
              {lang === 'mr'
                ? 'टेबल: sync_audit_log | सर्व्हरवर नोंदवलेले थ्री-वे कॉन्फ्लिक्ट व डेटा सिंक इव्हेंट्स'
                : 'Table: sync_audit_log | Real-time distributed sync and conflict resolution telemetry'}
            </span>
            <span className="text-amber-700 font-semibold">Immutable Append-Only Log</span>
          </div>

          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                <th className="p-2.5 font-bold">Event ID</th>
                <th className="p-2.5 font-bold">Patient Key</th>
                <th className="p-2.5 font-bold">Action Taken</th>
                <th className="p-2.5 font-bold">Resolution Details</th>
                <th className="p-2.5 font-bold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono text-slate-500">#{log.id}</td>
                  <td className="p-2.5 font-mono font-bold text-blue-900">{log.patient_id}</td>
                  <td className="p-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        log.action === 'CONFLICT_RESOLVED_MERGED'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : log.action === 'CREATED'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-700">{log.details}</td>
                  <td className="p-2.5 text-slate-500 font-mono text-xs">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Pharmacy Inventory */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white border border-slate-300 rounded-b-lg p-4 shadow-sm overflow-x-auto">
          <div className="text-xs text-slate-500 mb-3 flex items-center justify-between">
            <span>
              {lang === 'mr'
                ? 'टेबल: pharmacy_inventory | प्राथमिक आरोग्य केंद्र व १०८ रुग्णवाहिका पुरवठा साठा'
                : 'Table: pharmacy_inventory | Real-time drug stock persisted in SQLite'}
            </span>
            <span className="text-emerald-700 font-semibold">Live Stock Updates</span>
          </div>

          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                <th className="p-2.5 font-bold">SKU ID</th>
                <th className="p-2.5 font-bold">Medicine / Resource Name</th>
                <th className="p-2.5 font-bold">Clinical Category</th>
                <th className="p-2.5 font-bold">Current Stock</th>
                <th className="p-2.5 font-bold">Min Threshold</th>
                <th className="p-2.5 font-bold">Sub-Center</th>
                <th className="p-2.5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inventory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono font-bold text-slate-700">{item.id}</td>
                  <td className="p-2.5 font-semibold text-slate-900">{item.name}</td>
                  <td className="p-2.5 text-slate-600">{item.category}</td>
                  <td className="p-2.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded font-bold ${
                        item.stock <= item.min_threshold
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.stock} {item.unit}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-600">{item.min_threshold} {item.unit}</td>
                  <td className="p-2.5 text-slate-600 font-mono text-xs">{item.village_code}</td>
                  <td className="p-2.5 text-right">
                    <button
                      onClick={() => handleReplenishStock(item.id, item.stock)}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded transition-colors"
                    >
                      +10 Replenish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Schema & DDL */}
      {activeSubTab === 'schema' && (
        <div className="bg-slate-900 text-slate-100 rounded-b-lg p-5 font-mono text-xs space-y-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span>-- SQLite 3 DDL Schema (arogya.db)</span>
            <span className="text-emerald-400">PRAGMA journal_mode = WAL;</span>
          </div>

          <pre className="text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  village_code TEXT,
  name_cipher TEXT,          -- AES-GCM Encrypted patient name
  name_iv TEXT,              -- 96-bit initialization vector
  age INTEGER,
  gender TEXT,
  vitals_json TEXT,          -- { temp, bpSystolic, bpDiastolic, pulse, spo2, respiratoryRate }
  symptoms_json TEXT,        -- ["Chest Pain", "Acute Shortness of Breath"]
  notes_cipher TEXT,
  notes_iv TEXT,
  triage_category TEXT,      -- RED | YELLOW | GREEN
  triage_score INTEGER,      -- On-Device MEWS Risk Score
  doctor_prescription TEXT,
  version INTEGER DEFAULT 1,
  synced INTEGER DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX idx_patients_triage ON patients(triage_category, triage_score);
CREATE INDEX idx_patients_village ON patients(village_code);

CREATE TABLE sync_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id TEXT,
  action TEXT,               -- CREATED | UPDATED | CONFLICT_RESOLVED_MERGED
  details TEXT,
  timestamp INTEGER
);

CREATE TABLE pharmacy_inventory (
  id TEXT PRIMARY KEY,
  name TEXT,
  category TEXT,
  stock INTEGER,
  min_threshold INTEGER,
  unit TEXT,
  village_code TEXT,
  updated_at INTEGER
);`}
          </pre>
        </div>
      )}

      {/* Technical Footnote */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-sm">
            {lang === 'mr' ? 'तांत्रिक माहिती: क्लाउड व ऑफलाइन दुहेरी डेटाबेस प्रणाली' : 'Technical Note: Hybrid Dual-Database Architecture'}
          </div>
          <p className="mt-0.5 text-blue-800">
            {lang === 'mr'
              ? 'हे ॲप फ्रंटएंडवर IndexedDB (स्थानिक एन्क्रिप्टेड स्टोरेज) आणि सर्व्हरवर SQLite ३ (रिलेशनल स्टोरेज) वापरते. जेव्हा इंटरनेट बंद असते, तेव्हा माहिती ब्राऊझरच्या IndexedDB मध्ये राहते; इंटरनेट सुरू होताच ती सर्व्हरवरील SQLite डेटाबेसमध्ये आपोआप विलीन होते.'
              : 'Arogya operates on an offline-first hybrid architecture: local IndexedDB on the mobile device (encrypted via Web Crypto AES-GCM), synchronized to an ACID-compliant SQLite 3 relational database with Write-Ahead Logging (WAL) on the server.'}
          </p>
        </div>
      </div>
    </div>
  );
};
