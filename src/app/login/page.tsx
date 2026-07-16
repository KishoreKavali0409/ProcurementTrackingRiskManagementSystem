'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Read super user credentials from env
  const superUserUsername = process.env.NEXT_PUBLIC_SUPER_USER_USERNAME || 'kishore';
  const superUserPassword = process.env.NEXT_PUBLIC_SUPER_USER_PASSWORD || 'kishore@123';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Short UX simulation delay
    await new Promise(r => setTimeout(r, 450));

    if (username.trim() === superUserUsername && password === superUserPassword) {
      if (typeof window !== 'undefined') {
        const superUser = {
          email: 'kishore@procuretrack.in',
          name: 'Kishore',
          role: 'Procurement Manager', // Default active role on login
          initials: 'K',
          isSuperUser: true,
          actualRole: 'super_user',
        };
        localStorage.setItem('pt_user', JSON.stringify(superUser));
      }
      router.push('/');
    } else {
      setError('Invalid username or password. Please check your credentials.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 shadow-sm p-8">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-md bg-slate-900 flex items-center justify-center mb-3">
            <Shield size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">ProcureTrack Enterprise</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in with your administrator account</p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded border text-xs mb-5 bg-red-50 border-red-200 text-red-700">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400"
              placeholder="e.g. kishore"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-9 px-3 pr-9 text-sm rounded border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all disabled:opacity-70 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400">
            System configuration active. Roles can be toggled dynamically post-authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
