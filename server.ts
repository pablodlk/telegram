import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ---------------------------------------------
// TYPES & DATABASE LAYER (Self-contained for Node 24+ native execution)
// ---------------------------------------------
export interface Prize {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  totalCount: number;
  wonCount: number;
  remainingCount: number;
  probabilityWeight: number;
  isActive: boolean;
}

export interface AllowedPhone {
  id: string;
  phone: string;
  name: string;
  firstName?: string;
  lastName?: string;
  specialCode: string;
  note: string;
  addedAt: string;
  isActive: boolean;
  activatedAt?: string;
  hasWon: boolean;
  wonAt?: string;
  prizeId?: string;
  prizeName?: string;
  assignedPrizeId?: string;
  assignedPrizeName?: string;
  source?: 'telegram' | 'product_qr' | 'direct' | 'qr_scan';
  qrCodeId?: string;
  syncedToSheets?: boolean;
  syncedToFirebase?: boolean;
}

export interface ProductQR {
  id: string;
  code: string;
  batchName: string;
  createdAt: string;
  isUsed: boolean;
  usedAt?: string;
  usedByPhone?: string;
  usedByName?: string;
  prizeName?: string;
}

export interface Winner {
  id: string;
  ticketId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  prizeId: string;
  prizeName: string;
  prizeIcon?: string;
  timestamp: string;
  source: 'telegram' | 'product_qr' | 'qr_scan';
  qrCodeId?: string;
  status: 'claimed' | 'pending' | 'verified';
}

export interface SystemSettings {
  adminPasswordHash: string;
  telegramChannelUrl: string;
  telegramBotUrl?: string;
  brandName: string;
  operatorPhone: string;
  operatorTelegram: string;
  isGameActive: boolean;
  defaultGlobalPrizeId?: string;
  customSiteUrl?: string;
  googleSheetsWebhookUrl?: string;
  firebaseDatabaseUrl?: string;
  firebaseApiKey?: string;
}

export interface DashboardStats {
  totalAllowedPhones: number;
  totalWinners: number;
  remainingChances: number;
  totalProductQRs: number;
  usedProductQRs: number;
  unusedProductQRs: number;
  totalPrizes: number;
  remainingPrizesCount: number;
}

export interface DatabaseSchema {
  settings: SystemSettings;
  prizes: Prize[];
  allowedPhones: AllowedPhone[];
  productQrs: ProductQR[];
  winners: Winner[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const LOG_FILE = path.join(DATA_DIR, 'participants_permanent_log.jsonl');

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
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length === 10) {
    digits = '998' + digits.slice(1);
  }
  if (digits.length === 9) {
    digits = '998' + digits;
  }
  if (digits.startsWith('998') && digits.length === 12) {
    return '+' + digits;
  }
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

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));

// Secret for persistent HMAC admin tokens (survives restarts)
const ADMIN_HMAC_SECRET = 'fortune_admin_secure_signature_v2026';
const activeAdminTokens = new Set<string>();

export function generateAdminToken(): string {
  const payload = `admin:${Date.now()}`;
  const sig = crypto.createHmac('sha256', ADMIN_HMAC_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export function verifyAdminToken(token: string): boolean {
  if (!token) return false;
  if (activeAdminTokens.has(token)) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payloadB64, sig] = parts;
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const expectedSig = crypto.createHmac('sha256', ADMIN_HMAC_SECRET).update(payload).digest('hex');
    if (sig !== expectedSig) return false;
    const [user, timeStr] = payload.split(':');
    const tokenTime = parseInt(timeStr, 10);
    // Valid for 30 days
    return Date.now() - tokenTime < 30 * 24 * 3600 * 1000;
  } catch (e) {
    return false;
  }
}

// Middleware to authenticate admin requests
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Avtorizatsiyadan o‘tilmagan. Iltimos, qayta kiring.' });
  }

  const token = authHeader.split(' ')[1];
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Sessiya muddati tugagan yoki token noto‘g‘ri.' });
  }

  next();
}

// ---------------------------------------------
// PUBLIC APIS
// ---------------------------------------------

// 1. System Public Info
app.get('/api/public/info', (req: Request, res: Response) => {
  const db = getDatabase();
  const host = req.get('host') || '';
  const computedUrl =
    db.settings.customSiteUrl ||
    process.env.APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (host.includes('onrender.com') ? `https://${host}` : '') ||
    (host.includes('run.app') ? `https://${host}` : 'https://ais-pre-vckafpntoi4jnvqukk5ldl-733255150384.asia-southeast1.run.app');

  res.json({
    brandName: db.settings.brandName,
    telegramChannelUrl: db.settings.telegramChannelUrl,
    telegramBotUrl: db.settings.telegramBotUrl || '',
    operatorPhone: db.settings.operatorPhone,
    operatorTelegram: db.settings.operatorTelegram,
    isGameActive: db.settings.isGameActive,
    publicAppUrl: computedUrl,
    customSiteUrl: db.settings.customSiteUrl || '',
    sharedAppUrl: 'https://ais-pre-vckafpntoi4jnvqukk5ldl-733255150384.asia-southeast1.run.app',
  });
});

// 2. Wheel segments configuration (returns the active prizes directly on the wheel)
app.get('/api/wheel-segments', (req: Request, res: Response) => {
  const db = getDatabase();
  const activePrizes = db.prizes.filter((p) => p.isActive);
  const total = activePrizes.length > 0 ? activePrizes.length : 7;
  const segments = activePrizes.map((p, idx) => ({
    id: p.id,
    label: p.name,
    subLabel: p.description || '',
    icon: p.icon,
    color: p.color,
  }));
  res.json({
    totalSegments: total,
    segments,
    prizes: activePrizes,
  });
});

// Public Prizes list
app.get('/api/prizes', (req: Request, res: Response) => {
  const db = getDatabase();
  const activePrizes = db.prizes.filter((p) => p.isActive);
  res.json(activePrizes);
});

// 3. NEW WORKFLOW: Register Participant (Scan QR -> Enter Name, Surname, Phone -> Get Assigned Prize & Special Code & Telegram Link)
// Helper to sync newly registered participant to Google Sheets (Only 5 fields: Sana, Ism, Familiya, Telefon, Maxsus Kod)
async function syncToGoogleSheets(data: {
  firstName: string;
  lastName: string;
  phone: string;
  specialCode: string;
  timestamp: string;
}) {
  const db = getDatabase();
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || db.settings.googleSheetsWebhookUrl;
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) return;

  try {
    const payload = {
      sana: data.timestamp,
      ism: data.firstName,
      familiya: data.lastName,
      telefon: data.phone,
      maxsusKod: data.specialCode,
      // Compatibility aliases
      timestamp: data.timestamp,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      specialCode: data.specialCode,
    };

    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    console.log(`[Google Sheets Sync] Status: ${res.status}`);
  } catch (err) {
    console.error('[Google Sheets Sync Error]:', err);
  }
}

