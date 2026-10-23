import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Prize, AllowedPhone, ProductQR, Winner, SystemSettings, DashboardStats } from '../src/types/index.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  settings: SystemSettings;
  prizes: Prize[];
  allowedPhones: AllowedPhone[];
  productQrs: ProductQR[];
  winners: Winner[];
}

// In-memory mutex for safe atomic transactions
let lockPromise = Promise.resolve();

export async function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const currentLock = lockPromise;
  lockPromise = nextLock;

  await currentLock;
  try {
    return await fn();
  } finally {
    release!();
  }
}

export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  // Remove spaces, dashes, parentheses
  let digits = rawPhone.replace(/\D/g, '');
  
  // If starts with 8 and length 10 or 11 in CIS
  if (digits.startsWith('8') && digits.length === 10) {
    digits = '998' + digits.slice(1);
  }
  
  // If 9 digits (standard Uzbek mobile: 901234567)
  if (digits.length === 9) {
    digits = '998' + digits;
  }
  
  // If starts with 998 and 12 digits
  if (digits.startsWith('998') && digits.length === 12) {
    return '+' + digits;
  }
  
  // For other international formats
  return '+' + digits;
}

const defaultInitialData: DatabaseSchema = {
  settings: {
    adminPasswordHash: crypto.createHash('sha256').update('pablodlk2204Brabus_001').digest('hex'),
    telegramChannelUrl: 'https://t.me/summaya_23',
    brandName: 'Summaya Salomatlik Markazi',
    operatorPhone: '+998 93 799 04 23',
    operatorTelegram: '@summaya_23',
    isGameActive: true,
    defaultGlobalPrizeId: 'prize-3',
  },
  prizes: [
    {
      id: 'prize-1',
      name: 'Nexia 3 Avtomobili',
      description: 'Bosh sovrin - yangi avtomobil',
      icon: 'car',
      color: '#DC2626',
      totalCount: 1,
      wonCount: 0,
      remainingCount: 1,
      probabilityWeight: 5,
      isActive: true,
    },
    {
      id: 'prize-2',
      name: 'Umra Safariga Yo‘llanma',
      description: 'Muborak Umra ziyoratiga to‘liq to‘plam',
      icon: 'plane',
      color: '#059669',
      totalCount: 5,
      wonCount: 0,
      remainingCount: 5,
      probabilityWeight: 10,
      isActive: true,
    },
    {
      id: 'prize-3',
      name: 'O‘zbekiston Dam Olish Sanatoriylariga 3 Kunlik Vaucher',
      description: 'Barcha qulayliklarga ega 3 kunlik dam olish',
      icon: 'ticket',
      color: '#2563EB',
      totalCount: 1000,
      wonCount: 0,
      remainingCount: 1000,
      probabilityWeight: 100,
      isActive: true,
    },
    {
      id: 'prize-4',
      name: 'Yirik Pul Mukofotlari',
      description: 'Kafolatlangan naqd pul sovrinlari',
      icon: 'banknote',
      color: '#D97706',
      totalCount: 20,
      wonCount: 0,
      remainingCount: 20,
      probabilityWeight: 20,
      isActive: true,
    },
    {
      id: 'prize-5',
      name: 'Katta Konkursga Yo‘llanma',
      description: 'Super yutuqli katta final bosqich chiptasi',
      icon: 'trophy',
      color: '#7C3AED',
      totalCount: 50,
      wonCount: 0,
      remainingCount: 50,
      probabilityWeight: 30,
      isActive: true,
    },
    {
      id: 'prize-6',
      name: 'iPhone 16 Pro Max',
      description: 'Eng so‘nggi flagman smartfoni',
      icon: 'smartphone',
      color: '#D4AF37',
      totalCount: 5,
      wonCount: 0,
      remainingCount: 5,
      probabilityWeight: 15,
      isActive: true,
    },
    {
      id: 'prize-7',
      name: 'Mikroto‘lqinli Pech',
      description: 'Zamonaviy oshxona uchun maishiy texnika',
      icon: 'microwave',
      color: '#0D9488',
      totalCount: 15,
      wonCount: 0,
      remainingCount: 15,
      probabilityWeight: 25,
      isActive: true,
    },
  ],
  allowedPhones: [],
  productQrs: [],
  winners: [],
};

const LOG_FILE = path.join(DATA_DIR, 'participants_permanent_log.jsonl');

export function logParticipantPermanently(record: AllowedPhone): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, JSON.stringify(record) + '\n', 'utf-8');
  } catch (err) {
    console.error('Error writing permanent participant log:', err);
  }
}

export function getDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let parsed: DatabaseSchema;
  if (!fs.existsSync(DB_FILE)) {
    saveDatabase(defaultInitialData);
    parsed = JSON.parse(JSON.stringify(defaultInitialData));
  } else {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error('Error reading db.json, falling back to default:', err);
      saveDatabase(defaultInitialData);
      parsed = JSON.parse(JSON.stringify(defaultInitialData));
    }
  }

  // Double protection: Ensure no participant is ever lost by syncing with permanent append-only log
  try {
    if (fs.existsSync(LOG_FILE)) {
      const logLines = fs.readFileSync(LOG_FILE, 'utf-8').split('\n').filter(Boolean);
      const existingIds = new Set(parsed.allowedPhones.map((p) => p.id));
      const existingCodes = new Set(parsed.allowedPhones.map((p) => (p.specialCode || '').toUpperCase()));
      let hasRecovered = false;

      for (const line of logLines) {
        try {
          const rec = JSON.parse(line) as AllowedPhone;
          if (rec.id && !existingIds.has(rec.id) && (!rec.specialCode || !existingCodes.has(rec.specialCode.toUpperCase()))) {
            parsed.allowedPhones.push(rec);
            existingIds.add(rec.id);
            if (rec.specialCode) existingCodes.add(rec.specialCode.toUpperCase());
            hasRecovered = true;
          }
        } catch (_) {}
      }

      if (hasRecovered) {
        saveDatabase(parsed);
      }
    }
  } catch (e) {
    console.error('Error in participant permanent log check:', e);
  }

  return parsed;
}

export function saveDatabase(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

export function getStats(): DashboardStats {
  const db = getDatabase();
  const totalAllowed = db.allowedPhones.length;
  const totalWinners = db.winners.length;
  const remainingChances = db.allowedPhones.filter((p) => !p.hasWon).length;
  const totalProductQRs = db.productQrs.length;
  const usedProductQRs = db.productQrs.filter((q) => q.isUsed).length;
  const unusedProductQRs = totalProductQRs - usedProductQRs;
  const totalPrizes = db.prizes.length;
  const remainingPrizesCount = db.prizes.reduce((acc, p) => acc + (p.remainingCount || 0), 0);

  return {
    totalAllowedPhones: totalAllowed,
    totalWinners,
    remainingChances,
    totalProductQRs,
    usedProductQRs,
    unusedProductQRs,
    totalPrizes,
    remainingPrizesCount,
  };
}
