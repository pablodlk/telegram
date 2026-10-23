import React, { useState, useEffect } from 'react';
import {
  Save,
  Key,
  Flame,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Server,
  DollarSign,
  Send,
  Phone,
  Download,
  Upload,
  FileSpreadsheet,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Database,
} from 'lucide-react';

interface SettingsManagerProps {
  token: string;
  onRefreshStats: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ token, onRefreshStats }) => {
  const [telegramChannelUrl, setTelegramChannelUrl] = useState('');
  const [telegramBotUrl, setTelegramBotUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [operatorPhone, setOperatorPhone] = useState('');
  const [operatorTelegram, setOperatorTelegram] = useState('');
  const [isGameActive, setIsGameActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [defaultGlobalPrizeId, setDefaultGlobalPrizeId] = useState('');
  const [googleSheetsWebhookUrl, setGoogleSheetsWebhookUrl] = useState('');
  const [firebaseDatabaseUrl, setFirebaseDatabaseUrl] = useState('');
  const [prizesList, setPrizesList] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  // Integration testing states
  const [testingSheets, setTestingSheets] = useState(false);
  const [sheetsTestResult, setSheetsTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingFirebase, setTestingFirebase] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTelegramChannelUrl(data.telegramChannelUrl || '');
        setTelegramBotUrl(data.telegramBotUrl || '');
        setBrandName(data.brandName || '');
        setOperatorPhone(data.operatorPhone || '');
        setOperatorTelegram(data.operatorTelegram || '');
        setIsGameActive(data.isGameActive ?? true);
        setDefaultGlobalPrizeId(data.defaultGlobalPrizeId || '');
        setGoogleSheetsWebhookUrl(data.googleSheetsWebhookUrl || '');
        setFirebaseDatabaseUrl(data.firebaseDatabaseUrl || '');
      }

      // Fetch prizes for dropdown
      const pRes = await fetch('/api/admin/prizes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        setPrizesList(pData.filter((p: any) => p.isActive));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          telegramChannelUrl,
          telegramBotUrl,
          brandName,
          operatorPhone,
          operatorTelegram,
          isGameActive,
          defaultGlobalPrizeId,
          googleSheetsWebhookUrl,
          firebaseDatabaseUrl,
          ...(newPassword.trim() ? { newPassword } : {}),
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setNewPassword('');
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        const data = await res.json();
        setError(data.error || 'Sozlamalarni saqlashda xatolik yuz berdi');
      }
    } catch (e) {
      setError('Server bilan aloqa uzildi');
    } finally {
      setLoading(false);
    }
  };

  // Test Google Sheets Webhook
  const handleTestSheets = async () => {
    if (!googleSheetsWebhookUrl.trim()) {
      setSheetsTestResult({ success: false, message: 'Avval Google Sheets Webhook URL manzilini kiriting!' });
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
      if (res.ok) {
        setSheetsTestResult({
          success: true,
          message: data.message || 'Muvaffaqiyatli! Google Sheets jadvalingizga yangi sinov qatori qo‘shildi.',
        });
      } else {
        setSheetsTestResult({
          success: false,
          message: data.error || 'Webhook so‘rovi yuborishda xatolik yuz berdi.',
        });
      }
    } catch (err) {
      setSheetsTestResult({
        success: false,
        message: 'Tarmoqda xatolik yuz berdi. Webhook URL manzilini tekshiring.',
      });
    } finally {
      setTestingSheets(false);
    }
  };

  // Test Firebase connection
  const handleTestFirebase = async () => {
    if (!firebaseDatabaseUrl.trim()) {
      setFirebaseTestResult({ success: false, message: 'Avval Firebase Database URL manzilini kiriting!' });
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
        body: JSON.stringify({ firebaseDatabaseUrl: firebaseDatabaseUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setFirebaseTestResult({
          success: true,
          message: data.message || 'Muvaffaqiyatli! Firebase Realtime Database bilan aloqa o‘rnatildi.',
        });
      } else {
        setFirebaseTestResult({
          success: false,
          message: data.error || 'Firebase ulanishida xatolik yuz berdi.',
        });
      }
    } catch (err) {
      setFirebaseTestResult({
        success: false,
        message: 'Firebase bilan bog‘lanishda xatolik yuz berdi.',
      });
    } finally {
      setTestingFirebase(false);
    }
  };

  // Reset winners for testing
  const handleResetWinners = async () => {
    if (
      !confirm(
        'Diqqat! Sinov yutuqlari tozalanadi va barcha sovg‘alar zaxirasi boshlang‘ich holatiga qaytariladi. Davom etasizmi?'
      )
    )
      return;

    try {
      const res = await fetch('/api/admin/reset-winners', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('Sinov yutuqlari muvaffaqiyatli tozalandi va sovg‘alar zaxirasi qayta tiklandi!');
        onRefreshStats();
      }
    } catch (e) {
      alert('Xatolik yuz berdi');
    }
  };

  // Download entire database as JSON backup
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Yuklab olishda xatolik');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sovga_baza_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Zaxira faylini yuklab olishda xatolik yuz berdi');
    }
  };

  // Import JSON file to restore database
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        'Diqqat! Ushbu fayldagi ma’lumotlar hozirgi bazaning o‘rnini to‘liq egallaydi. Davom etasizmi?'
      )
    ) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        JSON.parse(jsonContent);

        const res = await fetch('/api/admin/backup/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: jsonContent,
        });

        if (res.ok) {
          setBackupMsg('Baza muvaffaqiyatli qayta tiklandi!');
          fetchSettings();
          onRefreshStats();
          setTimeout(() => setBackupMsg(null), 4000);
        } else {
          alert('Fayl tuzilishi noto‘g‘ri yoki server qabul qilmadi');
        }
      } catch (err) {
        alert('Tanlangan fayl to‘g‘ri JSON formatda emas');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // The exact Google Apps Script code for 1-click copy
  const googleAppsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Agar sarlavhalar (Header) mavjud bo'lmasa, birinchi qatorga yozamiz
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Sana va Vaqt",
        "Ism & Familiya",
        "Telefon Raqami",
        "Maxsus Kod (DLK)",
        "Belgilangan Sovg'a"
      ]);
      // Sarlavhani ajratib ko'rsatish
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#FEF08A");
    }

    var contents = e.postData.contents;
    var data = JSON.parse(contents);

    // Ishtirokchi ma'lumotlarini jadvalga yangi qator qilib yozish
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" }),
      data.fullName || ((data.firstName || "") + " " + (data.lastName || "")).trim(),
      data.phone || "",
      data.specialCode || "",
      data.assignedPrize || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Ishtirokchi muvaffaqiyatli saqlandi"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-[#031A10] border border-emerald-500/25 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-amber-300 font-serif flex items-center gap-2">
            <span>Tizim & Aksiya Sozlamalari</span>
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
            Aksiya rejimi
          </span>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Brend / Aksiya Nomi
            </label>
            <input
              type="text"
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Rasmiy Telegram Kanal Havolasi
            </label>
            <input
              type="url"
              required
              value={telegramChannelUrl}
              onChange={(e) => setTelegramChannelUrl(e.target.value)}
              placeholder="https://t.me/omadli_sovgala_official"
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Operator Telefon Raqami (Qo‘llab-quvvatlash)
            </label>
            <div className="relative">
              <input
                type="text"
                value={operatorPhone}
                onChange={(e) => setOperatorPhone(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
              <Phone className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Operator Telegram Foydalanuvchi Nomi
            </label>
            <div className="relative">
              <input
                type="text"
                value={operatorTelegram}
                onChange={(e) => setOperatorTelegram(e.target.value)}
                placeholder="@operator_nomi"
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
              <Send className="w-3.5 h-3.5 text-sky-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Barcha ishtirokchilar uchun umumiy yagona sovg'a belgilash */}
        <div className="pt-3 border-t border-slate-800 bg-[#070E24] p-4 rounded-2xl border border-amber-500/20">
          <label className="block text-xs font-bold text-amber-300 mb-1">
            Barcha Ishtirokchilar Uchun Yagona Sovg‘a Belgilash (Global Rejim)
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            Agar bu yerdan sovg‘a tanlasangiz, butun o‘yindagi barcha ishtirokchilarga (o‘ziga alohida sovg‘a belgilanmagan bo‘lsa) aynan shu sovg‘a aylanib tushadi!
          </p>
          <select
            value={defaultGlobalPrizeId}
            onChange={(e) => setDefaultGlobalPrizeId(e.target.value)}
            className="w-full sm:max-w-md px-3 py-2.5 text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-amber-300 font-semibold focus:outline-none"
          >
            <option value="">🎲 O‘chirilgan (Har bir kishiga o‘ziga belgilangan yoki tasodifiy sovg‘a)</option>
            {prizesList.map((p) => (
              <option key={p.id} value={p.id}>
                🎁 Barchaga FAQAT: {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Change Admin Password */}
        <div className="pt-2 border-t border-slate-800">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Yangi Administrator Parolini O‘rnatish (Ixtiyoriy)
          </label>
          <div className="relative max-w-sm">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="O‘zgartirmaslik uchun bo‘sh qoldiring"
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <Key className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Toggle Game Active */}
        <div className="pt-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="isGameActive"
            checked={isGameActive}
            onChange={(e) => setIsGameActive(e.target.checked)}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
          />
          <label htmlFor="isGameActive" className="text-xs font-semibold text-white cursor-pointer">
            Sovg‘alar o‘yini faol holatda (Aksiya ochiq)
          </label>
        </div>

        <div className="pt-3 flex items-center justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saqlanmoqda...' : 'Sozlamalarni Saqlash'}</span>
          </button>
        </div>
      </form>



      {/* Database Backup & Restore */}
      <div className="bg-[#031A10] border border-emerald-500/25 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-emerald-300 font-serif flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Ma’lumotlar Bazasi Zaxirasi (Backup & Restore)</span>
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
            Xavfsiz doimiy saqlash
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Kiritilgan sovg‘alar, telefon raqamlari va sozlamalarni kompyuteringizga to‘liq yuklab oling (JSON) yoki avval saqlangan zaxira nusxadan bir zumda qayta tiklang. Bu Render.com da ma’lumotlaringizni 100% yo‘qotmasdan saqlash uchun eng qulay vositadir.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baza Zaxira Nusxasini Yuklab Olish (.json)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#02130A] hover:bg-emerald-950 text-slate-200 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zaxirani Fayldan Tiklash</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
        {backupMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{backupMsg}</span>
          </div>
        )}
      </div>

      {/* Danger Zone: Reset test data */}
      <div className="bg-[#031A10] border border-red-950 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-red-300 font-serif flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>Sinov Yutuqlarini Tozalash (Test Reset)</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Agar sinov paytida g‘oliblar yozilgan bo‘lsa va haqiqiy aksiya oldidan sovg‘alar zaxirasini boshlang‘ich soniga qaytarmoqchi bo‘lsangiz, ushbu tugmani bosing. Ruxsat berilgan raqamlar o‘chmaydi, faqat ularning "Yutgan" holati bekor bo‘ladi.
        </p>
        <button
          type="button"
          onClick={handleResetWinners}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/50 hover:bg-red-800/80 text-red-200 border border-red-700/50 text-xs font-semibold transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sinov Yutuqlarini Tozalash va Zaxirani Qaytarish</span>
        </button>
      </div>
    </div>
  );
};