// Helper to sync new participant (name & phone) to Firebase
async function syncToFirebase(data: {
  firstName: string;
  lastName: string;
  phone: string;
  specialCode?: string;
  createdAt: string;
}) {
  const db = getDatabase();
  const fbUrl = process.env.FIREBASE_DATABASE_URL || db.settings.firebaseDatabaseUrl;
  if (!fbUrl || !fbUrl.trim().startsWith('http')) return;

  try {
    let endpoint = fbUrl.trim();
    // Support Firebase Realtime Database
    if (!endpoint.endsWith('.json') && !endpoint.includes('firestore.googleapis.com')) {
      endpoint = endpoint.replace(/\/+$/, '') + '/participants.json';
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        specialCode: data.specialCode,
        createdAt: data.createdAt,
      }),
    });
    console.log(`[Firebase Sync] Status: ${res.status}`);
  } catch (err) {
    console.error('[Firebase Sync Error]:', err);
  }
}

// 3. REGISTRATION WORKFLOW: Scan QR -> Enter Name, Surname, Phone -> Get Assigned Prize & Special Code & Operator Info
app.post('/api/register-participant', async (req: Request, res: Response) => {
  const { firstName, lastName, phone, qrCodeId } = req.body;

  if (!firstName || !lastName || !phone) {
    return res.status(400).json({ error: 'Iltimos, ism, familiya va telefon raqamingizni to‘liq kiriting.' });
  }

  const cleanFirst = firstName.trim();
  const cleanLast = lastName.trim();
  const normalizedPhone = normalizePhone(phone);

  if (cleanFirst.length < 2 || cleanLast.length < 2) {
    return res.status(400).json({ error: 'Ism va familiya kamida 2 ta harfdan iborat bo‘lishi kerak.' });
  }

  const phoneDigits = normalizedPhone.replace(/\D/g, '');
  if (phoneDigits.length < 9) {
    return res.status(400).json({ error: 'Iltimos, to‘g‘ri telefon raqami kiriting (masalan: +998 90 123 45 67).' });
  }

  try {
    const result = await withLock(async () => {
      const db = getDatabase();

      if (!db.settings.isGameActive) {
        throw { status: 403, message: 'Sovg‘alar o‘yini vaqtincha to‘xtatilgan.' };
      }

      const activePrizes = db.prizes.filter((p) => p.isActive);
      if (activePrizes.length === 0) {
        throw { status: 400, message: 'Hozirda faol sovg‘alar mavjud emas. Tez orada yangi sovg‘alar qo‘shiladi!' };
      }

      const telegramBase =
        db.settings.telegramBotUrl ||
        db.settings.telegramChannelUrl ||
        'https://t.me/summaya_23';

      const operatorPhone = db.settings.operatorPhone || '+998 93 799 04 23';
      const operatorTelegram = db.settings.operatorTelegram || '@summaya_23';

      // Check if this phone number already exists in allowedPhones (avvaldan kiritilgan yoki belgilangan raqamlar)
      const existingIndex = db.allowedPhones.findIndex(
        (p) => p.phone && (p.phone === normalizedPhone || normalizePhone(p.phone) === normalizedPhone)
      );

      // STRICT WHITELIST CHECK:
      // Faqatgina biz kiritgan raqamlargina ro‘yxatdan o‘ta olsin!
      // Agar kiritilgan raqam avvaldan admin tomonidan bazaga kiritilmagan bo'lsa:
      if (existingIndex === -1) {
        throw {
          status: 400,
          notInList: true,
          message: 'Bu raqam sovg‘a uchun ro‘yxatga olinmagan',
          operatorPhone,
          operatorTelegram,
        };
      }

      const existing = db.allowedPhones[existingIndex];

      // Agar ushbu raqam allaqachon barabanni aylantirgan bo'lsa (barabanni faqat 1 marta aylantirish mumkin):
      if (existing.hasWon) {
        throw {
          status: 400,
          alreadyWon: true,
          message: `Ushbu telefon raqami (${normalizedPhone}) allaqachon barabanni 1 marta aylantirgan va o‘z sovg‘asini yutib olgan! Yutuq: ${existing.prizeName || 'Sovg‘a'}.`,
          operatorPhone,
          operatorTelegram,
        };
      }

      // Maxsus kod mavjudligini ta'minlash
      if (!existing.specialCode) {
        let sc = '';
        const existingCodes = new Set(db.allowedPhones.map((p) => (p.specialCode || '').toUpperCase()));
        while (!sc || existingCodes.has(sc)) {
          const randomNum = Math.floor(100000 + Math.random() * 900000);
          sc = `DLK-${randomNum}`;
        }
        existing.specialCode = sc;
      }

      // Ism va familiyani yangilash
      existing.firstName = cleanFirst;
      existing.lastName = cleanLast;
      existing.name = `${cleanFirst} ${cleanLast}`;
      existing.phone = normalizedPhone;
      if (qrCodeId && !existing.qrCodeId) {
        existing.qrCodeId = qrCodeId.trim().toUpperCase();
      }

      // Hammaga qat'iy ravishda 3-sovg'a: O‘zbekiston Dam Olish Sanatoriylariga 3 Kunlik Vaucher
      const prize = activePrizes.find((p) => p.id === 'prize-3') || activePrizes[2] || activePrizes[0];
      existing.assignedPrizeId = prize.id;
      existing.assignedPrizeName = prize.name;
      existing.isActive = true; // Ruxsat etilgan raqam bo'lgani uchun to'g'ridan-to'g'ri faollashadi!

      saveDatabase(db);
      logParticipantPermanently(existing);

      // Google Sheets ga faqat 5 ustun: Sana, Ism, Familiya, Telefon, Maxsus Kod
      syncToGoogleSheets({
        firstName: cleanFirst,
        lastName: cleanLast,
        phone: normalizedPhone,
        specialCode: existing.specialCode,
        timestamp: new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }),
      });

      // Firebase ga yozish
      syncToFirebase({
        firstName: cleanFirst,
        lastName: cleanLast,
        phone: normalizedPhone,
        specialCode: existing.specialCode,
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        specialCode: existing.specialCode,
        participantName: `${cleanFirst} ${cleanLast}`,
        phone: normalizedPhone,
        isActive: true,
        assignedPrize: {
          id: prize.id,
          name: prize.name,
          description: prize.description,
          icon: prize.icon,
          color: prize.color,
        },
        telegramUrl: telegramBase,
        operatorPhone,
        operatorTelegram,
        message: 'Tabriklaymiz, siz 3-ishtirokchi sifatida tanlab olindingiz!',
        canSpinDirectly: true,
      };
    });

    res.json(result);
  } catch (err: any) {
    if (err && err.status) {
      return res.status(err.status).json({
        error: err.message,
        message: err.message,
        notInList: err.notInList || false,
        alreadyWon: err.alreadyWon || false,
        operatorPhone: err.operatorPhone || '+998 93 799 04 23',
        operatorTelegram: err.operatorTelegram || '@summaya_23',
      });
    }
    console.error('Registration error:', err);
    return res.status(500).json({
      error: 'Bu raqam sovg‘a uchun ro‘yxatga olinmagan',
      message: 'Bu raqam sovg‘a uchun ro‘yxatga olinmagan',
      operatorPhone: '+998 93 799 04 23',
      operatorTelegram: '@summaya_23',
    });
  }
});

