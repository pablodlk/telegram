import React from 'react';
import { Send, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  brandName?: string;
  telegramUrl?: string;
  operatorPhone?: string;
  onOpenAdmin: () => void;
  isAdminLoggedIn?: boolean;
  onAdminDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  brandName = 'Summaya Salomatlik Markazi',
  telegramUrl = 'https://t.me/summaya_23',
  operatorPhone = '+998 93 799 04 23',
  onOpenAdmin,
  isAdminLoggedIn,
  onAdminDashboard,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#041A10]/80 border-b border-emerald-500/20">
      <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2">
          <img
            src="/assets/aistudio/image_dee809e3.png"
            alt="Summaya Logo"
            className="w-8 h-8 rounded-full object-cover border border-amber-400 shadow-md"
          />
          <div>
            <span className="font-serif font-extrabold text-sm sm:text-base tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-emerald-200">
              {brandName}
            </span>
            <span className="hidden sm:block text-[9px] text-emerald-300/80 tracking-wider uppercase font-medium">
              Sog‘lom hayot — baxtli kelajak!
            </span>
          </div>
        </div>

        {/* Quick Links & Admin Access */}
        <div className="flex items-center gap-2 sm:gap-3">
          {telegramUrl && (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/30 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden xs:inline">Telegram</span>
            </a>
          )}

          {operatorPhone && (
            <a
              href={`tel:${operatorPhone.replace(/\s+/g, '')}`}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>{operatorPhone}</span>
            </a>
          )}

          {isAdminLoggedIn ? (
            <button
              onClick={onAdminDashboard}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-amber-950 bg-gradient-to-r from-amber-300 to-amber-500 hover:from-amber-400 hover:to-amber-600 transition-all shadow-md shadow-amber-500/20"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-amber-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-colors"
              title="Administrator kirish"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
