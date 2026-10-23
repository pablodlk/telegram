import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Gift,
  Target,
  KeyRound,
  User,
  Phone,
  Copy,
  Check,
  Zap,
  PowerOff,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { AllowedPhone, Prize } from '../../types/index.js';

interface PhonesManagerProps {
  token: string;
  onRefreshStats: () => void;
}

export const PhonesManager: React.FC<PhonesManagerProps> = ({ token, onRefreshStats }) => {
  const [phones, setPhones] = useState<AllowedPhone[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'won'>('all');

  // Single Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCode, setNewCode] = useState('');
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('');
  const [newIsActive, setNewIsActive] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);
  const [addNotice, setAddNotice] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Copied code feedback state
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const generateRandomDLK = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `DLK-${num}`;
  };

  // Fetch participants & DLK codes
  const fetchPhones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/phones?search=${encodeURIComponent(search)}&filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem('fortune_admin_token');
        window.location.reload();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPhones(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrizes = async () => {
    try {
      const res = await fetch('/api/admin/prizes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPrizes(data.filter((p: Prize) => p.isActive));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPhones();
    fetchPrizes();
  }, [search, filter]);

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Handle Add Single Participant & DLK Code
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddNotice(null);

    if (!newName.trim()) {
      setAddError('Iltimos, ism va familiyani kiriting.');
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch('/api/admin/phones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim() || undefined,
          specialCode: newCode.trim() || generateRandomDLK(),
          assignedPrizeId: selectedPrizeId || undefined,
          isActive: newIsActive,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem('fortune_admin_token');
        window.location.reload();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xatolik yuz berdi.');
      }

      setAddNotice('Yangi ishtirokchi kodi muvaffaqiyatli saqlandi!');
      setTimeout(() => {
        setShowAddModal(false);
        setNewName('');
        setNewPhone('');
        setNewCode('');
        setSelectedPrizeId('');
        setAddNotice(null);
      }, 900);

      fetchPhones();
      onRefreshStats();
    } catch (err: any) {
      setAddError(err.message || 'Xatolik yuz berdi.');
    } finally {
      setAddLoading(false);
    }
  };

  // Toggle Activation Status for a single code
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/phones/${id}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        showToast(!currentActive ? 'Kod aktivlashtirildi! Endi ishtirokchi barabanni aylantira oladi.' : 'Kod nofaol holatga o‘tkazildi.');
        fetchPhones();
        onRefreshStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Activate ALL Pending Codes in one click
  const handleActivateAll = async () => {
    const pendingCount = phones.filter((p) => !p.hasWon && !p.isActive).length;
    if (pendingCount === 0) {
      alert('Hozirda kutilayotgan faol bo‘lmagan kodlar mavjud emas.');
      return;
    }

    if (!confirm(`Barcha kutilayotgan (${pendingCount} ta) kodlarni bir vaqtda AKTIVLASHTIRISHNI tasdiqlaysizmi?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/phones/activate-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Barcha kodlar aktivlashtirildi!');
        fetchPhones();
        onRefreshStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Change or remove assigned prize directly for a code
  const handleQuickAssignPrize = async (recordId: string, prizeId: string) => {
    try {
      const res = await fetch(`/api/admin/phones/${recordId}/assigned-prize`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedPrizeId: prizeId || null,
        }),
      });
      if (res.ok) {
        showToast('Ushbu kod uchun sovg‘a muvaffaqiyatli belgilandi!');
        fetchPhones();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reactivate a won code
  const handleReactivate = async (id: string, name: string) => {
    if (!confirm(`Ishtirokchi (${name}) ga qayta o‘ynash imkoniyati berilsinmi?`)) return;

    try {
      const res = await fetch(`/api/admin/phones/${id}/reactivate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Kod qayta aktivlashtirildi!');
        fetchPhones();
        onRefreshStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Delete Single Record (Permanently deletes from disk)
  const handleDelete = async (id: string) => {
    if (!confirm('Ushbu ishtirokchi kodini butunlay o‘chirib tashlamoqchimisiz?')) return;
    try {
      const res = await fetch(`/api/admin/phones/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Ishtirokchi kodi butunlay o‘chirildi.');
        fetchPhones();
        onRefreshStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Clear ALL Records (Permanently deletes from disk)
  const handleClearAll = async () => {
    if (!confirm('DIQQAT! Barcha ishtirokchilar va maxsus kodlar ro‘yxatini BUTUNLAY o‘chirib tashlashni tasdiqlaysizmi? Bu amal qaytarilmaydi!')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/phones/all', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Barcha ishtirokchilar va kodlar tozalandi.');
        fetchPhones();
        onRefreshStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    fetch('/api/admin/export/phones', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ishtirokchilar_va_dlk_kodlar.csv';
        a.click();
      });
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const pendingCount = phones.filter((p) => !p.hasWon && !p.isActive).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs rounded-2xl flex items-center gap-2 shadow-xl animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{actionMessage}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-serif">
              Ishtirokchilar & Maxsus Kodlar
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-mono text-[11px] font-bold">
              DLK-XXXXXX
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            QR-skaner orqali ro‘yxatdan o‘tgan ishtirokchilar. Admin kodni aktivlashtirib, unga tushadigan sovg‘ani belgilaydi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Activate All Pending Button */}
          {pendingCount > 0 && (
            <button
              onClick={handleActivateAll}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 border border-emerald-400/40 transition-all cursor-pointer animate-pulse"
              title="Barcha kutilayotgan kodlarni bir bosishda faollashtirish"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Barchasini Aktiv Qilish ({pendingCount})</span>
            </button>
          )}

          <button
            onClick={() => {
              setAddError(null);
              setAddNotice(null);
              setNewName('');
              setNewCode(generateRandomDLK());
              setSelectedPrizeId('');
              setNewIsActive(true);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Kod Qo‘shish</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Eksport</span>
          </button>

          {/* CLEAR ALL BUTTON */}
          {phones.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-800/80 text-red-300 font-semibold text-xs shadow-md transition-all cursor-pointer"
              title="Barcha ro‘yxatdagi ma’lumotlarni butunlay tozalash"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Tozalash</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#031A10] p-3 rounded-2xl border border-emerald-500/25">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki DLK-kodi bo‘yicha qidirish..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#02130A] border border-emerald-500/30 rounded-xl text-white placeholder-emerald-700/60 focus:outline-none focus:border-amber-400"
          />
          <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-[#02130A] rounded-xl border border-emerald-500/25 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'all'
                ? 'bg-amber-500 text-amber-950 shadow-sm font-bold'
                : 'text-emerald-300/80 hover:text-white'
            }`}
          >
            Barchasi ({phones.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'pending'
                ? 'bg-amber-500 text-amber-950 shadow-sm font-bold'
                : 'text-emerald-300/80 hover:text-white'
            }`}
          >
            ⏳ Kutilmoqda ({phones.filter((p) => !p.hasWon && !p.isActive).length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'active'
                ? 'bg-amber-500 text-amber-950 shadow-sm font-bold'
                : 'text-emerald-300/80 hover:text-white'
            }`}
          >
            ⚡ Aktiv ({phones.filter((p) => !p.hasWon && p.isActive).length})
          </button>
          <button
            onClick={() => setFilter('won')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'won'
                ? 'bg-amber-500 text-amber-950 shadow-sm font-bold'
                : 'text-emerald-300/80 hover:text-white'
            }`}
          >
            🎉 Yutgan ({phones.filter((p) => p.hasWon).length})
          </button>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-[#031A10] border border-emerald-500/25 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#02130A] text-emerald-300/80 uppercase tracking-wider text-[10px] border-b border-emerald-500/25">
              <tr>
                <th className="py-3 px-4 font-semibold">Ism & Familiya</th>
                <th className="py-3 px-4 font-semibold">Telefon Raqami</th>
                <th className="py-3 px-4 font-semibold">Maxsus Kod</th>
                <th className="py-3 px-4 font-semibold">Belgilangan Sovg‘a</th>
                <th className="py-3 px-4 font-semibold">Aktivlik Holati</th>
                <th className="py-3 px-4 font-semibold text-right">Admin Amallari</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : phones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Hozirda ro‘yxat bo‘sh. QR-kod skaner qilinganda ishtirokchilar shu yerda paydo bo‘ladi.
                  </td>
                </tr>
              ) : (
                phones.map((item) => {
                  const displayCode = item.specialCode || `DLK-${item.id.slice(-6).toUpperCase()}`;
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold">{item.name || 'Ishtirokchi'}</span>
                            {item.note && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                {item.note}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="py-3 px-4">
                        {item.phone ? (
                          <div className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{item.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* DLK Special Code with Copy button */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-[#070D1F] border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-inner">
                          <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-mono font-black text-amber-300 text-xs tracking-wider">
                            {displayCode}
                          </span>
                          <button
                            onClick={() => handleCopyCode(item.id, displayCode)}
                            className="text-slate-400 hover:text-amber-300 p-0.5 ml-1 transition-colors cursor-pointer"
                            title="Kodni nusxalash"
                          >
                            {copiedCodeId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Assigned Prize Selection Dropdown */}
                      <td className="py-3 px-4">
                        {!item.hasWon ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={item.assignedPrizeId || ''}
                              onChange={(e) => handleQuickAssignPrize(item.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 hover:border-amber-400 text-xs text-amber-300 font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer max-w-[210px]"
                            >
                              <option value="">🎲 Tasodifiy (Standart)</option>
                              {prizes.map((p) => (
                                <option key={p.id} value={p.id}>
                                  🎯 {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-300 font-bold text-xs bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                            <Gift className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{item.prizeName || item.assignedPrizeName || 'Yutib olingan'}</span>
                          </span>
                        )}
                      </td>

                      {/* Activation Status */}
                      <td className="py-3 px-4">
                        {item.hasWon ? (
                          <span className="inline-flex items-center gap-1 text-emerald-300 font-bold bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-full text-[11px]">
                            <CheckCircle className="w-3 h-3 text-emerald-400" /> Ishlatildi (1 marta)
                          </span>
                        ) : item.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-300 font-bold bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-full text-[11px]">
                            <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" /> Aktiv (Tayyor)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-950/70 border border-amber-500/40 px-2.5 py-1 rounded-full text-[11px]">
                            <Clock className="w-3 h-3 text-amber-400" /> Faol emas (Kutilmoqda)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If not won, Admin can Toggle Activation */}
                          {!item.hasWon && (
                            <button
                              onClick={() => handleToggleActive(item.id, item.isActive)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                                !item.isActive
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 border border-emerald-400/40'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                              }`}
                              title={!item.isActive ? 'Kodni aktivlashtirish' : 'Nofaol qilish'}
                            >
                              {!item.isActive ? (
                                <>
                                  <Zap className="w-3.5 h-3.5 fill-current" />
                                  <span>Aktiv qilish</span>
                                </>
                              ) : (
                                <>
                                  <PowerOff className="w-3.5 h-3.5" />
                                  <span>To‘xtatish</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* If already won, allow Reactivate */}
                          {item.hasWon && (
                            <button
                              onClick={() => handleReactivate(item.id, item.name)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                              title="Yana 1 marta aylantirish imkoniyati berish"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Qayta aktivlash</span>
                            </button>
                          )}

                          {/* Delete button (Permanent) */}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/50 rounded-xl transition-colors cursor-pointer"
                            title="O‘chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* YANGI ISHTIROKCHI VA KOD QO'SHISH MODALI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#041F13] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white font-serif mb-1">
              Yangi Ishtirokchi & Maxsus Kod
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Ism-familiya kiriting, kodni aktiv qiling va unga tushadigan sovg‘ani oldindan belgilang.
            </p>

            {addError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center gap-2 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {addNotice && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-2 text-emerald-200 text-xs font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{addNotice}</span>
              </div>
            )}

            <form onSubmit={handleAddSingle} className="space-y-4">
              {/* ISM & FAMILIYA */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Ism va Familiya <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Masalan: Sardor Aliyev"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* TELEFON RAQAMI */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Telefon Raqami (Oldindan kiritiladigan raqam)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  Ushbu raqam orqali saytga kirganda aynan shu maxsus kod va sovg‘a beriladi.
                </p>
              </div>

              {/* MAXSUS KOD (DLK-XXXXXX) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-200">
                    Maxsus Kod (DLK-XXXXXX)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewCode(generateRandomDLK())}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    Yangi kod generatsiya
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="DLK-849201"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-amber-300 placeholder-slate-500 focus:outline-none font-mono font-bold"
                  />
                  <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* TUSHADIGAN SOVG'ANI OLDINDAN BELGILASH */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ushbu kodga tushadigan sovg‘a:</span>
                  </span>
                </label>
                <select
                  value={selectedPrizeId}
                  onChange={(e) => setSelectedPrizeId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-amber-300 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">🎲 Tasodifiy (Omadiga qarab)</option>
                  {prizes.map((p) => (
                    <option key={p.id} value={p.id}>
                      🎯 {p.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">
                  Tanlangan sovg‘a baraban aylanganda 100% kafolat bilan chiqadi!
                </p>
              </div>

              {/* AKTIVLASH STATUSI */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Dastlabki holati</div>
                  <div className="text-[10px] text-slate-400">
                    {newIsActive ? 'Darsdayoq aylantirishi mumkin' : 'Kutish rejimida (Nofaol)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNewIsActive(!newIsActive)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    newIsActive
                      ? 'bg-emerald-500 text-emerald-950 font-black'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {newIsActive ? 'Aktiv' : 'Nofaol'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  {addLoading ? 'Saqlanmoqda...' : 'Qo‘shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