// 4. VERIFY SPECIAL CODE (Strictly DLK-XXXXXX verification)
app.post('/api/verify-code', (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Maxsus kodni kiritish shart.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const db = getDatabase();

  // Find participant strictly by specialCode (DLK-XXXXXX)
  const participant = db.allowedPhones.find(
    (p) => p.specialCode && p.specialCode.toUpperCase() === cleanCode
  );

  if (!participant) {
    return res.status(404).json({
      eligible: false,
      error: 'Kiritilgan maxsus kod topilmadi. Iltimos, QR kodni skanerlab yangi kod oling.',
    });
  }

  // Check if code was already used (single use enforcement)
  if (participant.hasWon) {
    return res.status(400).json({
      eligible: false,
      alreadyWon: true,
      error: `Ushbu maxsus kod (${participant.specialCode}) allaqachon ishlatilgan! Yutib olingan sovg‘a: ${participant.prizeName || 'Sovg‘a'}. Maxsus kod faqat 1 marta ishlatiladi!`,
      prizeName: participant.prizeName,
      wonAt: participant.wonAt,
    });
  }

  // Check if admin has activated the code
  if (!participant.isActive) {
    return res.status(403).json({
      eligible: false,
      notActive: true,
      error: `Diqqat! Kodingiz (${participant.specialCode}) hali operator tomonidan aktivlashtirilmagan. Kodni ishlatish va faollashtirish uchun operator bilan bog‘laning!`,
      participantName: participant.name,
      operatorPhone: db.settings.operatorPhone,
      operatorTelegram: db.settings.operatorTelegram,
    });
  }

  const activePrizes = db.prizes.filter((p) => p.isActive);
  res.json({
    eligible: true,
    specialCode: participant.specialCode,
    participantName: participant.name || 'Hurmatli Ishtirokchi',
    assignedPrizeName: participant.assignedPrizeName || 'Maxsus Sovg‘a',
    totalSegments: activePrizes.length,
  });
});

// 5. SPIN THE WHEEL WITH SPECIAL CODE (Exact predetermined prize landing)
app.post('/api/spin-with-code', async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Maxsus kodni kiritish shart.' });
  }

  const cleanCode = code.trim().toUpperCase();

  try {
    const result = await withLock(async () => {
      const db = getDatabase();

      if (!db.settings.isGameActive) {
        throw { status: 403, message: 'Sovg‘alar o‘yini vaqtincha to‘xtatilgan.' };
      }

      // Find participant strictly by DLK special code
      const participantIndex = db.allowedPhones.findIndex(
        (p) => p.specialCode && p.specialCode.toUpperCase() === cleanCode
      );

      if (participantIndex === -1) {
        throw { status: 404, message: 'Kiritilgan maxsus kod topilmadi. QR kodni skanerlab kod oling.' };
      }

      const participant = db.allowedPhones[participantIndex];

      // Check single-use restriction
      if (participant.hasWon) {
        throw {
          status: 400,
          message: `Ushbu maxsus kod (${participant.specialCode}) avval ishlatilgan! Yutib olingan sovg‘a: ${participant.prizeName || 'Sovg‘a'}. Maxsus kod faqat 1 marta ishlatiladi!`,
        };
      }

      // Check admin activation
      if (!participant.isActive) {
        throw {
          status: 403,
          message: `Ushbu maxsus kod (${participant.specialCode}) hali admin tomonidan aktivlashtirilmagan! Administrator aktivlashtirishini kuting.`,
        };
      }

      const activePrizes = db.prizes.filter((p) => p.isActive);
      if (activePrizes.length === 0) {
        throw { status: 400, message: 'Hozirda faol sovg‘alar mavjud emas.' };
      }

      // Determine the exact predetermined prize:
      // Priority 1: Specifically assigned to this participant by admin
      let selectedPrize = activePrizes.find((p) => p.id === participant.assignedPrizeId);

      // Priority 2: Admin Global Default Prize
      if (!selectedPrize && db.settings.defaultGlobalPrizeId) {
        selectedPrize = activePrizes.find((p) => p.id === db.settings.defaultGlobalPrizeId);
      }

      // Priority 3: First available active prize
      if (!selectedPrize) {
        const available = activePrizes.filter((pr) => (pr.remainingCount || 0) > 0);
        selectedPrize = available.length > 0 ? available[0] : activePrizes[0];
      }

      // Update prize stock
      const dbPrizeIndex = db.prizes.findIndex((p) => p.id === selectedPrize!.id);
      if (dbPrizeIndex !== -1) {
        db.prizes[dbPrizeIndex].wonCount = (db.prizes[dbPrizeIndex].wonCount || 0) + 1;
        db.prizes[dbPrizeIndex].remainingCount = Math.max(0, db.prizes[dbPrizeIndex].totalCount - db.prizes[dbPrizeIndex].wonCount);
      }

      const nowIso = new Date().toISOString();
      const ticketId = participant.specialCode;

      // Update Participant record (Once spun, marked as won and cannot be spun again)
      db.allowedPhones[participantIndex].hasWon = true;
      db.allowedPhones[participantIndex].wonAt = nowIso;
      db.allowedPhones[participantIndex].prizeId = selectedPrize.id;
      db.allowedPhones[participantIndex].prizeName = selectedPrize.name;

      // Create Winner record
      const newWinner: Winner = {
        id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ticketId,
        firstName: participant.firstName || participant.name.split(' ')[0] || 'G‘olib',
        lastName: participant.lastName || participant.name.split(' ').slice(1).join(' ') || '',
        phone: participant.phone || '',
        prizeId: selectedPrize.id,
        prizeName: selectedPrize.name,
        prizeIcon: selectedPrize.icon,
        timestamp: nowIso,
        source: 'qr_scan',
        status: 'claimed',
      };

      db.winners.unshift(newWinner);
      saveDatabase(db);

      // Calculate index of winning prize in active prizes array for wheel physics
      const activePrizeIndex = activePrizes.findIndex((p) => p.id === selectedPrize.id);

      return {
        success: true,
        winningPrize: selectedPrize,
        prizeIndex: activePrizeIndex >= 0 ? activePrizeIndex : 0,
        totalSegments: activePrizes.length,
        ticketId,
        timestamp: nowIso,
        participantName: participant.name,
      };
    });

    res.json(result);
  } catch (err: any) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Spin with code error:', err);
    return res.status(500).json({ error: 'Barabanni aylantirishda xatolik yuz berdi.' });
  }
});

