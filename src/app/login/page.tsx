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
      </div>
    </div>
  );
}
