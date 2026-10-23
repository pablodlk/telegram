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
  phone: string; // Telefon raqami
  name: string;
  firstName?: string;
  lastName?: string;
  specialCode: string; // Maxsus yutuq kodi (masalan: DLK-782910)
  note: string;
  addedAt: string;
  isActive: boolean; // Faqat admin aktiv qilgandan so'ng barabanni aylantira oladi
  activatedAt?: string;
  hasWon: boolean; // Bir marta aktiv qilinsa, bir marta ishlata oladi
  wonAt?: string;
  prizeId?: string;
  prizeName?: string;
  assignedPrizeId?: string; // Admin maxsus kod uchun belgilagan sovg'a
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
  telegramBotUrl?: string; // Telegram bot / havola
  brandName: string;
  operatorPhone: string;
  operatorTelegram: string;
  isGameActive: boolean;
  defaultGlobalPrizeId?: string; // Barcha uchun yagona belgilangan sovg'a ("sovgani biz belgilaymz")
  customSiteUrl?: string; // QR-kod ichiga joylanadigan ochiq sayt havolasi
  googleSheetsWebhookUrl?: string; // Google Sheets Web App Webhook URL
  firebaseDatabaseUrl?: string; // Firebase Realtime DB / Firestore REST URL
  firebaseApiKey?: string;
}

export interface SpinResult {
  success: boolean;
  winningPrize: Prize;
  prizeIndex: number;
  totalSegments: number;
  ticketId: string;
  timestamp: string;
  message?: string;
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