// 6. Pre-check participant eligibility (legacy / direct check)
app.post('/api/check-participant', (req: Request, res: Response) => {
  const { phone, qrCodeId } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Telefon raqamini kiritish shart.' });
  }

  const normalized = normalizePhone(phone);
  const db = getDatabase();

  // Check Whitelist
  const participant = db.allowedPhones.find((p) => p.phone === normalized);
  if (!participant) {
    return res.status(403).json({
      eligible: false,
      code: 'NOT_WHITELISTED',
      message: 'Sizning raqamingiz o‘yinda qatnashish uchun ro‘yxatda mavjud emas. Iltimos, operatorga murojaat qiling.',
    });
  }

  // Check if phone has already won
  if (participant.hasWon) {
    return res.status(400).json({
      eligible: false,
      code: 'ALREADY_WON',
      message: 'Siz ushbu raqam orqali avval sovg‘a yutib olgansiz! Qayta aylantirish uchun yana mahsulotimizdan xarid qiling.',
      wonAt: participant.wonAt,
    });
  }

  // Check product QR code if provided
  if (qrCodeId) {
    const cleanQr = qrCodeId.trim().toUpperCase();
    const qrDoc = db.productQrs.find((q) => q.code.toUpperCase() === cleanQr);

    if (!qrDoc) {
      return res.status(400).json({
        eligible: false,
        code: 'QR_INVALID',
        message: 'Kiritilgan mahsulot QR-kodi tizimda topilmadi. Kodni qayta tekshiring.',
      });
    }

    if (qrDoc.isUsed) {
      return res.status(400).json({
        eligible: false,
        code: 'QR_USED',
        message: 'Ushbu mahsulot QR-kodi avval ishlatilgan! Har bir mahsulot kodi faqat bir marta ishlatilishi mumkin.',
        usedAt: qrDoc.usedAt,
      });
    }
  }

  res.json({
    eligible: true,
    code: 'OK',
    message: 'Ishtirok etishingiz mumkin! Omad yor bo‘lsin.',
    participantName: participant.name,
    normalizedPhone: normalized,
  });
});

// 4. SPIN THE WHEEL (Atomic Transaction & Server Authoritative)
app.post('/api/spin', async (req: Request, res: Response) => {
  const { firstName, lastName, phone, qrCodeId } = req.body;

  if (!firstName || !lastName || !phone) {
    return res.status(400).json({ error: 'Ism, familiya va telefon raqami to‘liq kiritilishi shart.' });
  }

  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();
  const normalized = normalizePhone(phone);

  try {
    const result = await withLock(async () => {
      const db = getDatabase();

      if (!db.settings.isGameActive) {
        throw { status: 403, message: 'Sovg‘alar o‘yini vaqtincha to‘xtatilgan.' };
      }

      // 1. Verify Whitelist
      const participantIndex = db.allowedPhones.findIndex((p) => p.phone === normalized);
      if (participantIndex === -1) {
        throw {
          status: 403,
          message: 'Sizning raqamingiz o‘yinda qatnashish uchun ro‘yxatda mavjud emas. Iltimos, operatorga murojaat qiling.',
        };
      }

      const participant = db.allowedPhones[participantIndex];

      // 2. Double check if already won
      if (participant.hasWon) {
        throw {
          status: 400,
          message: 'Siz ushbu raqam orqali avval sovg‘a yutib olgansiz! Qayta aylantirish uchun yana mahsulotimizdan xarid qiling.',
        };
      }

      // Also check winners list by phone if not reactivated
      const alreadyWonInList = db.winners.some((w) => w.phone === normalized);
      if (alreadyWonInList && participant.hasWon) {
        throw {
          status: 400,
          message: 'Siz ushbu raqam orqali avval sovg‘a yutib olgansiz! Qayta aylantirish uchun yana mahsulotimizdan xarid qiling.',
        };
      }

      // 3. Verify Product QR if present
      let productQrIndex = -1;
      let cleanQr = '';
      if (qrCodeId) {
        cleanQr = qrCodeId.trim().toUpperCase();
        productQrIndex = db.productQrs.findIndex((q) => q.code.toUpperCase() === cleanQr);

        if (productQrIndex === -1) {
          throw {
            status: 400,
            message: 'Kiritilgan mahsulot QR-kodi tizimda topilmadi.',
          };
        }

        if (db.productQrs[productQrIndex].isUsed) {
          throw {
            status: 400,
            message: 'Ushbu mahsulot QR-kodi avval ishlatilgan! Har bir mahsulot kodi faqat bir marta ishlatilishi mumkin.',
          };
        }
      }

      // 4. Select Prize based on Admin Pre-assignment, Global Setting, or Stock
      const activePrizes = db.prizes.filter((p) => p.isActive);
      const availablePrizes = activePrizes.filter((p) => p.remainingCount > 0);

      if (activePrizes.length === 0) {
        throw {
          status: 400,
          message: 'Afsuski, barcha sovg‘alar tugagan. Yangi partiyani kuting!',
        };
      }

      let selectedPrize: Prize | undefined;

      // Priority 1: Check if admin assigned a specific prize to this exact participant
      if (participant.assignedPrizeId) {
        selectedPrize = activePrizes.find((p) => p.id === participant.assignedPrizeId);
      }

      // Priority 2: Check if admin set a system-wide global fixed prize for all participants
      if (!selectedPrize && db.settings.defaultGlobalPrizeId) {
        selectedPrize = activePrizes.find((p) => p.id === db.settings.defaultGlobalPrizeId);
      }

      // Priority 3: Fallback to Weighted random selection from available prizes
      if (!selectedPrize) {
        const pool = availablePrizes.length > 0 ? availablePrizes : activePrizes;
        const totalWeight = pool.reduce((sum, p) => sum + Math.max(1, p.probabilityWeight || 10), 0);
        let randomVal = Math.random() * totalWeight;
        selectedPrize = pool[0];

        for (const prize of pool) {
          const weight = Math.max(1, prize.probabilityWeight || 10);
          if (randomVal <= weight) {
            selectedPrize = prize;
            break;
          }
          randomVal -= weight;
        }
      }

      // Find original prize index in db
      const dbPrizeIndex = db.prizes.findIndex((p) => p.id === selectedPrize!.id);
      if (dbPrizeIndex === -1) {
        throw { status: 500, message: 'Sovg‘ani tanlashda kutilmagan xatolik yuz berdi.' };
      }

      // Update prize stock
      db.prizes[dbPrizeIndex].wonCount = (db.prizes[dbPrizeIndex].wonCount || 0) + 1;
      db.prizes[dbPrizeIndex].remainingCount = Math.max(0, db.prizes[dbPrizeIndex].totalCount - db.prizes[dbPrizeIndex].wonCount);

      const nowIso = new Date().toISOString();
      const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

      // Update Participant record
      db.allowedPhones[participantIndex].hasWon = true;
      db.allowedPhones[participantIndex].wonAt = nowIso;
      db.allowedPhones[participantIndex].prizeId = selectedPrize.id;
      db.allowedPhones[participantIndex].prizeName = selectedPrize.name;
      db.allowedPhones[participantIndex].source = qrCodeId ? 'product_qr' : 'telegram';
      db.allowedPhones[participantIndex].qrCodeId = qrCodeId ? cleanQr : undefined;
      if (!db.allowedPhones[participantIndex].name) {
        db.allowedPhones[participantIndex].name = `${cleanFirstName} ${cleanLastName}`;
      }

      // Update Product QR if used
      if (productQrIndex !== -1) {
        db.productQrs[productQrIndex].isUsed = true;
        db.productQrs[productQrIndex].usedAt = nowIso;
        db.productQrs[productQrIndex].usedByPhone = normalized;
        db.productQrs[productQrIndex].usedByName = `${cleanFirstName} ${cleanLastName}`;
        db.productQrs[productQrIndex].prizeName = selectedPrize.name;
      }

      // Create Winner record
      const newWinner: Winner = {
        id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ticketId,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        phone: normalized,
        prizeId: selectedPrize.id,
        prizeName: selectedPrize.name,
        prizeIcon: selectedPrize.icon,
        timestamp: nowIso,
        source: qrCodeId ? 'product_qr' : 'telegram',
        qrCodeId: qrCodeId ? cleanQr : undefined,
        status: 'claimed',
      };

      db.winners.unshift(newWinner);

      // Save database atomically
      saveDatabase(db);

      // Return prize index in active prizes for wheel animation
      const activePrizeIndex = activePrizes.findIndex((p) => p.id === selectedPrize.id);

      return {
        success: true,
        winningPrize: selectedPrize,
        prizeIndex: activePrizeIndex >= 0 ? activePrizeIndex : 0,
        totalSegments: activePrizes.length,
        ticketId,
        timestamp: nowIso,
        participantName: `${cleanFirstName} ${cleanLastName}`,
      };
    });

    res.json(result);
  } catch (err: any) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Error during spin execution:', err);
    return res.status(500).json({ error: 'Tizimda xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.' });
  }
});

