import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'arogya.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`✅ SQLite Database connected at: ${dbPath}`);
  }
});

// Promisified query helpers
export const query = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
};

// Database Schema Initialization & Auto-Migration
export async function initDatabase() {
  try {
    // 1. Enable WAL Mode (Write-Ahead Logging) for high-performance concurrent writes & reads
    await query.run('PRAGMA journal_mode = WAL;');
    await query.run('PRAGMA foreign_keys = ON;');

    // 2. Patients Table (Relational storage with full AES-GCM cipher compatibility)
    await query.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        village_code TEXT,
        name_cipher TEXT,
        name_iv TEXT,
        age INTEGER,
        gender TEXT,
        vitals_json TEXT,
        symptoms_json TEXT,
        notes_cipher TEXT,
        notes_iv TEXT,
        triage_category TEXT,
        triage_score INTEGER,
        doctor_prescription TEXT,
        version INTEGER DEFAULT 1,
        synced INTEGER DEFAULT 1,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);

    // Create Indexes for triage queue and village reporting
    await query.run(`CREATE INDEX IF NOT EXISTS idx_patients_triage ON patients(triage_category, triage_score);`);
    await query.run(`CREATE INDEX IF NOT EXISTS idx_patients_village ON patients(village_code);`);
    await query.run(`CREATE INDEX IF NOT EXISTS idx_patients_updated ON patients(updated_at);`);

    // 3. Sync & Conflict Resolution Audit Trail
    await query.run(`
      CREATE TABLE IF NOT EXISTS sync_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT,
        action TEXT,
        details TEXT,
        timestamp INTEGER
      );
    `);

    // 4. Pharmacy & Emergency Medical Inventory
    await query.run(`
      CREATE TABLE IF NOT EXISTS pharmacy_inventory (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        stock INTEGER,
        min_threshold INTEGER,
        unit TEXT,
        village_code TEXT,
        updated_at INTEGER
      );
    `);

    // 5. Clinical AI Chatbot Audit Log
    await query.run(`
      CREATE TABLE IF NOT EXISTS ai_chat_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT,
        message TEXT,
        lang TEXT,
        timestamp INTEGER
      );
    `);

    console.log('📦 Database tables & indexes verified.');

    // Seed initial mock records if empty
    await seedInitialData();
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
}

// Convert database row to client model
function formatPatientRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    villageCode: row.village_code,
    nameCipher: row.name_cipher,
    nameIv: row.name_iv,
    age: row.age,
    gender: row.gender,
    vitals: row.vitals_json ? JSON.parse(row.vitals_json) : {},
    symptoms: row.symptoms_json ? JSON.parse(row.symptoms_json) : [],
    notesCipher: row.notes_cipher || '',
    notesIv: row.notes_iv || '',
    triageCategory: row.triage_category,
    triageScore: row.triage_score,
    doctorPrescription: row.doctor_prescription || '',
    version: row.version,
    synced: Boolean(row.synced),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Seed realistic government records if database is fresh
