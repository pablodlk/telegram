import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Flame,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Send,
  Save,
  ExternalLink,
  Code2,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';

interface IntegrationsManagerProps {
  token: string;
}

export const IntegrationsManager: React.FC<IntegrationsManagerProps> = ({ token }) => {
  const [googleSheetsWebhookUrl, setGoogleSheetsWebhookUrl] = useState('');
  const [firebaseDatabaseUrl, setFirebaseDatabaseUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Testing states
  const [testingSheets, setTestingSheets] = useState(false);
  const [sheetsTestResult, setSheetsTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [testingFirebase, setTestingFirebase] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [copiedScript, setCopiedScript] = useState(false);

  const googleAppsScriptCode = `/**
 * Summaya Salomatlik Markazi - Google Sheets Avtomatik Qabul Qilish Skripti (Web App)
 * Yangi ro'yxatdan o'tgan har bir ishtirokchi ma'lumotlarini jadvalga qator qilib qo'shadi.
 */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Agar jadval bo'sh bo'lsa, avtomatik sarlavhalar (Header) qo'shamiz
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Sana va Vaqt",
        "Ism",
        "Familiya",
        "To'liq Ism",
        "Telefon Raqami",
        "Maxsus Kod (DLK)",
        "Belgilangan Sovg'a",
        "Holati",
        "QR Kod"
      ]);
      // Sarlavha stilini chiroyli qilish
      var headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setBackground("#0F172A");
      headerRange.setFontColor("#F8FAFC");
      headerRange.setFontWeight("bold");
    }
    
    // Kelgan JSON ma'lumotni o'qish
    var data = JSON.parse(e.postData.contents);
    
    // Yangi qator qo'shish
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("uz-UZ"),
      data.firstName || "",
      data.lastName || "",
      data.fullName || (data.firstName + " " + data.lastName),
      "'" + (data.phone || ""), // Format saqlanishi uchun matn sifatida
      data.specialCode || "",
      data.assignedPrize || "",
      data.status || "Kutilmoqda",
      data.qrCodeId || "-"
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Qator qo'shildi" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Google Sheets Webhook faol holatda!");
}`;

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleSheetsWebhookUrl(data.googleSheetsWebhookUrl || '');
        setFirebaseDatabaseUrl(data.firebaseDatabaseUrl || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          googleSheetsWebhookUrl: googleSheetsWebhookUrl.trim(),
          firebaseDatabaseUrl: firebaseDatabaseUrl.trim(),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Saqlashda xatolik yuz berdi');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSheets = async () => {
    if (!googleSheetsWebhookUrl.trim()) {
      alert('Iltimos, avval Google Sheets Webhook URL manzilini kiriting.');
      return;
    }

    setTestingSheets(true);
    setSheetsTestResult(null);

    try {
      const res = await fetch('/api/admin/integrations/test-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ webhookUrl: googleSheetsWebhookUrl.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSheetsTestResult({ success: true, message: data.message });
      } else {
        setSheetsTestResult({ success: false, message: data.error || 'Ulanishda xatolik' });
      }
    } catch (err: any) {
      setSheetsTestResult({ success: false, message: 'Tarmoq xatosi: ' + err.message });
    } finally {
      setTestingSheets(false);
    }
  };

  const handleTestFirebase = async () => {
    if (!firebaseDatabaseUrl.trim()) {
      alert('Iltimos, avval Firebase Database URL manzilini kiriting.');
      return;
    }

    setTestingFirebase(true);
    setFirebaseTestResult(null);

    try {
      const res = await fetch('/api/admin/integrations/test-firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ databaseUrl: firebaseDatabaseUrl.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFirebaseTestResult({ success: true, message: data.message });
      } else {
        setFirebaseTestResult({ success: false, message: data.error || 'Ulanishda xatolik' });
      }
    } catch (err: any) {
      setFirebaseTestResult({ success: false, message: 'Tarmoq xatosi: ' + err.message });
    } finally {
      setTestingFirebase(false);
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(googleAppsScriptCode);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch (e) {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-serif flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <span>Google Sheets & Firebase Integratsiyasi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Yangi kirgan har bir ishtirokchining ism-familiyasi, telefon raqami va maxsus kodi real vaqtda jadvalga va Firebase bazasiga avtomatik yoziladi.
          </p>
        </div>

        {/* Global Save Button */}
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saqlanmoqda...' : 'Sozlamalarni Saqlash'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Integratsiya sozlamalari muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1: GOOGLE SHEETS INTEGRATION */}
      <div className="bg-[#031A10] border border-emerald-500/25 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google Sheets (Jadvalga Avtomatik Yozish)</h3>
              <p className="text-[11px] text-slate-400">
                Kirgan barcha foydalanuvchilar ism, familiya, raqam va DLK kodi bilan jadval bo‘lib saqlanadi.
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              googleSheetsWebhookUrl
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {googleSheetsWebhookUrl ? 'Ulangan' : 'Kiritilmagan'}
          </span>
        </div>

        {/* Webhook Input & Test */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-200">
            Google Apps Script Webhook URL:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              value={googleSheetsWebhookUrl}
              onChange={(e) => setGoogleSheetsWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 px-4 py-2.5 text-xs bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl text-emerald-300 font-mono placeholder-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleTestSheets}
              disabled={testingSheets || !googleSheetsWebhookUrl}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingSheets ? 'Tekshirilmoqda...' : 'Ulanishni Tekshirish'}</span>
            </button>
          </div>

          {sheetsTestResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                sheetsTestResult.success
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/70 border-red-500/50 text-red-200'
              }`}
            >
              {sheetsTestResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{sheetsTestResult.message}</span>
            </div>
          )}
        </div>

        {/* Google Apps Script Box */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Code2 className="w-4 h-4" />
              <span>Google Sheets uchun Apps Script Kodi (Tayyor nusxa):</span>
            </span>
            <button
              onClick={handleCopyScript}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                copiedScript
                  ? 'bg-emerald-500 text-emerald-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {copiedScript ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-950" />
                  <span>Nusxalandi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kodni Nusxalash</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-black/80 border border-slate-800 rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed">
            {googleAppsScriptCode}
          </pre>

          {/* Setup Guide */}
          <div className="mt-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-300 space-y-1.5">
            <div className="font-bold text-white text-xs mb-1">📋 1 daqiqada Google Sheets ga ulash:</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
              <li><span className="text-white">sheets.google.com</span> ga kirib yangi jadval oching.</li>
              <li>Yuqori menyudan: <b>Extensions (Kengaytmalar) → Apps Script</b> bo‘limini oching.</li>
              <li>Mavjud kodni o‘chirib, yuqoridagi kodni qo‘ying va <b>Ctrl+S</b> bilan saqlang.</li>
              <li>Yuqori o‘ng burchakdagi ko‘k <b>"Deploy" (Joylashtirish) → "New deployment"</b> tugmasini bosing.</li>
              <li>Turi: <b>Web app</b>, Execute as: <b>Me</b>, Who has access: <b>Anyone</b> ni tanlab Deploy bosing.</li>
              <li>Nusxalangan <b>Web app URL</b> manzilini yuqoridagi maydonga joylang va "Saqlash"ni bosing!</li>
            </ol>
          </div>
        </div>
      </div>

      {/* SECTION 2: FIREBASE INTEGRATION */}
      <div className="bg-[#031A10] border border-emerald-500/25 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Firebase (Doimiy Baza Saqlash)</h3>
              <p className="text-[11px] text-slate-400">
                Faqat yangi kirgan ishtirokchilarning ism, familiya va telefon raqamlari Firebase bazasiga yoziladi.
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              firebaseDatabaseUrl
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {firebaseDatabaseUrl ? 'Ulangan' : 'Kiritilmagan'}
          </span>
        </div>

        {/* Firebase URL Input & Test */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-200">
            Firebase Realtime Database yoki Firestore REST URL:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              value={firebaseDatabaseUrl}
              onChange={(e) => setFirebaseDatabaseUrl(e.target.value)}
              placeholder="https://omadli-aksya-default-rtdb.firebaseio.com"
              className="flex-1 px-4 py-2.5 text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-amber-300 font-mono placeholder-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleTestFirebase}
              disabled={testingFirebase || !firebaseDatabaseUrl}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingFirebase ? 'Tekshirilmoqda...' : 'Firebase Ulanishini Tekshirish'}</span>
            </button>
          </div>

          {firebaseTestResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                firebaseTestResult.success
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/70 border-red-500/50 text-red-200'
              }`}
            >
              {firebaseTestResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{firebaseTestResult.message}</span>
            </div>
          )}

          {/* Firebase Guide */}
          <div className="mt-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-300 space-y-1.5">
            <div className="font-bold text-white text-xs mb-1">🔥 Firebase yaratish va ma’lumot olish:</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
              <li><span className="text-white">console.firebase.google.com</span> ga kiring va bepul yangi loyiha yarating.</li>
              <li>Chap menyudan <b>Build → Realtime Database</b> bo‘limiga o‘ting va "Create Database" bosing.</li>
              <li>Xavfsizlik qoidalarida yozishga ruxsat bering: <code>{`{ "rules": { ".read": true, ".write": true } }`}</code></li>
              <li>Baza yuqorisidagi havolani (masalan: <code>https://loyihangiz-default-rtdb.firebaseio.com</code>) nusxalab yuqoridagi maydonga joylang!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
