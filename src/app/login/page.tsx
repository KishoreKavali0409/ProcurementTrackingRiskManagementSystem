'use client';
// src/app/login/page.tsx — Enterprise login page (Salesforce-style)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Eye, EyeOff, AlertCircle } from 'lucide-react';

const DEMO_USERS = [
  { email: 'priya.sharma@procuretrack.in', password: 'demo1234', name: 'Priya Sharma', role: 'Procurement Lead', initials: 'PS' },
  { email: 'anand.kumar@procuretrack.in',  password: 'demo1234', name: 'Anand Kumar',  role: 'Procurement Officer', initials: 'AK' },
  { email: 'vikram.rao@procuretrack.in',   password: 'demo1234', name: 'Vikram Rao',   role: 'Requester',           initials: 'VR' },
  { email: 'manager@procuretrack.in',      password: 'demo1234', name: 'Kavitha Nair', role: 'Procurement Manager', initials: 'KN' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('priya.sharma@procuretrack.in');
  const [password, setPassword] = useState('demo1234');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 600)); // Simulate auth delay

    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pt_user', JSON.stringify(user));
      }
      router.push('/');
    } else {
      setError('Invalid email or password. Try one of the demo accounts below.');
      setLoading(false);
    }
  }

  function quickLogin(user: typeof DEMO_USERS[0]) {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Left: Brand panel */}
      <div className="hidden lg:flex flex-col w-[420px] flex-shrink-0"
        style={{ background: '#1a2638' }}>
        <div className="flex items-center gap-3 px-10 py-8 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#0070d2' }}>
            <Package size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-base">ProcureTrack</div>
            <div className="text-xs" style={{ color: '#9faab7' }}>Enterprise Edition</div>
          </div>
        </div>

        <div className="flex-1 px-10 py-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-white mb-3 leading-tight">
            Procurement Intelligence,<br />Centralized.
          </h2>
          <p className="text-sm mb-10" style={{ color: '#9faab7', lineHeight: '1.7' }}>
            Real-time case tracking, automated risk detection, and stakeholder-ready reports — all in one enterprise-grade platform.
          </p>

          <div className="space-y-4">
            {[
              { icon: '📊', title: 'Live Dashboard', desc: 'KPIs, ageing analysis, and workload visibility' },
              { icon: '⚠', title: 'Risk Detection', desc: 'Automatic flagging of overdue and stale cases' },
              { icon: '📄', title: 'Auto Reports', desc: 'One-click stakeholder-ready weekly summaries' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{f.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{f.title}</div>
                  <div className="text-xs" style={{ color: '#9faab7' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-10 py-6 border-t border-white/10">
          <div className="text-xs" style={{ color: '#54698d' }}>
            © 2025 ProcureTrack Enterprise · Built for Imobiliothon 6.0
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12" style={{ background: '#f3f6f9' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#0070d2' }}>
              <Package size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: '#16213a' }}>ProcureTrack</span>
          </div>

          <h1 className="text-xl font-bold mb-1" style={{ color: '#16213a' }}>Sign in to your account</h1>
          <p className="text-sm mb-6" style={{ color: '#54698d' }}>Use a demo account to explore the platform</p>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded border text-sm mb-4"
              style={{ background: '#fef0f0', border: '1px solid rgba(186,5,23,0.2)', color: '#ba0517' }}>
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#54698d' }}>
                Email Address
              </label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded border bg-white focus:outline-none transition-all"
                style={{ border: '1px solid #c9d3e0', color: '#16213a' }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(0,112,210,0.15)'}
                onBlur={e => e.target.style.boxShadow = 'none'}
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#54698d' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-9 px-3 pr-9 text-sm rounded border bg-white focus:outline-none transition-all"
                  style={{ border: '1px solid #c9d3e0', color: '#16213a' }}
                  onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(0,112,210,0.15)'}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full h-9 rounded font-semibold text-sm text-white transition-all disabled:opacity-70"
              style={{ background: loading ? '#005fb2' : '#0070d2' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9faab7' }}>
              Demo Accounts — click to fill
            </div>
            <div className="space-y-2">
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  onClick={() => quickLogin(u)}
                  className="w-full flex items-center gap-3 p-2.5 rounded border text-left transition-all hover:border-blue-300"
                  style={{
                    background: email === u.email ? '#e8f4ff' : 'white',
                    border: email === u.email ? '1px solid rgba(0,112,210,0.4)' : '1px solid #e0e5ee',
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: '#0070d2' }}>
                    {u.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold" style={{ color: '#16213a' }}>{u.name}</div>
                    <div className="text-xs" style={{ color: '#54698d' }}>{u.role}</div>
                  </div>
                  {email === u.email && (
                    <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded" style={{ background: '#0070d2', color: 'white' }}>
                      Selected
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: '#9faab7' }}>
              Password for all demo accounts: <code className="font-mono bg-gray-100 px-1 rounded">demo1234</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
