import React from 'react';
import { AlertTriangle, XCircle, PhoneCall, Send, X, Trophy } from 'lucide-react';

interface StatusAlertProps {
  type: 'NOT_WHITELISTED' | 'ALREADY_WON' | 'QR_USED' | 'QR_INVALID' | 'GENERIC_ERROR';
  message: string;
  prizeName?: string;
  wonAt?: string;
  operatorPhone?: string;
  operatorTelegram?: string;
  onClose: () => void;
}

export const StatusAlert: React.FC<StatusAlertProps> = ({
  type,
  message,
  prizeName,
  wonAt,
  operatorPhone = '+998 93 799 04 23',
  operatorTelegram = '@summaya_23',
  onClose,
}) => {
  const isNotWhitelisted = type === 'NOT_WHITELISTED';
  const isAlreadyWon = type === 'ALREADY_WON';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm sm:max-w-md bg-[#041F13]/95 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-emerald-300/70 hover:text-white bg-[#02140A] hover:bg-[#062618] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          {isAlreadyWon ? (
            <div className="w-full h-full rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-7 h-7" />
            </div>
          ) : isNotWhitelisted ? (
            <div className="w-full h-full rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
          ) : (
            <div className="w-full h-full rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <XCircle className="w-7 h-7" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 font-serif">
          {isAlreadyWon
            ? 'Avval Yutuq Olingan'
            : isNotWhitelisted
            ? 'Ruxsat Berilmagan Raqam'
            : 'Xatolik Yuz Berdi'}
        </h3>

        {/* Main Required Text */}
        <p className="text-sm text-slate-200 mb-4 leading-relaxed font-medium">
          {message}
        </p>

        {/* Additional Won Info if applicable */}
        {isAlreadyWon && prizeName && (
          <div className="mb-5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/20 text-xs text-amber-200">
            <span className="text-slate-400 block mb-1">Siz yutgan sovg‘a:</span>
            <span className="font-bold text-sm text-amber-300">{prizeName}</span>
            {wonAt && (
              <span className="block text-[11px] text-slate-400 mt-1">
                Yutilgan vaqt: {new Date(wonAt).toLocaleString('uz-UZ')}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {isNotWhitelisted ? (
          <div className="space-y-2 mt-4">
            <div className="text-xs text-slate-400 mb-2">
              Ismingizni ro‘yxatga kiritish uchun administratorga murojaat qiling:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {operatorTelegram && (
                <a
                  href={`https://t.me/${operatorTelegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors shadow-md shadow-emerald-700/30"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram Operator</span>
                </a>
              )}
              {operatorPhone && (
                <a
                  href={`tel:${operatorPhone.replace(/\s+/g, '')}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold transition-colors shadow-md shadow-amber-500/20"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Qo‘ng‘iroq Qilish</span>
                </a>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full mt-2 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Tushundim, yopish
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            Yopish
          </button>
        )}
      </div>
    </div>
  );
};