async function seedInitialData() {
  const patientCount = await query.get('SELECT COUNT(*) as count FROM patients');
  if (patientCount && patientCount.count === 0) {
    console.log('🌱 Seeding initial NHM Telemedicine patients into SQLite database...');

    const demo1 = {
      id: 'PAT-DEMO-01',
      village_code: 'MH-PAL-02 (Manor)',
      name_cipher: 'U2F2aXRhIFBhd2Fy', // Base64 for Savita Pawar
      name_iv: 'MTIzNDU2Nzg5MDEy',
      age: 48,
      gender: 'Female',
      vitals_json: JSON.stringify({ temp: 39.2, bpSystolic: 82, bpDiastolic: 54, pulse: 128, spo2: 88, respiratoryRate: 28 }),
      symptoms_json: JSON.stringify(['Chest Pain (Radiating)', 'Acute Shortness of Breath', 'High Fever (>3 days)']),
      notes_cipher: '',
      notes_iv: '',
      triage_category: 'RED',
      triage_score: 9,
      doctor_prescription: 'Administer 4L oxygen immediately. Mobilize 108 Emergency Ambulance for Sub-District Hospital transfer.',
      version: 2,
      synced: 1,
      created_at: Date.now() - 7200000,
      updated_at: Date.now() - 3600000
    };

    const demo2 = {
      id: 'PAT-DEMO-02',
      village_code: 'MH-PAL-04 (Vikramgad)',
      name_cipher: 'R2FuZXNoIFNoaW5kZQ==', // Base64 for Ganesh Shinde
      name_iv: 'MTIzNDU2Nzg5MDEy',
      age: 62,
      gender: 'Male',
      vitals_json: JSON.stringify({ temp: 37.8, bpSystolic: 155, bpDiastolic: 95, pulse: 98, spo2: 93, respiratoryRate: 20 }),
      symptoms_json: JSON.stringify(['Productive Cough', 'High Fever (>3 days)']),
      notes_cipher: '',
      notes_iv: '',
      triage_category: 'YELLOW',
      triage_score: 4,
      doctor_prescription: 'Start Oral Amoxicillin 500mg TDS for 5 days. Monitor SpO2 twice daily.',
      version: 1,
      synced: 1,
      created_at: Date.now() - 14400000,
      updated_at: Date.now() - 7200000
    };

    const insertSql = `
      INSERT INTO patients (
        id, village_code, name_cipher, name_iv, age, gender,
        vitals_json, symptoms_json, notes_cipher, notes_iv,
        triage_category, triage_score, doctor_prescription, version, synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query.run(insertSql, [
      demo1.id, demo1.village_code, demo1.name_cipher, demo1.name_iv, demo1.age, demo1.gender,
      demo1.vitals_json, demo1.symptoms_json, demo1.notes_cipher, demo1.notes_iv,
      demo1.triage_category, demo1.triage_score, demo1.doctor_prescription, demo1.version, demo1.synced,
      demo1.created_at, demo1.updated_at
    ]);

    await query.run(insertSql, [
      demo2.id, demo2.village_code, demo2.name_cipher, demo2.name_iv, demo2.age, demo2.gender,
      demo2.vitals_json, demo2.symptoms_json, demo2.notes_cipher, demo2.notes_iv,
      demo2.triage_category, demo2.triage_score, demo2.doctor_prescription, demo2.version, demo2.synced,
      demo2.created_at, demo2.updated_at
    ]);

    await query.run(`
      INSERT INTO sync_audit_log (patient_id, action, details, timestamp)
      VALUES (?, 'SEEDED', 'Initial government demo record registered', ?)
    `, [demo1.id, Date.now()]);
  }

  // Seed pharmacy inventory if empty
  const stockCount = await query.get('SELECT COUNT(*) as count FROM pharmacy_inventory');
  if (stockCount && stockCount.count === 0) {
    console.log('🌱 Seeding PHC medical inventory into SQLite database...');
    const inventory = [
      ['MED-01', 'Polyvalent Anti-Snake Venom (ASV)', 'Emergency Antidote', 4, 10, 'Vials', 'MH-PAL-02', Date.now()],
      ['MED-02', 'Paracetamol 650mg Tablets', 'Antipyretic / Analgesic', 450, 200, 'Tablets', 'MH-PAL-02', Date.now()],
      ['MED-03', 'Amoxicillin 500mg Capsules', 'Broad-Spectrum Antibiotic', 180, 150, 'Capsules', 'MH-PAL-02', Date.now()],
      ['MED-04', 'WHO Oral Rehydration Salts (ORS)', 'Electrolyte Rehydration', 85, 100, 'Packets', 'MH-PAL-02', Date.now()],
      ['MED-05', 'Zinc Sulfate 20mg Dispersible', 'Pediatric Diarrhea Protocol', 320, 150, 'Tablets', 'MH-PAL-02', Date.now()],
      ['MED-06', 'Medical Oxygen Type D Cylinder', 'Respiratory Support', 2, 4, 'Cylinders', 'MH-PAL-02', Date.now()]
    ];

    for (const item of inventory) {
      await query.run(`
        INSERT INTO pharmacy_inventory (id, name, category, stock, min_threshold, unit, village_code, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, item);
    }
  }
}

// ----------------------------------------------------
// Database Access Methods
// ----------------------------------------------------

