import React, { useState } from 'react';
import { User, Phone, Sparkles, AlertCircle, ArrowRight, PhoneCall, Send, ShieldAlert } from 'lucide-react';

interface ParticipantEntryStepProps {
  initialQrCode?: string;
  onSuccess: (data: {
    participantName: string;
    phone: string;
    specialCode: string;
    assignedPrize: {
      id: string;
      name: string;
      description?: string;
      icon?: string;
      color?: string;
    };
    telegramUrl: string;
    operatorPhone?: string;
    operatorTelegram?: string;
  }) => void;
  brandName?: string;
  telegramUrl?: string;
}

export const ParticipantEntryStep: React.FC<ParticipantEntryStepProps> = ({
  initialQrCode,
  onSuccess,
  brandName = 'Summaya Salomatlik Markazi',
  telegramUrl = 'https://t.me/summaya_23',
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const operatorPhone = '+998 93 799 04 23';
  const operatorTelegram = '@summaya_23';

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+998')) {
      val = '+998 ' + val.replace(/\D/g, '');
    }
    setPhone(val);
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanPhone = phone.trim();

    if (!cleanFirst) {
      setErrorMsg('Iltimos, ismingizni kiriting.');
      return;
    }
    if (!cleanLast) {
      setErrorMsg('Iltimos, familiyangizni kiriting.');
      return;
    }
    if (cleanFirst.length < 2 || cleanLast.length < 2) {
      setErrorMsg('Ism va familiya kamida 2 ta harfdan iborat bo‘lishi lozim.');
      return;
    }

    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 9) {
      setErrorMsg('Bu raqam sovg‘a uchun ro‘yxatga olinmagan');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: cleanFirst,
          lastName: cleanLast,
          phone: cleanPhone,
          qrCodeId: initialQrCode,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (_) {}

      if (!res.ok || !data?.success) {
        const message = data?.message || data?.error || 'Bu raqam sovg‘a uchun ro‘yxatga olinmagan';
        setErrorMsg(message);
        return;
      }

      // Successful registration: proceed to Step 2
      onSuccess({
        participantName: data.participantName,
        phone: data.phone || cleanPhone,
        specialCode: data.specialCode,
        assignedPrize: data.assignedPrize,
        telegramUrl: data.telegramUrl || telegramUrl,
        operatorPhone: data.operatorPhone || operatorPhone,
        operatorTelegram: data.operatorTelegram || operatorTelegram,
      });
    } catch (err) {
      setErrorMsg('Bu raqam sovg‘a uchun ro‘yxatga olinmagan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center">
      {/* Brand Header with Summaya Official Logo */}
      <div className="text-center mb-3 sm:mb-4 flex flex-col items-center">
        {/* Summaya Emblem */}
        <div className="relative mb-2">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 blur-sm opacity-60 animate-pulse" />
          <img
            src="/assets/aistudio/image_dee809e3.png"
            alt="Summaya Salomatlik Markazi"
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-400/80 shadow-xl shadow-emerald-950/60"
          />
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-bold tracking-wider mb-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>RASMIY YUTUQLI AKSIYA</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-emerald-200 font-serif tracking-tight">
          {brandName}
        </h1>

        <p className="text-[11px] sm:text-xs text-emerald-300/90 font-medium italic mt-0.5">
          "Sog‘lom hayot — baxtli kelajak!"
        </p>
      </div>

      {/* Main Glassmorphic Translucent Entry Card */}
      <div className="w-full bg-[#041F13]/85 backdrop-blur-xl border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl shadow-emerald-950/60 relative overflow-hidden">
        {/* Decorative Top Golden Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* QR Indicator if scanned */}
        {initialQrCode && (
          <div className="mb-3 p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center justify-between">
            <span className="font-medium">QR-kod:</span>
            <span className="font-mono font-bold bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-100">
              #{initialQrCode}
            </span>
          </div>
        )}

        {/* Error / Not-Whitelisted Notification with Operator Buttons */}
        {errorMsg && (
          <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-b from-red-950/90 to-[#1F070B]/90 border border-red-500/60 text-red-200 text-xs space-y-2.5 shadow-xl animate-fadeIn">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs sm:text-sm text-red-100 block leading-tight">
                  {errorMsg}
                </span>
                <span className="text-[10px] text-red-300/90 block mt-1">
                  Ushbu raqamni ro‘yxatga kiritish yoki sovg‘a olish uchun operatorimiz bilan bog‘laning:
                </span>
              </div>
            </div>

            {/* Operator Contact Buttons in Error Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-red-800/60">
              <a
                href={`tel:${operatorPhone.replace(/\s+/g, '')}`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow-md transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Qo‘ng‘iroq ({operatorPhone})</span>
              </a>

              <a
                href={`https://t.me/${operatorTelegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 text-white font-bold text-[11px] border border-emerald-500/40 shadow-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-emerald-300" />
                <span>Telegram ({operatorTelegram})</span>
              </a>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {/* First Name */}
            <div>
              <label className="block text-[11px] font-semibold text-emerald-100 mb-1">
                Ismingiz <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ismingiz"
                  className="w-full pl-8 pr-2.5 py-2 text-xs bg-[#02130A]/90 border border-emerald-600/40 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-colors"
                />
                <User className="w-3.5 h-3.5 text-emerald-400/80 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-[11px] font-semibold text-emerald-100 mb-1">
                Familiyangiz <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Familiyangiz"
                  className="w-full pl-8 pr-2.5 py-2 text-xs bg-[#02130A]/90 border border-emerald-600/40 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-colors"
                />
                <User className="w-3.5 h-3.5 text-emerald-400/80 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[11px] font-semibold text-emerald-100 mb-1">
              Telefon raqamingiz <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                disabled={loading}
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+998 90 123 45 67"
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#02130A]/90 border border-emerald-600/40 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 font-mono transition-colors font-semibold"
              />
              <Phone className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-2.5" />
            </div>
            <p className="text-[10px] text-emerald-300/70 mt-1 pl-1">
              Ruxsat etilgan raqamlarga maxsus sovg‘a kodi beriladi.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 hover:brightness-110 active:scale-[0.98] text-emerald-950 font-black text-xs sm:text-sm uppercase tracking-wide shadow-lg shadow-amber-500/20 border border-amber-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                <span>Tekshirilmoqda...</span>
              </>
            ) : (
              <>
                <span>Aksiyada Qatnashish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Telegram channel link */}
        <div className="mt-3 pt-3 border-t border-emerald-500/20 text-center">
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-600/30 text-emerald-200 text-[11px] font-semibold transition-colors"
          >
            <Send className="w-3 h-3 text-emerald-400" />
            <span>Rasmiy Telegram kanal: @summaya_23</span>
          </a>
        </div>
      </div>
    </div>
  );
};
