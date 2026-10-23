/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ParticipantEntryStep } from './components/ParticipantEntryStep.js';
import { CodeAssignedStep } from './components/CodeAssignedStep.js';
import { WheelSpinStep } from './components/WheelSpinStep.js';
import { WinnerCelebrationStep } from './components/WinnerCelebrationStep.js';
import { AdminLogin } from './components/admin/AdminLogin.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { Prize } from './types/index.js';
import { Send, ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  const checkIsAdmin = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const search = window.location.search;
    return path === '/admin' || path.startsWith('/admin') || search.includes('admin=true') || search.includes('admin=1');
  };

  // Navigation Routing: Check if currently accessing '/admin' or ?admin=true
  const [isAdminPath, setIsAdminPath] = useState(checkIsAdmin());
  const [adminToken, setAdminToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('fortune_admin_token') : null
  );

  // Participant Flow Step: 'entry' | 'assigned' | 'wheel' | 'result'
  const [step, setStep] = useState<'entry' | 'assigned' | 'wheel' | 'result'>('entry');

  // Stored Assigned Code & Prize Details from Step 1
  const [assignedData, setAssignedData] = useState<{
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
  } | null>(null);

  // Active code for wheel
  const [activeWheelCode, setActiveWheelCode] = useState<string>('');
  // Wheel configuration & Segments count
  const [totalSegments, setTotalSegments] = useState<number>(7);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [brandName, setBrandName] = useState<string>('Summaya Salomatlik Markazi');
  const [telegramChannelUrl, setTelegramChannelUrl] = useState<string>('https://t.me/summaya_23');
  const [urlQrCode, setUrlQrCode] = useState<string>('');

  // Result from Server Spin
  const [spinWinnerResult, setSpinWinnerResult] = useState<{
    winningPrize: { name: string; description?: string; icon?: string; color?: string };
    ticketId: string;
    timestamp: string;
  } | null>(null);

  // Listen to popstate / path changes
  useEffect(() => {
    const handleRouteChange = () => {
      setIsAdminPath(checkIsAdmin());
    };
    window.addEventListener('popstate', handleRouteChange);

    // Keyboard shortcut for admin: Ctrl+Shift+A or Alt+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        window.history.pushState({}, '', '/admin');
        setIsAdminPath(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Parse URL params for product QR code or direct wheel code
    const params = new URLSearchParams(window.location.search);
    const qrParam = params.get('qr');
    if (qrParam) {
      setUrlQrCode(qrParam.trim().toUpperCase());
    }

    const codeParam = params.get('code');
    const wheelParam = params.get('wheel');
    if (codeParam) {
      setActiveWheelCode(codeParam.trim().toUpperCase());
      setStep('wheel');
    } else if (wheelParam === 'true' || wheelParam === '1') {
      setStep('wheel');
    }

    // Fetch public basic branding and wheel segment count
    fetch('/api/public/info')
      .then((res) => res.json())
      .then((data) => {
        if (data.brandName) setBrandName(data.brandName);
        if (data.telegramChannelUrl) setTelegramChannelUrl(data.telegramChannelUrl);
      })
      .catch(() => {});

    fetch('/api/wheel-segments')
      .then((res) => res.json())
      .then((data) => {
        if (data.totalSegments) setTotalSegments(data.totalSegments);
      })
      .catch(() => {});

    fetch('/api/prizes')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPrizes(data);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // -------------------------------------------------------------
  // ADMINISTRATOR SYSTEM (Completely Isolated at /admin)
  // -------------------------------------------------------------
  if (isAdminPath) {
    if (!adminToken) {
      return (
        <AdminLogin
          onLoginSuccess={(token) => {
            setAdminToken(token);
            localStorage.setItem('fortune_admin_token', token);
          }}
        />
      );
    }
    return (
      <AdminDashboard
        token={adminToken}
        onLogout={() => {
          fetch('/api/admin/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
          }).catch(() => {});
          setAdminToken(null);
          localStorage.removeItem('fortune_admin_token');
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // PARTICIPANT PORTAL (Mobile-Optimized & Summaya Brand Aesthetic)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#03140C] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black relative overflow-x-hidden font-sans">
      {/* Background Watermark & Emerald-Gold Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        {/* Soft Radial Ambient Lights */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-b from-emerald-500/15 via-emerald-800/10 to-transparent rounded-full blur-3xl opacity-80" />
        <div className="absolute top-[35%] -left-32 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute top-[50%] -right-32 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />

        {/* Official Summaya Logo Watermark Background */}
        <div
          className="w-[85vw] max-w-[460px] h-[85vw] max-h-[460px] opacity-[0.06] bg-center bg-no-repeat bg-contain pointer-events-none"
          style={{ backgroundImage: `url('/assets/aistudio/image_dee809e3.png')` }}
        />
      </div>

      {/* Compact Mobile-Friendly Top Navigation */}
      <header className="relative z-20 w-full backdrop-blur-md bg-[#041A10]/70 border-b border-emerald-500/20 px-3 py-2 sm:px-6 sm:py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/image_dee809e3.png"
              alt="Summaya Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-amber-400/50 shadow-md"
            />
            <div className="flex flex-col">
              <span className="font-serif font-black text-xs sm:text-sm tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-emerald-300 to-amber-300">
                SUMMAYA
              </span>
              <span className="text-[9px] text-emerald-300/80 font-medium tracking-tight -mt-0.5">
                Salomatlik Markazi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={telegramChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/40 text-emerald-200 text-[11px] font-semibold transition-colors shadow-sm"
            >
              <Send className="w-3 h-3 text-emerald-400" />
              <span>@summaya_23</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Dynamic Flow Container (Compact Mobile Padding) */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-3 py-4 sm:px-4 sm:py-6 w-full max-w-xl mx-auto">
        {/* STEP 1: PARTICIPANT ENTRY (Name, Surname, Phone) */}
        {step === 'entry' && (
          <ParticipantEntryStep
            brandName={brandName}
            telegramUrl={telegramChannelUrl}
            initialQrCode={urlQrCode}
            onSuccess={(data) => {
              setAssignedData(data);
              setActiveWheelCode(data.specialCode);
              setStep('assigned');
            }}
          />
        )}

        {/* STEP 2: CONGRATULATION & SPECIAL CODE & OPERATOR CONTACT */}
        {step === 'assigned' && assignedData && (
          <CodeAssignedStep
            participantName={assignedData.participantName}
            phone={assignedData.phone}
            specialCode={assignedData.specialCode}
            assignedPrize={assignedData.assignedPrize}
            telegramUrl={assignedData.telegramUrl}
            operatorPhone={assignedData.operatorPhone}
            operatorTelegram={assignedData.operatorTelegram}
          />
        )}

        {/* STEP 3: WHEEL SPIN STEP (If active) */}
        {step === 'wheel' && (
          <WheelSpinStep
            initialCode={activeWheelCode}
            totalSegments={totalSegments}
            onSpinSuccess={(result) => {
              setSpinWinnerResult(result);
              setStep('result');
            }}
            onBackToEntry={() => setStep('entry')}
          />
        )}

        {/* STEP 4: WINNER CELEBRATION */}
        {step === 'result' && spinWinnerResult && (
          <WinnerCelebrationStep
            participantName={assignedData?.participantName || 'Hurmatli G‘olib'}
            phone={assignedData?.phone}
            prizeName={spinWinnerResult.winningPrize.name}
            prizeIcon={spinWinnerResult.winningPrize.icon}
            ticketId={spinWinnerResult.ticketId}
            timestamp={spinWinnerResult.timestamp}
            operatorPhone={assignedData?.operatorPhone || '+998 93 799 04 23'}
          />
        )}
      </main>

      {/* Compact Mobile Footer with subtle Admin access */}
      <footer className="relative z-10 py-3 text-center text-[10px] sm:text-[11px] text-emerald-400/60 border-t border-emerald-950/80 bg-[#020E07]/60 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-1.5 px-3">
          <span>© {new Date().getFullYear()} {brandName}. Sog‘lom hayot — baxtli kelajak!</span>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/admin');
              setIsAdminPath(true);
            }}
            className="text-emerald-900 hover:text-amber-400 p-1 rounded transition-colors cursor-pointer"
            title="Administrator Kirish"
          >
            🔒
          </button>
        </div>
      </footer>
    </div>
  );
}