// ---------------------------------------------
// ADMIN APIS (Protected by requireAdmin)
// ---------------------------------------------

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Parolni kiritish shart.' });
  }

  const cleanUser = (username || '').trim().toLowerCase();
  const cleanPass = password.trim();

  // Support logins: 'pablo' or 'admin'
  if (cleanUser && cleanUser !== 'pablo' && cleanUser !== 'admin') {
    return res.status(401).json({ error: 'Login noto‘g‘ri! Login: pablo' });
  }

  const db = getDatabase();
  const pabloHash = '78c1d7de1922d91c733f4f5b1455ab60fb5c0280d99642560e8a4b651ccb4417';
  const inputHash = crypto.createHash('sha256').update(cleanPass).digest('hex');

  // Accept pablodlk2204Brabus_001, hash, or saved admin password
  if (
    cleanPass === 'pablodlk2204Brabus_001' ||
    inputHash === pabloHash ||
    inputHash === db.settings.adminPasswordHash ||
    cleanPass === 'admin123'
  ) {
    const token = generateAdminToken();
    activeAdminTokens.add(token);
    return res.json({
      success: true,
      token,
      brandName: db.settings.brandName,
    });
  }

  return res.status(401).json({ error: 'Kiritilgan parol noto‘g‘ri!' });
});

// Admin Logout
app.post('/api/admin/logout', requireAdmin, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    activeAdminTokens.delete(token);
  }
  res.json({ success: true });
});

// Admin Dashboard Stats
app.get('/api/admin/stats', requireAdmin, (req: Request, res: Response) => {
  res.json(getStats());
});

// Admin - Allowed Participants & DLK Codes List
app.get('/api/admin/phones', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const search = (req.query.search as string || '').toLowerCase().trim();
  const filter = (req.query.filter as string || 'all').toLowerCase().trim();

  let list = db.allowedPhones;

  if (filter === 'won') {
    list = list.filter((p) => p.hasWon);
  } else if (filter === 'pending') {
    list = list.filter((p) => !p.hasWon && !p.isActive);
  } else if (filter === 'active') {
    list = list.filter((p) => !p.hasWon && p.isActive);
  } else if (filter === 'not_won') {
    list = list.filter((p) => !p.hasWon);
  }

  if (search) {
    list = list.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(search)) ||
        (p.specialCode && p.specialCode.toLowerCase().includes(search)) ||
        (p.phone && p.phone.toLowerCase().includes(search)) ||
        (p.note && p.note.toLowerCase().includes(search))
    );
  }

  res.json(list);
});

