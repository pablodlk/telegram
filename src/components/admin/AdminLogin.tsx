import React, { useState } from 'react';
import { Lock, User, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('pablo');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password.trim()) {
      setError('Iltimos, parolni kiriting.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Parol noto‘g‘ri.');
      }
      onLoginSuccess(data.token);
    } catch (err: any) {
      setError(err.message || 'Kirishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#03140C] text-slate-100 flex items-center justify-center p-3">
      <div className="w-full max-w-sm sm:max-w-md bg-[#041F13]/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="mx-auto w-16 h-16 rounded-full mb-3 shadow-lg flex items-center justify-center relative">
          <img
            src="/assets/aistudio/image_dee809e3.png"
            alt="Summaya Logo"
            className="w-full h-full rounded-full object-cover border-2 border-amber-400/80 shadow-md"
          />
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-white text-center font-serif mb-0.5">
          Summaya Admin Tizimi
        </h2>
        <p className="text-[11px] text-emerald-300/80 text-center mb-5">
          Boshqaruv paneliga kirish uchun hisob ma’lumotlarini kiriting
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Login (Foydalanuvchi)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="pablo"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Maxfiy Parol
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolingizni kiriting"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Tekshirilmoqda...</span>
            ) : (
              <>
                <span>Tizimga Kirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
