'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'FIELD' | 'WAREHOUSE' | 'INVENTORY' | 'FINANCE' | 'ADMIN'>('ADMIN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        selectedRole,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || 'Invalid credentials or role mismatch.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleSelect = (
    role: 'FIELD' | 'WAREHOUSE' | 'INVENTORY' | 'FINANCE' | 'ADMIN',
    quickUsername: string,
    quickPass: string
  ) => {
    setSelectedRole(role);
    setEmail(quickUsername);
    setPassword(quickPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#141c2f] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-[#10b981] to-[#34d399] rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-8 h-8 text-[#0b0f19]" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            IBIS RICE <span className="text-[#34d399]">CONSERVATION</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Integrated Field, Warehouse, Inventory & Finance Operations
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              USERNAME / ACCOUNT EMAIL
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Username or email"
                className="w-full bg-[#1e293b]/60 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white focus:outline-none focus:border-[#10b981] placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1e293b]/60 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white focus:outline-none focus:border-[#10b981] placeholder-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 text-sm mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Operations Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider & Quick Select Role Account Section */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="text-center">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              QUICK SELECT ROLE ACCOUNT
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {/* Field Team Card */}
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('FIELD', 'piseth', 'PVH-piseth-2026')}
              className={`p-3.5 rounded-xl border font-bold text-left transition-all ${
                selectedRole === 'FIELD'
                  ? 'bg-emerald-500/20 border-emerald-500/80 text-emerald-400 shadow-md shadow-emerald-500/10'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-400">🌾 Field Team</span>
                {selectedRole === 'FIELD' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                )}
              </div>
            </button>

            {/* Warehouse Receiver Card */}
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('WAREHOUSE', 'phearun', 'KPT-phearun-2026')}
              className={`p-3.5 rounded-xl border font-bold text-left transition-all ${
                selectedRole === 'WAREHOUSE'
                  ? 'bg-sky-500/20 border-sky-500/80 text-sky-400 shadow-md shadow-sky-500/10'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sky-400">🏬 Warehouse Receiver</span>
                {selectedRole === 'WAREHOUSE' && (
                  <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                )}
              </div>
            </button>

            {/* Inventory Team Card */}
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('INVENTORY', 'bousong', 'PNH-bousong-2026')}
              className={`p-3.5 rounded-xl border font-bold text-left transition-all ${
                selectedRole === 'INVENTORY'
                  ? 'bg-purple-500/20 border-purple-500/80 text-purple-300 shadow-md shadow-purple-500/10'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-purple-300">📦 Inventory Team</span>
                {selectedRole === 'INVENTORY' && (
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                )}
              </div>
            </button>

            {/* Finance Team Card */}
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('FINANCE', 'heap', 'ST-heap-2026')}
              className={`p-3.5 rounded-xl border font-bold text-left transition-all ${
                selectedRole === 'FINANCE'
                  ? 'bg-amber-500/20 border-amber-500/80 text-amber-400 shadow-md shadow-amber-500/10'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-400">💳 Finance Team</span>
                {selectedRole === 'FINANCE' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
              </div>
            </button>

            {/* System Admin Card */}
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('ADMIN', 'chansetha', 'ST-chansetha-2026')}
              className={`p-3.5 rounded-xl border font-bold text-left transition-all col-span-2 ${
                selectedRole === 'ADMIN'
                  ? 'bg-rose-500/20 border-rose-500/80 text-rose-400 shadow-md shadow-rose-500/10'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-rose-400">⚙️ System Admin</span>
                {selectedRole === 'ADMIN' && (
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