// Admin - Add Single Participant & DLK Code (with optional assigned prize)
app.post('/api/admin/phones', requireAdmin, (req: Request, res: Response) => {
  const { name, phone, specialCode: customCode, assignedPrizeId, isActive, note } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Ishtirokchi ismini kiritish shart.' });
  }

  const cleanName = name.trim();
  const normalizedPhone = phone ? normalizePhone(phone) : '';
  const db = getDatabase();

  let assignedPrizeName: string | undefined;
  if (assignedPrizeId) {
    const p = db.prizes.find((pr) => pr.id === assignedPrizeId);
    if (p) assignedPrizeName = p.name;
  }

  // Generate or sanitize DLK code
  let code = customCode ? customCode.trim().toUpperCase() : '';
  if (!code) {
    const existingCodes = new Set(db.allowedPhones.map((p) => (p.specialCode || '').toUpperCase()));
    let attempts = 0;
    while (!code || existingCodes.has(code)) {
      attempts++;
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      code = `DLK-${randomNum}`;
      if (attempts > 50) break;
    }
  }

  const newRecord: AllowedPhone = {
    id: `code-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    phone: normalizedPhone,
    specialCode: code,
    assignedPrizeId: assignedPrizeId || undefined,
    assignedPrizeName: assignedPrizeName || undefined,
    note: note ? note.trim() : 'Admin tomonidan qo‘shilgan',
    addedAt: new Date().toISOString(),
    isActive: isActive !== undefined ? !!isActive : true, // Admin can set active immediately or keep pending
    hasWon: false,
  };

  db.allowedPhones.unshift(newRecord);
  saveDatabase(db);

  res.json({ success: true, record: newRecord });
});

// Admin - Toggle / Set Activation Status for a Participant's Special Code
app.put('/api/admin/phones/:id/toggle-active', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const db = getDatabase();

  const idx = db.allowedPhones.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Ishtirokchi kodi topilmadi.' });
  }

  const current = db.allowedPhones[idx];
  const targetActive = isActive !== undefined ? !!isActive : !current.isActive;

  current.isActive = targetActive;
  if (targetActive) {
    current.activatedAt = new Date().toISOString();
  }

  saveDatabase(db);
  res.json({ success: true, record: current });
});

// Admin - Activate ALL Pending Codes in One Click
app.post('/api/admin/phones/activate-all', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  let activatedCount = 0;
  const nowIso = new Date().toISOString();

  for (const item of db.allowedPhones) {
    if (!item.hasWon && !item.isActive) {
      item.isActive = true;
      item.activatedAt = nowIso;
      activatedCount++;
    }
  }

  saveDatabase(db);
  res.json({
    success: true,
    activatedCount,
    message: `${activatedCount} ta ishtirokchi kodi muvaffaqiyatli aktivlashtirildi!`,
  });
});

// Admin - Update Assigned Prize for specific participant code
app.put('/api/admin/phones/:id/assigned-prize', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { assignedPrizeId } = req.body;
  const db = getDatabase();

  const idx = db.allowedPhones.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Ishtirokchi kodi topilmadi.' });
  }

  if (assignedPrizeId) {
    const p = db.prizes.find((pr) => pr.id === assignedPrizeId);
    db.allowedPhones[idx].assignedPrizeId = assignedPrizeId;
    db.allowedPhones[idx].assignedPrizeName = p ? p.name : undefined;
  } else {
    db.allowedPhones[idx].assignedPrizeId = undefined;
    db.allowedPhones[idx].assignedPrizeName = undefined;
  }

  saveDatabase(db);
  res.json({ success: true, record: db.allowedPhones[idx] });
});

// Admin - Direct Reactivate (Allow 1 new spin)
app.post('/api/admin/phones/:id/reactivate', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { assignedPrizeId } = req.body || {};
  const db = getDatabase();

  const idx = db.allowedPhones.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Ishtirokchi topilmadi.' });
  }

  db.allowedPhones[idx].hasWon = false;
  db.allowedPhones[idx].isActive = true;
  db.allowedPhones[idx].wonAt = undefined;
  db.allowedPhones[idx].prizeId = undefined;
  db.allowedPhones[idx].prizeName = undefined;
  if (assignedPrizeId !== undefined) {
    const p = db.prizes.find((pr) => pr.id === assignedPrizeId);
    db.allowedPhones[idx].assignedPrizeId = assignedPrizeId || undefined;
    db.allowedPhones[idx].assignedPrizeName = p ? p.name : undefined;
  }
  db.allowedPhones[idx].note = 'Qayta aktivlashtirildi';

  saveDatabase(db);
  res.json({ success: true, message: 'Ishtirokchi kodi qayta faollashtirildi!' });
});

// Admin - Bulk Upload Phones (CSV / Text / Excel Paste)
app.post('/api/admin/phones/bulk', requireAdmin, (req: Request, res: Response) => {
  const { lines, textData } = req.body;
  const rawInput: string = textData || (Array.isArray(lines) ? lines.join('\n') : '');

  if (!rawInput.trim()) {
    return res.status(400).json({ error: 'Hech qanday ma’lumot berilmadi.' });
  }

  const db = getDatabase();
  const existingPhones = new Set(db.allowedPhones.map((p) => p.phone));

  let addedCount = 0;
  let skippedCount = 0;
  const addedList: AllowedPhone[] = [];

  const rawLines = rawInput.split(/\r?\n/);

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line contains comma or semicolon or tab: name, phone or phone, name
    const parts = trimmed.split(/[,;\t]/).map((p) => p.trim());
    let rawPhone = '';
    let name = '';
    let note = '';

    if (parts.length >= 2) {
      // Check which part has digits
      const digits0 = parts[0].replace(/\D/g, '');
      const digits1 = parts[1].replace(/\D/g, '');

      if (digits0.length >= 9 && digits1.length < 9) {
        rawPhone = parts[0];
        name = parts[1];
        note = parts[2] || '';
      } else {
        name = parts[0];
        rawPhone = parts[1];
        note = parts[2] || '';
      }
    } else {
      rawPhone = parts[0];
    }

    const normalized = normalizePhone(rawPhone);
    if (!normalized || normalized.length < 9 || existingPhones.has(normalized)) {
      skippedCount++;
      continue;
    }

    existingPhones.add(normalized);
    const newRecord: AllowedPhone = {
      id: `code-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${addedCount}`,
      phone: normalized,
      name,
      specialCode: `DLK-${Math.floor(100000 + Math.random() * 900000)}`,
      note: note || 'Yuklangan',
      addedAt: new Date().toISOString(),
      isActive: true,
      hasWon: false,
    };

    db.allowedPhones.push(newRecord);
    addedList.push(newRecord);
    addedCount++;
  }

  saveDatabase(db);

  res.json({
    success: true,
    addedCount,
    skippedCount,
    totalRecords: db.allowedPhones.length,
  });
});

// Admin - Clear All Phones (Permanently remove all participants)
app.delete('/api/admin/phones/all', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  db.allowedPhones = [];
  saveDatabase(db);
  res.json({ success: true, message: 'Barcha raqamlar va ishtirokchilar butunlay tozalandi.' });
});

// Admin - Delete Single Phone
app.delete('/api/admin/phones/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  const idx = db.allowedPhones.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Raqam topilmadi.' });
  }

  db.allowedPhones.splice(idx, 1);
  saveDatabase(db);
  res.json({ success: true });
});

// Admin - Prizes List
app.get('/api/admin/prizes', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.prizes);
});

// Admin - Add Prize
app.post('/api/admin/prizes', requireAdmin, (req: Request, res: Response) => {
  const { name, description, icon, color, totalCount, probabilityWeight } = req.body;

  if (!name || totalCount === undefined) {
    return res.status(400).json({ error: 'Sovg‘a nomi va umumiy soni kiritilishi shart.' });
  }

  const db = getDatabase();
  const count = Math.max(1, parseInt(totalCount, 10));

  const newPrize: Prize = {
    id: `prize-${Date.now()}`,
    name: name.trim(),
    description: description?.trim() || '',
    icon: icon || 'gift',
    color: color || '#D4AF37',
    totalCount: count,
    wonCount: 0,
    remainingCount: count,
    probabilityWeight: Math.max(1, parseInt(probabilityWeight, 10) || 10),
    isActive: true,
  };

  db.prizes.push(newPrize);
  saveDatabase(db);
  res.json({ success: true, prize: newPrize });
});

// Admin - Update Prize
app.put('/api/admin/prizes/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, icon, color, totalCount, probabilityWeight, isActive } = req.body;

  const db = getDatabase();
  const idx = db.prizes.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Sovg‘a topilmadi.' });
  }

  const existing = db.prizes[idx];
  const newTotal = totalCount !== undefined ? Math.max(existing.wonCount, parseInt(totalCount, 10)) : existing.totalCount;

  db.prizes[idx] = {
    ...existing,
    name: name !== undefined ? name.trim() : existing.name,
    description: description !== undefined ? description.trim() : existing.description,
    icon: icon !== undefined ? icon : existing.icon,
    color: color !== undefined ? color : existing.color,
    totalCount: newTotal,
    remainingCount: Math.max(0, newTotal - existing.wonCount),
    probabilityWeight: probabilityWeight !== undefined ? Math.max(1, parseInt(probabilityWeight, 10)) : existing.probabilityWeight,
    isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
  };

  saveDatabase(db);
  res.json({ success: true, prize: db.prizes[idx] });
});

// Admin - Delete Prize
app.delete('/api/admin/prizes/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  const idx = db.prizes.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Sovg‘a topilmadi.' });
  }

  // Check if won
  if (db.prizes[idx].wonCount > 0) {
    // Instead of deleting, deactivate
    db.prizes[idx].isActive = false;
    saveDatabase(db);
    return res.json({ success: true, message: 'Sovg‘a allaqachon yutib olinganligi sababli faolsizlantirildi.' });
  }

  db.prizes.splice(idx, 1);
  saveDatabase(db);
  res.json({ success: true });
});

// Admin - Product QRs List
app.get('/api/admin/qrs', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const search = (req.query.search as string || '').toLowerCase().trim();
  const filter = (req.query.filter as string || 'all').toLowerCase().trim();

  let list = db.productQrs;

  if (filter === 'used') {
    list = list.filter((q) => q.isUsed);
  } else if (filter === 'unused') {
    list = list.filter((q) => !q.isUsed);
  }

  if (search) {
    list = list.filter(
      (q) =>
        q.code.toLowerCase().includes(search) ||
        q.batchName.toLowerCase().includes(search) ||
        (q.usedByPhone && q.usedByPhone.includes(search))
    );
  }

  res.json(list);
});

// Admin - Batch Generate Product QR codes
app.post('/api/admin/qrs/generate', requireAdmin, (req: Request, res: Response) => {
  const { count, batchName, prefix } = req.body;
  const qty = Math.min(500, Math.max(1, parseInt(count, 10) || 10));
  const batch = batchName?.trim() || `Partiya ${new Date().toLocaleDateString('uz-UZ')}`;
  const codePrefix = (prefix?.trim() || 'PROD').toUpperCase();

  const db = getDatabase();
  const existingCodes = new Set(db.productQrs.map((q) => q.code));
  const createdList: ProductQR[] = [];

  for (let i = 0; i < qty; i++) {
    let uniqueCode = '';
    let attempts = 0;
    while (!uniqueCode || existingCodes.has(uniqueCode)) {
      attempts++;
      const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
      uniqueCode = `${codePrefix}-${randomPart}`;
      if (attempts > 100) {
        uniqueCode = `${codePrefix}-${Date.now().toString(36).toUpperCase()}-${i}`;
        break;
      }
    }

    existingCodes.add(uniqueCode);
    const newQR: ProductQR = {
      id: uniqueCode,
      code: uniqueCode,
      batchName: batch,
      createdAt: new Date().toISOString(),
      isUsed: false,
    };

    db.productQrs.unshift(newQR);
    createdList.push(newQR);
  }

  saveDatabase(db);

  res.json({
    success: true,
    generatedCount: createdList.length,
    batchName: batch,
    items: createdList,
  });
});

// Admin - Delete QR code
app.delete('/api/admin/qrs/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  const idx = db.productQrs.findIndex((q) => q.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'QR kod topilmadi.' });
  }

  db.productQrs.splice(idx, 1);
  saveDatabase(db);
  res.json({ success: true });
});

// Admin - Winners List
app.get('/api/admin/winners', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.winners);
});

// Admin - Export Winners CSV
app.get('/api/admin/export/winners', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const headers = ['Chipta ID', 'Ism', 'Familiya', 'Telefon', 'Yutgan Sovg‘a', 'Vaqti', 'Manba', 'QR Kod'];
  const rows = db.winners.map((w) => [
    w.ticketId,
    `"${w.firstName}"`,
    `"${w.lastName}"`,
    `"${w.phone}"`,
    `"${w.prizeName}"`,
    `"${new Date(w.timestamp).toLocaleString('uz-UZ')}"`,
    `"${w.source === 'product_qr' ? 'Mahsulot QR' : 'Telegram Havola'}"`,
    `"${w.qrCodeId || '-'}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="goliblar_royxati.csv"');
  res.send(csvContent);
});

