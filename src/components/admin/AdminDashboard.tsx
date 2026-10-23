import React, { useState, useEffect } from 'react';
import {
  Users,
  Gift,
  QrCode,
  Trophy,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { DashboardStats } from '../../types/index.js';
import { PhonesManager } from './PhonesManager.js';
import { PrizesManager } from './PrizesManager.js';
import { QRManager } from './QRManager.js';
import { WinnersManager } from './WinnersManager.js';
import { SettingsManager } from './SettingsManager.js';
import { IntegrationsManager } from './IntegrationsManager.js';

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'phones' | 'prizes' | 'qrs' | 'winners' | 'settings' | 'integrations'>('phones');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const navItems = [
    { id: 'phones', label: 'Ishtirokchilar & DLK Kodlar', icon: Users, desc: 'Aktivlashtirish va sovg‘a belgilash' },
    { id: 'integrations', label: 'Google Sheets & Firebase', icon: Zap, desc: 'Avtomatik sinxronizatsiya' },
    { id: 'prizes', label: 'Sovg‘alar Jamg‘armasi', icon: Gift, desc: 'Sovg‘alar zaxirasi' },
    { id: 'qrs', label: 'QR-Kodlar Tizimi', icon: QrCode, desc: 'Telegram va Mahsulot QR' },
    { id: 'winners', label: 'G‘oliblar Jurnali', icon: Trophy, desc: 'Yutuqlar tarixi va CSV' },
    { id: 'settings', label: 'Tizim Sozlamalari', icon: Settings, desc: 'Parametrlar va sozlamalar' },
  ] as const;

  return (
    <div className="min-h-screen w-full bg-[#02140C] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-black">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-[#041F13] border-b border-emerald-500/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img
            src="/assets/aistudio/image_dee809e3.png"
            alt="Summaya"
            className="w-7 h-7 rounded-full object-cover border border-amber-400"
          />
          <span className="font-bold text-xs text-white">Summaya Admin Boshqaruvi</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg bg-emerald-950 text-emerald-200 border border-emerald-500/30"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Professional Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 sm:w-72 bg-[#031A10] border-r border-emerald-500/25 flex flex-col justify-between z-50 shrink-0 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Sidebar Brand Header */}
          <div className="p-4 sm:p-5 border-b border-emerald-500/20 flex items-center gap-3">
            <img
              src="/assets/aistudio/image_dee809e3.png"
              alt="Summaya Logo"
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-md shrink-0"
            />
            <div>
              <div className="font-serif font-extrabold text-sm text-white tracking-wide">
                SUMMAYA ADMIN
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                Salomatlik Markazi
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-300/70 uppercase tracking-widest">
              Asosiy Bo‘limlar
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-emerald-100/90 hover:text-white hover:bg-emerald-950/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-950' : 'text-emerald-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-amber-950' : 'text-emerald-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer with Logout */}
        <div className="p-3.5 border-t border-emerald-500/20 bg-[#02130A]">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 text-red-200 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Tizimdan Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace - Full-Width (Removes restrictive max-w-7xl) */}
      <main className="flex-1 w-full min-w-0 p-3 sm:p-6 lg:p-8 overflow-y-auto bg-[#02140C]">
        {/* KPI Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
            <div className="bg-[#041F13]/90 border border-emerald-500/25 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-emerald-950/40">
              <div className="flex items-center justify-between text-emerald-300 mb-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase text-emerald-200">Jami Ishtirokchilar</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">
                {stats.totalAllowedPhones}
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-1">
                Faol / Kutilayotgan: <b className="text-amber-300">{stats.remainingChances}</b> ta
              </div>
            </div>

            <div className="bg-[#041F13]/90 border border-emerald-500/25 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-emerald-950/40">
              <div className="flex items-center justify-between text-emerald-300 mb-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase text-emerald-200">Jami G‘oliblar</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-300">
                {stats.totalWinners}
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-1">
                Berilgan sovg‘alar soni
              </div>
            </div>

            <div className="bg-[#041F13]/90 border border-emerald-500/25 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-emerald-950/40">
              <div className="flex items-center justify-between text-emerald-300 mb-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase text-emerald-200">Yagona QR-Kod</span>
                <QrCode className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">
                FAOL
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-1">
                Telegram & Mahsulotlar uchun umumiy
              </div>
            </div>

            <div className="bg-[#041F13]/90 border border-emerald-500/25 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-emerald-950/40">
              <div className="flex items-center justify-between text-emerald-300 mb-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase text-emerald-200">Sovg‘alar Qoldig‘i</span>
                <Gift className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-200">
                {stats.remainingPrizesCount}
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-1">
                {stats.totalPrizes} xil sovg‘a turida
              </div>
            </div>
          </div>
        )}

        {/* Selected Section Container - Expands 100% width on widescreen monitors */}
        <div className="bg-[#041F13]/90 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl w-full min-w-0">
          {activeTab === 'phones' && (
            <PhonesManager token={token} onRefreshStats={fetchStats} />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsManager token={token} />
          )}

          {activeTab === 'prizes' && (
            <PrizesManager token={token} onRefreshStats={fetchStats} />
          )}

          {activeTab === 'qrs' && (
            <QRManager token={token} onRefreshStats={fetchStats} />
          )}

          {activeTab === 'winners' && (
            <WinnersManager token={token} />
          )}

          {activeTab === 'settings' && (
            <SettingsManager token={token} onRefreshStats={fetchStats} />
          )}
        </div>
      </main>
    </div>
  );
};
