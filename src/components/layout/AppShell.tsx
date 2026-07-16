'use client';
// src/components/layout/AppShell.tsx — v2: auth-aware, with critical alert banner

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard, FolderOpen, AlertTriangle, BarChart3,
  Settings, Bell, Search, ChevronDown, Package,
  LogOut, HelpCircle, ChevronRight, X, Users
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { getUser, clearUser, AuthUser } from '@/lib/auth';
import { computeRisks } from '@/lib/data';

const NAV = [
  { href: '/',        icon: LayoutDashboard, label: 'Dashboard',   id: 'dashboard' },
  { href: '/cases',   icon: FolderOpen,      label: 'Cases',        id: 'cases'     },
  { href: '/suppliers', icon: Users,          label: 'Suppliers',    id: 'suppliers' },
  { href: '/risk',    icon: AlertTriangle,   label: 'Risk Monitor', id: 'risk'      },
  { href: '/reports', icon: BarChart3,       label: 'Reports',      id: 'reports'   },
];

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function AppShell({ children, title, subtitle, actions, breadcrumbs }: Props) {
  const pathname = usePathname();
  const { cases, openCases, atRiskCases, criticalCases } = useStore();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<typeof cases>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const u = getUser();
    setUser(u);
  }, []);

  const open = openCases();
  const atRisk = atRiskCases();
  const critical = criticalCases();

  // Global search
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const q = search.toLowerCase();
    setSearchResults(
      cases.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.vendor.toLowerCase().includes(q) ||
        c.requester.toLowerCase().includes(q)
      ).slice(0, 6)
    );
  }, [search, cases]);


  const showCriticalBanner = critical.length > 0 && !alertDismissed;

  return (
    <div className="flex h-screen overflow-hidden bg-content-bg" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── Icon Sidebar ──────────────────────────────── */}
      <nav className="w-14 flex flex-col items-center bg-shell py-3 gap-1 flex-shrink-0 z-50 border-r border-white/10">
        {/* Logo */}
        <div className="mb-4 flex flex-col items-center">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm">
            <Package size={16} className="text-white" />
          </div>
        </div>

        {NAV.map(({ href, icon: Icon, label, id }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={id} href={href} title={label}
              className={clsx(
                'group relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150',
                active ? 'bg-brand text-white shadow-sm' : 'text-enterprise-400 hover:bg-white/10 hover:text-white'
              )}>
              <Icon size={18} />
              {id === 'risk' && atRisk.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-danger text-white text-2xs font-bold rounded-full flex items-center justify-center px-1">
                  {atRisk.length}
                </span>
              )}
              {id === 'cases' && open.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-brand-dark text-white text-2xs font-bold rounded-full flex items-center justify-center px-1 border border-shell">
                  {open.length}
                </span>
              )}
              {/* Tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-enterprise-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md border border-white/10">
                {label}
              </div>
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col items-center gap-1.5">
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-enterprise-400 hover:bg-white/10 hover:text-white transition-all" title="Settings">
            <Settings size={17} />
          </button>
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-enterprise-400 hover:bg-white/10 hover:text-white transition-all" title="Help">
            <HelpCircle size={17} />
          </button>
        </div>
      </nav>

      {/* ── Main Area ──────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Global Utility Bar ─────────────────────── */}
        <header className="h-12 bg-shell flex items-center px-4 gap-3 flex-shrink-0 border-b border-white/10 z-40">
          <div className="flex items-center gap-2 pr-4 border-r border-white/10">
            <span className="text-white font-semibold text-sm">ProcureTrack</span>
            <span className="text-enterprise-400 text-xs hidden md:block">Enterprise</span>
          </div>

          {/* Global Search */}
          <div className="relative flex-1 max-w-xs">
            <div className="flex items-center gap-2 bg-white/10 rounded px-3 py-1.5">
              <Search size={13} className="text-enterprise-400 flex-shrink-0" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                className="bg-transparent text-sm text-white placeholder-enterprise-400 outline-none w-full"
                placeholder="Search cases…"
              />
            </div>
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-enterprise-200 rounded shadow-md z-50 overflow-hidden">
                {searchResults.map(c => {
                  const risks = computeRisks(c);
                  return (
                    <Link key={c.id} href={`/cases/${c.id}`}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-enterprise-50 transition-colors border-b border-enterprise-50 last:border-b-0"
                      onClick={() => { setSearch(''); setShowSearch(false); }}>
                      <span className="font-mono text-xs text-brand w-24 flex-shrink-0">{c.id}</span>
                      <span className="text-xs text-text-primary truncate flex-1">{c.title}</span>
                      {risks.length > 0 && <span className="text-xs text-danger flex-shrink-0">⚠ {risks.length}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Critical alert chip */}
            {critical.length > 0 && (
              <Link href="/risk" className="hidden sm:flex items-center gap-1.5 bg-danger/20 border border-danger/30 text-red-300 rounded px-2.5 py-1 text-xs font-semibold hover:bg-danger/30 transition-all">
                <AlertTriangle size={11} />
                {critical.length} Critical
              </Link>
            )}

            <button className="relative w-8 h-8 flex items-center justify-center text-enterprise-400 hover:text-white rounded hover:bg-white/10 transition-all" title="Notifications">
              <Bell size={16} />
              {atRisk.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full ring-1 ring-shell" />
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 transition-all">
                <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
                  {user?.initials || 'U'}
                </div>
                <span className="text-enterprise-300 text-xs hidden md:block">{user?.name || 'User'}</span>
                <ChevronDown size={11} className="text-enterprise-400" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-enterprise-200 rounded shadow-md z-50">
                  <div className="px-3 py-2.5 border-b border-enterprise-100">
                    <div className="text-sm font-semibold text-text-primary">{user?.name}</div>
                    <div className="text-xs text-text-secondary">{user?.role}</div>
                    <div className="text-xs text-brand mt-0.5">{user?.email}</div>
                  </div>
                  <Link href="/login" onClick={clearUser}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-bg transition-colors">
                    <LogOut size={13} /> Sign Out
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Critical Alert Banner ──────────────────── */}
        {showCriticalBanner && (
          <div className="bg-danger-bg border-b border-danger/20 px-6 py-2 flex items-center gap-3 flex-shrink-0">
            <AlertTriangle size={14} className="text-danger flex-shrink-0" />
            <span className="text-xs font-semibold text-danger">
              {critical.length} critical case{critical.length > 1 ? 's' : ''} require immediate attention:&nbsp;
            </span>
            <span className="text-xs text-danger/80 truncate">
              {critical.slice(0, 3).map(c => c.id).join(', ')}
              {critical.length > 3 && ` +${critical.length - 3} more`}
            </span>
            <Link href="/risk" className="ml-auto text-xs font-semibold text-danger underline whitespace-nowrap flex-shrink-0">
              View Risks →
            </Link>
            <button onClick={() => setAlertDismissed(true)} className="ml-2 text-danger/60 hover:text-danger flex-shrink-0">
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Page Header ───────────────────────────── */}
        <div className="bg-white border-b border-enterprise-200 px-6 py-3 flex-shrink-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-xs text-text-secondary mb-1">
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight size={11} className="text-enterprise-300" />}
                  {b.href
                    ? <Link href={b.href} className="hover:text-brand hover:underline transition-colors">{b.label}</Link>
                    : <span className="text-text-primary font-medium">{b.label}</span>}
                </span>
              ))}
            </nav>
          )}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-text-primary leading-tight">{title}</h1>
              {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </div>
        </div>

        {/* ── Scrollable Content ────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