export async function getAllPatients() {
  const rows = await query.all(`
    SELECT * FROM patients 
    ORDER BY 
      CASE triage_category 
        WHEN 'RED' THEN 1 
        WHEN 'YELLOW' THEN 2 
        WHEN 'GREEN' THEN 3 
        ELSE 4 
      END ASC,
      triage_score DESC,
      updated_at DESC
  `);
  return rows.map(formatPatientRow);
}

export async function getPatientById(id) {
  const row = await query.get('SELECT * FROM patients WHERE id = ?', [id]);
  return formatPatientRow(row);
}

export async function syncOrMergePatient(incoming) {
  const existing = await query.get('SELECT * FROM patients WHERE id = ?', [incoming.id]);

  if (!existing) {
    // 1. New Record
    const insertSql = `
      INSERT INTO patients (
        id, village_code, name_cipher, name_iv, age, gender,
        vitals_json, symptoms_json, notes_cipher, notes_iv,
        triage_category, triage_score, doctor_prescription, version, synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `;
    const now = Date.now();
    await query.run(insertSql, [
      incoming.id,
      incoming.villageCode || 'MH-PAL-GEN',
      incoming.nameCipher || '',
      incoming.nameIv || '',
      incoming.age || 0,
      incoming.gender || 'Unknown',
      JSON.stringify(incoming.vitals || {}),
      JSON.stringify(incoming.symptoms || []),
      incoming.notesCipher || '',
      incoming.notesIv || '',
      incoming.triageCategory || 'GREEN',
      incoming.triageScore || 0,
      incoming.doctorPrescription || '',
      1,
      incoming.createdAt || now,
      now
    ]);

    await query.run(`
      INSERT INTO sync_audit_log (patient_id, action, details, timestamp)
      VALUES (?, 'CREATED', 'New patient intake synchronized to SQLite', ?)
    `, [incoming.id, now]);

    const created = await getPatientById(incoming.id);
    return { status: 'CREATED', record: created };
  }

  // 2. Conflict Detection & 3-Way Merge
  const incomingVer = incoming.version || 1;
  if (incomingVer <= existing.version) {
    console.log(`[SQLITE CONFLICT] Merging fields for ${incoming.id}: existing v${existing.version} vs incoming v${incomingVer}`);

    const mergedPrescription = existing.doctor_prescription || incoming.doctorPrescription || '';
    const newVersion = existing.version + 1;
    const now = Date.now();

    const updateSql = `
      UPDATE patients SET
        village_code = ?,
        name_cipher = ?,
        name_iv = ?,
        age = ?,
        gender = ?,
        vitals_json = ?,
        symptoms_json = ?,
        notes_cipher = ?,
        notes_iv = ?,
        triage_category = ?,
        triage_score = ?,
        doctor_prescription = ?,
        version = ?,
        synced = 1,
        updated_at = ?
      WHERE id = ?
    `;

    await query.run(updateSql, [
      incoming.villageCode || existing.village_code,
      incoming.nameCipher || existing.name_cipher,
      incoming.nameIv || existing.name_iv,
      incoming.age || existing.age,
      incoming.gender || existing.gender,
      JSON.stringify(incoming.vitals || JSON.parse(existing.vitals_json || '{}')),
      JSON.stringify(incoming.symptoms || JSON.parse(existing.symptoms_json || '[]')),
      incoming.notesCipher || existing.notes_cipher,
      incoming.notesIv || existing.notes_iv,
      incoming.triageCategory || existing.triage_category,
      incoming.triageScore ?? existing.triage_score,
      mergedPrescription,
      newVersion,
      now,
      incoming.id
    ]);

    await query.run(`
      INSERT INTO sync_audit_log (patient_id, action, details, timestamp)
      VALUES (?, 'CONFLICT_RESOLVED_MERGED', ?, ?)
    `, [incoming.id, `Resolved version conflict (bumped to v${newVersion}, preserved doctor prescription)`, now]);

    const merged = await getPatientById(incoming.id);
    return { status: 'CONFLICT_RESOLVED_MERGED', record: merged };
  }

  // 3. Regular Forward Update
  const newVer = incomingVer + 1;
  const now = Date.now();
  const updateSql = `
    UPDATE patients SET
      village_code = ?,
      name_cipher = ?,
      name_iv = ?,
      age = ?,
      gender = ?,
      vitals_json = ?,
      symptoms_json = ?,
      notes_cipher = ?,
      notes_iv = ?,
      triage_category = ?,
      triage_score = ?,
      doctor_prescription = ?,
      version = ?,
      synced = 1,
      updated_at = ?
    WHERE id = ?
  `;

  await query.run(updateSql, [
    incoming.villageCode || existing.village_code,
    incoming.nameCipher || existing.name_cipher,
    incoming.nameIv || existing.name_iv,
    incoming.age || existing.age,
    incoming.gender || existing.gender,
    JSON.stringify(incoming.vitals || {}),
    JSON.stringify(incoming.symptoms || []),
    incoming.notesCipher || existing.notes_cipher,
    incoming.notesIv || existing.notes_iv,
    incoming.triageCategory || existing.triage_category,
    incoming.triageScore ?? existing.triage_score,
    incoming.doctorPrescription || existing.doctor_prescription,
    newVer,
    now,
    incoming.id
  ]);

  await query.run(`
    INSERT INTO sync_audit_log (patient_id, action, details, timestamp)
    VALUES (?, 'UPDATED', ?, ?)
  `, [incoming.id, `Forward update to v${newVer}`, now]);

  const updated = await getPatientById(incoming.id);
  return { status: 'UPDATED', record: updated };
}