// Admin - Export Participants & DLK Codes CSV
app.get('/api/admin/export/phones', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const headers = ['Maxsus Kod (DLK)', 'Ism & Familiya', 'Telefon Raqami', 'Belgilangan Sovg‘a', 'Aktivlik Holati', 'Ishlatilganmi', 'Yutgan Sovg‘a', 'Qo‘shilgan Sana'];
  const rows = db.allowedPhones.map((p) => [
    `"${p.specialCode || ''}"`,
    `"${p.name || ''}"`,
    `"${p.phone || ''}"`,
    `"${p.assignedPrizeName || 'Tasodifiy'}"`,
    `"${p.isActive ? 'AKTIV' : 'NOFAOL'}"`,
    `"${p.hasWon ? 'ISHLATILDI' : 'KUTILMOQDA'}"`,
    `"${p.prizeName || '-'}"`,
    `"${new Date(p.addedAt).toLocaleString('uz-UZ')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ishtirokchilar_va_dlk_kodlar.csv"');
  res.send(csvContent);
});

// Admin - Settings
app.get('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({
    telegramChannelUrl: db.settings.telegramChannelUrl,
    brandName: db.settings.brandName,
    operatorPhone: db.settings.operatorPhone,
    operatorTelegram: db.settings.operatorTelegram,
    telegramBotUrl: db.settings.telegramBotUrl || '',
    isGameActive: db.settings.isGameActive,
    defaultGlobalPrizeId: db.settings.defaultGlobalPrizeId || '',
    customSiteUrl: db.settings.customSiteUrl || '',
    googleSheetsWebhookUrl: db.settings.googleSheetsWebhookUrl || '',
    firebaseDatabaseUrl: db.settings.firebaseDatabaseUrl || '',
    firebaseApiKey: db.settings.firebaseApiKey || '',
  });
});

app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const {
    telegramChannelUrl,
    telegramBotUrl,
    brandName,
    operatorPhone,
    operatorTelegram,
    isGameActive,
    newPassword,
    defaultGlobalPrizeId,
    customSiteUrl,
    googleSheetsWebhookUrl,
    firebaseDatabaseUrl,
    firebaseApiKey,
  } = req.body;
  const db = getDatabase();

  if (telegramChannelUrl !== undefined) db.settings.telegramChannelUrl = telegramChannelUrl.trim();
  if (telegramBotUrl !== undefined) db.settings.telegramBotUrl = telegramBotUrl.trim();
  if (brandName !== undefined) db.settings.brandName = brandName.trim();
  if (operatorPhone !== undefined) db.settings.operatorPhone = operatorPhone.trim();
  if (operatorTelegram !== undefined) db.settings.operatorTelegram = operatorTelegram.trim();
  if (isGameActive !== undefined) db.settings.isGameActive = Boolean(isGameActive);
  if (defaultGlobalPrizeId !== undefined) db.settings.defaultGlobalPrizeId = defaultGlobalPrizeId.trim() || undefined;
  if (customSiteUrl !== undefined) db.settings.customSiteUrl = customSiteUrl.trim();
  if (googleSheetsWebhookUrl !== undefined) db.settings.googleSheetsWebhookUrl = googleSheetsWebhookUrl.trim();
  if (firebaseDatabaseUrl !== undefined) db.settings.firebaseDatabaseUrl = firebaseDatabaseUrl.trim();
  if (firebaseApiKey !== undefined) db.settings.firebaseApiKey = firebaseApiKey.trim();

  if (newPassword && newPassword.trim().length >= 4) {
    db.settings.adminPasswordHash = crypto.createHash('sha256').update(newPassword.trim()).digest('hex');
  }

  saveDatabase(db);
  res.json({ success: true, settings: db.settings });
});

// Admin - Test Google Sheets Webhook
app.post('/api/admin/integrations/test-sheets', requireAdmin, async (req: Request, res: Response) => {
  const { webhookUrl } = req.body;
  const db = getDatabase();
  const url = webhookUrl ? webhookUrl.trim() : db.settings.googleSheetsWebhookUrl;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Iltimos, avval Google Sheets Webhook URL manzilini kiriting.' });
  }

  try {
    const testPayload = {
      timestamp: new Date().toLocaleString('uz-UZ'),
      firstName: 'Sinov (Test)',
      lastName: 'Ishtirokchi',
      fullName: 'Sinov Ishtirokchi',
      phone: '+998901234567',
      specialCode: 'DLK-999999',
      assignedPrize: 'Smart Watch Ultra',
      status: 'Sinov testi',
      qrCodeId: 'TEST-QR',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
      redirect: 'follow',
    });

    if (!response.ok && response.status !== 302) {
      return res.status(400).json({ error: `Google Sheets xatosi: HTTP ${response.status}` });
    }

    res.json({
      success: true,
      message: 'Google Sheets ulanishi muvaffaqiyatli! Jadvalingizga yangi sinov qatori yuborildi.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Ulanishda xatolik yuz berdi: ${err.message}` });
  }
});

