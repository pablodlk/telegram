import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PhoneCall, Sparkles, CheckCircle, Ticket, Send } from 'lucide-react';
import { PrizeIcon } from './PrizeIcon.js';

interface WinnerCelebrationStepProps {
  participantName: string;
  phone?: string;
  prizeName: string;
  prizeIcon?: string;
  ticketId: string;
  timestamp: string;
  operatorPhone?: string;
  telegramUrl?: string;
}

export const WinnerCelebrationStep: React.FC<WinnerCelebrationStepProps> = ({
  participantName,
  phone,
  prizeName,
  prizeIcon,
  ticketId,
  timestamp,
  operatorPhone = '+998 93 799 04 23',
  telegramUrl = 'https://t.me/summaya_23',
}) => {
  // Fire festive confetti cannon on page load
  useEffect(() => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#D4AF37', '#10B981', '#059669', '#FEF08A', '#FFFFFF'],
      });
      confetti({
        particleCount: 5,
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

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto py-2 sm:py-4 px-2 flex flex-col items-center text-center animate-fadeIn">
      {/* Summaya Emblem */}
      <div className="relative mb-2">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 blur-sm opacity-70 animate-pulse" />
        <img
          src="/assets/aistudio/image_dee809e3.png"
          alt="Summaya Salomatlik Markazi"
          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-400 shadow-xl shadow-emerald-950/60"
        />
      </div>

      {/* Main Greeting Headlines */}
      <h2 className="text-lg sm:text-xl font-black text-amber-300 font-serif mb-0.5">
        TABRIKLAYMIZ, {participantName.toUpperCase()}!
      </h2>

      <p className="text-xs sm:text-sm font-bold text-emerald-200 mb-3">
        Siz sovg‘a yutib oldingiz!
      </p>

      {/* Prize Announcement Card */}
      <div className="w-full bg-[#041F13]/85 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden mb-3 text-center">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold mb-2">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>RASMIY TASDIQLANGAN YUTUQ</span>
        </div>

        <div className="text-[10px] uppercase text-emerald-300/80 tracking-wider font-semibold mb-1">
          Sizning sovg‘angiz:
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-emerald-200 font-serif mb-3">
          {prizeName}
        </div>

        {/* Ticket Reference */}
        <div className="bg-[#02130A] rounded-xl p-2.5 border border-amber-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-200 text-[11px]">
            <Ticket className="w-3.5 h-3.5 text-amber-400" />
            <span>Yutuq kodi:</span>
          </div>
          <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">{ticketId}</span>
        </div>
      </div>

      {/* Claim Instruction */}
      <p className="text-[11px] sm:text-xs text-emerald-100/90 mb-3 font-medium">
        Sovg‘angizni qabul qilish uchun operatorimiz bilan bog‘laning:
      </p>

      {/* Prominent Call Button */}
      <a
        href={`tel:${operatorPhone.replace(/\s+/g, '')}`}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 hover:brightness-110 active:scale-[0.98] text-emerald-950 font-black text-xs sm:text-sm uppercase tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all mb-2.5 cursor-pointer"
      >
        <PhoneCall className="w-4 h-4 text-emerald-950 shrink-0" />
        <span>Sovg‘ani olish ({operatorPhone})</span>
      </a>

      {/* Telegram Channel Button */}
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-2 px-3 rounded-xl bg-[#02130A]/90 hover:bg-[#031D10] text-emerald-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-emerald-500/30 transition-all cursor-pointer"
      >
        <Send className="w-3.5 h-3.5 text-emerald-400" />
        <span>Telegram kanalimiz: @summaya_23</span>
      </a>
    </div>
  );
};