export async function setDoctorPrescription(id, prescription) {
  const existing = await query.get('SELECT * FROM patients WHERE id = ?', [id]);
  if (!existing) return null;

  const newVersion = existing.version + 1;
  const now = Date.now();

  await query.run(`
    UPDATE patients 
    SET doctor_prescription = ?, version = ?, updated_at = ?
    WHERE id = ?
  `, [prescription, newVersion, now, id]);

  await query.run(`
    INSERT INTO sync_audit_log (patient_id, action, details, timestamp)
    VALUES (?, 'PRESCRIBED', 'Doctor tele-prescription issued', ?)
  `, [id, now]);

  return getPatientById(id);
}

export async function getAuditLogs(limit = 20) {
  return query.all(`
    SELECT * FROM sync_audit_log 
    ORDER BY timestamp DESC 
    LIMIT ?
  `, [limit]);
}

export async function getInventory() {
  return query.all(`SELECT * FROM pharmacy_inventory ORDER BY stock ASC`);
}

export async function updateInventoryStock(id, newStock) {
  const now = Date.now();
  await query.run(`
    UPDATE pharmacy_inventory 
    SET stock = ?, updated_at = ?
    WHERE id = ?
  `, [newStock, now, id]);
  return query.get('SELECT * FROM pharmacy_inventory WHERE id = ?', [id]);
}

export async function logChatMessage(role, message, lang) {
  const now = Date.now();
  await query.run(`
    INSERT INTO ai_chat_logs (role, message, lang, timestamp)
    VALUES (?, ?, ?, ?)
  `, [role, message, lang, now]);
}

export async function getDatabaseStats() {
  const patientsCount = await query.get('SELECT COUNT(*) as count FROM patients');
  const criticalCount = await query.get("SELECT COUNT(*) as count FROM patients WHERE triage_category = 'RED'");
  const syncLogsCount = await query.get('SELECT COUNT(*) as count FROM sync_audit_log');
  const inventoryCount = await query.get('SELECT COUNT(*) as count FROM pharmacy_inventory');
  const chatLogsCount = await query.get('SELECT COUNT(*) as count FROM ai_chat_logs');

  let fileSizeKb = 0;
  try {
    const stats = fs.statSync(dbPath);
    fileSizeKb = Math.round(stats.size / 1024);
  } catch (e) {
    fileSizeKb = 0;
  }

  const walStatus = await query.get('PRAGMA journal_mode;');

  return {
    engine: 'SQLite 3 (Persistent Relational Database)',
    filePath: dbPath,
    fileSizeKb,
    journalMode: walStatus ? walStatus.journal_mode : 'wal',
    counts: {
      patients: patientsCount ? patientsCount.count : 0,
      criticalRedTriage: criticalCount ? criticalCount.count : 0,
      syncAuditLogs: syncLogsCount ? syncLogsCount.count : 0,
      pharmacyInventory: inventoryCount ? inventoryCount.count : 0,
      aiChatLogs: chatLogsCount ? chatLogsCount.count : 0
    }
  };
}