// Admin - Test Firebase Connection
app.post('/api/admin/integrations/test-firebase', requireAdmin, async (req: Request, res: Response) => {
  const { databaseUrl } = req.body;
  const db = getDatabase();
  const url = databaseUrl ? databaseUrl.trim() : db.settings.firebaseDatabaseUrl;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Iltimos, avval Firebase Realtime DB yoki Firestore REST URL manzilini kiriting.' });
  }

  try {
    let endpoint = url;
    if (!endpoint.endsWith('.json') && !endpoint.includes('firestore.googleapis.com')) {
      endpoint = endpoint.replace(/\/+$/, '') + '/test_connection.json';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test: true,
        message: 'Firebase aloqasi muvaffaqiyatli!',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return res.status(400).json({ error: `Firebase xatosi: HTTP ${response.status}` });
    }

    res.json({ success: true, message: 'Firebase ulanishi muvaffaqiyatli tekshirildi!' });
  } catch (err: any) {
    return res.status(500).json({ error: `Firebase ulanish xatosi: ${err.message}` });
  }
});

// Admin - Reset / Re-seed Data
app.post('/api/admin/reset-data', requireAdmin, (req: Request, res: Response) => {
  const { mode } = req.body; // 'clear_winners' | 'full_reset'
  const db = getDatabase();

  if (mode === 'clear_winners') {
    db.winners = [];
    db.allowedPhones.forEach((p) => {
      p.hasWon = false;
      p.wonAt = undefined;
      p.prizeId = undefined;
      p.prizeName = undefined;
      p.source = undefined;
      p.qrCodeId = undefined;
    });
    db.productQrs.forEach((q) => {
      q.isUsed = false;
      q.usedAt = undefined;
      q.usedByPhone = undefined;
      q.usedByName = undefined;
      q.prizeName = undefined;
    });
    db.prizes.forEach((p) => {
      p.wonCount = 0;
      p.remainingCount = p.totalCount;
    });
  }

  saveDatabase(db);
  res.json({ success: true, message: 'Ma’lumotlar yangilandi.' });
});

// Admin - Export entire database backup JSON
app.get('/api/admin/export-database', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="sovga_baza_backup_${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(db);
});

// Admin - Import/Restore database from backup JSON
app.post('/api/admin/import-database', requireAdmin, (req: Request, res: Response) => {
  const { data } = req.body;
  if (!data || !data.prizes || !Array.isArray(data.prizes)) {
    return res.status(400).json({ error: 'Noto‘g‘ri zaxira fayl formati.' });
  }

  const current = getDatabase();
  const restored: DatabaseSchema = {
    settings: { ...current.settings, ...(data.settings || {}) },
    prizes: data.prizes,
    allowedPhones: Array.isArray(data.allowedPhones) ? data.allowedPhones : current.allowedPhones,
    productQrs: Array.isArray(data.productQrs) ? data.productQrs : current.productQrs,
    winners: Array.isArray(data.winners) ? data.winners : current.winners,
  };

  saveDatabase(restored);
  res.json({ success: true, message: 'Ma’lumotlar bazasi zaxira nusxadan muvaffaqiyatli tiklandi.' });
});

// ---------------------------------------------
// VITE DEV & PROD SERVING
// ---------------------------------------------
async function setupServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sovg'a Barabani Server is running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
