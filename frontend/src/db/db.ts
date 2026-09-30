import Dexie, { type Table } from 'dexie';
import type { PatientVitals } from '../utils/triage';

export interface LocalPatient {
  id: string; // e.g. PAT-A1B2C3
  villageCode: string;
  nameCipher: string;
  nameIv: string;
  age: number;
  gender: string;
  vitals: PatientVitals;
  symptoms: string[];
  notesCipher: string;
  notesIv: string;
  triageCategory: 'RED' | 'YELLOW' | 'GREEN';
  triageScore: number;
  doctorPrescription?: string;
  version: number; // Used for conflict resolution
  synced: boolean;
  updatedAt: number;
}

export interface SyncQueueItem {
  id?: number;
  recordId: string;
  action: 'UPSERT';
  payload: LocalPatient;
  timestamp: number;
  retries: number;
}

export class TelemedDB extends Dexie {
  patients!: Table<LocalPatient, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('SanjeevaniOfflineDB');
    this.version(1).stores({
      patients: 'id, villageCode, triageCategory, version, synced, updatedAt',
      syncQueue: '++id, recordId, timestamp, retries'
    });
  }
}

export const db = new TelemedDB();