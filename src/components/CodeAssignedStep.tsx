import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Copy,
  Check,
  Send,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
  User,
  Phone,
} from 'lucide-react';

interface CodeAssignedStepProps {
  participantName: string;
  phone?: string;
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
}

export const CodeAssignedStep: React.FC<CodeAssignedStepProps> = ({
  participantName,
  phone,
  specialCode,
  assignedPrize,
  telegramUrl = 'https://t.me/summaya_23',
  operatorPhone = '+998 93 799 04 23',
  operatorTelegram = '@summaya_23',
}) => {
  const [copied, setCopied] = useState(false);

  // Festive celebratory confetti
  useEffect(() => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#D4AF37', '#10B981', '#059669', '#FEF08A', '#FFFFFF'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#D4AF37', '#10B981', '#059669', '#FEF08A', '#FFFFFF'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(specialCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cleanOperatorTelegram = operatorTelegram.startsWith('http')
    ? operatorTelegram
    : `https://t.me/${operatorTelegram.replace('@', '')}`;

  const cleanTelegramUrl = telegramUrl.startsWith('http')
    ? telegramUrl
    : `https://t.me/${telegramUrl.replace('@', '')}`;

  const cleanPhoneHref = `tel:${operatorPhone.replace(/\s+/g, '')}`;

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto py-2 sm:py-4 px-1 flex flex-col items-center animate-fadeIn text-center">
      {/* Summaya Emblem */}
      <div className="relative mb-2">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 blur-sm opacity-70 animate-pulse" />
        <img
          src="/assets/aistudio/image_dee809e3.png"
          alt="Summaya Salomatlik Markazi"
          className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-2 border-amber-400 shadow-xl shadow-emerald-950/60"
        />
      </div>

      {/* Golden Badge */}
      <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black tracking-wider uppercase mb-2 shadow-md">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>G‘OLIB ISHTIROKCHI</span>
      </div>

      {/* Main Congratulation Heading Required by User (mobile-scaled) */}
      <h1 className="text-lg sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-emerald-200 font-serif tracking-tight mb-1.5 leading-snug">
        Tabriklaymiz, siz 3-ishtirokchi sifatida tanlab olindingiz!
      </h1>

      {/* Participant Pill */}
      <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 font-medium mb-3 bg-[#03150C]/90 px-3 py-1 rounded-full border border-emerald-500/30">
        <User className="w-3 h-3 text-amber-400" />
        <span className="font-semibold text-white">{participantName}</span>
        {phone && (
          <>
            <span className="text-emerald-600">•</span>
            <Phone className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-200 font-mono text-[10px]">{phone}</span>
          </>
        )}
      </div>

      {/* Special Code Glassmorphic Card */}
      <div className="w-full bg-[#041F13]/85 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden mb-3">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="text-[10px] uppercase font-bold text-amber-300/90 tracking-wider mb-1.5">
          Sizning maxsus kodingiz:
        </div>

        {/* Code Box */}
        <div className="bg-[#02130A] border border-amber-500/40 rounded-xl p-3 text-center shadow-inner">
          <div className="text-[9px] font-bold text-emerald-300/70 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>MAXSUS ISHTIROKCHI KODI:</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-amber-300 select-all">
              {specialCode}
            </span>
            <button
              onClick={handleCopyCode}
              className={`py-1.5 px-2.5 rounded-lg border transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer ${
                copied
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
              }`}
              title="Kodni nusxalash"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Nusxalandi</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Nusxalash</span>
                </>
              )}
            </button>
          </div>

          <p className="mt-2 text-[10px] text-amber-200/90 font-medium">
            Ushbu maxsus kodni operatorga taqdim etasiz!
          </p>
        </div>
      </div>

      {/* Operator Contact Callout - Mobile Ergonomic */}
      <div className="w-full bg-gradient-to-br from-[#06301C]/90 to-[#02180D]/90 backdrop-blur-xl border border-emerald-500/50 rounded-2xl p-3.5 sm:p-4 mb-3 text-left shadow-xl">
        <div className="flex items-start gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <PhoneCall className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-emerald-100 leading-tight">
              Batafsil ma’lumot olish va sovg‘ani qabul qilish uchun operator bilan bog‘laning!
            </h3>
            <p className="text-[10px] sm:text-[11px] text-emerald-300/80 mt-0.5">
              Kodingiz: <span className="font-mono font-bold text-amber-300">{specialCode}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons to Call Operator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20">
          <a
            href={cleanPhoneHref}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-emerald-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/30 transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-950" />
            <span>Qo‘ng‘iroq ({operatorPhone})</span>
          </a>

          <a
            href={cleanOperatorTelegram}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 border border-emerald-500/40 shadow-sm transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telegram ({operatorTelegram})</span>
          </a>
        </div>
      </div>

      {/* Telegram Channel Link */}
      <div className="w-full">
        <a
          href={cleanTelegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 rounded-xl bg-[#02130A]/90 hover:bg-[#031D10] text-emerald-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-emerald-500/30 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 text-emerald-400" />
          <span>Rasmiy Telegram Kanalimiz (@summaya_23)</span>
          <ExternalLink className="w-3 h-3 text-emerald-500" />
        </a>
      </div>
    </div>
  );
};
