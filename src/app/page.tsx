'use client';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { KpiCard } from '@/components/ui/KpiCard';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { StatusBadge, RiskBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';
import { computeRisks, caseAge, formatCurrency, STATUSES, CATEGORIES } from '@/lib/data';
import {
  FolderOpen, AlertTriangle, Clock, CheckCircle,
  RefreshCw, Plus, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  'RFQ Draft': '#9faab7',
  'Bidders Defined': '#0070d2',
  'RFQ Shared': '#0070d2',
  'Offers Received': '#f97316',
  'Technical Evaluation': '#3b82f6',
  'Commercial Negotiation': '#7526e3',
  'Approval Pending': '#a86403',
  'PO Released': '#2e844a',
  'Legal / NDA': '#a86403',
  'GRN / Closed': '#1b5e85',
};

export default function DashboardPage() {
  const { cases, init } = useStore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { init(); }, []);

  const open = useMemo(() => cases.filter(c => c.status !== 'GRN / Closed'), [cases]);
  const atRisk = useMemo(() => open.filter(c => computeRisks(c).length > 0), [open]);
  const critical = useMemo(() => open.filter(c => computeRisks(c).some(r => r.severity === 'critical')), [open]);
  const closed = useMemo(() => cases.filter(c => c.status === 'GRN / Closed'), [cases]);
  const ages = useMemo(() => open.map(caseAge), [open]);
  const avgAge = useMemo(() => ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0, [ages]);
  const totalValue = useMemo(() => open.reduce((s, c) => s + (c.estimatedValue || 0), 0), [open]);

  // Ageing buckets
  const ageBuckets = [
    { label: '0–7d',  count: open.filter(c => caseAge(c) <= 7).length,                                    color: '#2e844a' },
    { label: '8–14d', count: open.filter(c => caseAge(c) > 7  && caseAge(c) <= 14).length,               color: '#a86403' },
    { label: '15–30d',count: open.filter(c => caseAge(c) > 14 && caseAge(c) <= 30).length,               color: '#f97316' },
    { label: '30+d',  count: open.filter(c => caseAge(c) > 30).length,                                   color: '#ba0517' },
  ];

  // Status donut
  const statusData = STATUSES.map(s => ({ name: s, value: cases.filter(c => c.status === s).length }))
    .filter(d => d.value > 0);

  // Category bar
  const catData = CATEGORIES
    .map(cat => ({ name: cat.split(' ')[0], cases: cases.filter(c => c.category === cat).length }))
    .filter(d => d.cases > 0)
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 6);

  // Workload
  const workload: Record<string, number> = {};
  open.forEach(c => { if (c.assignedTo) workload[c.assignedTo] = (workload[c.assignedTo] || 0) + 1; });
  const maxLoad = Math.max(...Object.values(workload), 1);

  // Upcoming closures (next 14 days)
  const upcoming = open
    .filter(c => c.expectedClosure)
    .map(c => ({ c, days: Math.ceil((new Date(c.expectedClosure).getTime() - Date.now()) / 86400000) }))
    .filter(({ days }) => days >= 0 && days <= 14)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  return (
    <AppShell
      title="Dashboard"
      subtitle={`As of ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`}
      actions={
        <>
          <Button icon={RefreshCw} size="sm" onClick={() => init()}>Refresh</Button>
          <Link href="/cases">
            <Button icon={Plus} variant="primary" size="sm">New Case</Button>
          </Link>
        </>
      }
    >
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <KpiCard label="Open Cases" value={open.length} icon={FolderOpen} variant="brand"
          sub={`${open.filter(c => c.status === 'RFQ Draft').length} pending start`} />
        <KpiCard label="Avg Age (Days)" value={avgAge} icon={Clock} variant="warning"
          sub={`${ageBuckets[3].count} over 30 days`} />
        <KpiCard label="At-Risk Cases" value={atRisk.length} icon={AlertTriangle} variant="danger"
          sub={`${critical.length} critical`} trend={atRisk.length > 2 ? 'down' : 'neutral'} />
        <KpiCard label="Closed Cases" value={closed.length} icon={CheckCircle} variant="success"
          sub={`Pipeline: ${formatCurrency(totalValue)}`} />
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Status Donut */}
        <Panel className="col-span-12 md:col-span-5">
          <PanelHeader title="Case Status Distribution" />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                dataKey="value" nameKey="name" paddingAngle={2}>
                {statusData.map(e => <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#9faab7'} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12, border: '1px solid #e0e5ee', borderRadius: 4 }} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        {/* Category Bar */}
        <Panel className="col-span-12 md:col-span-7">
          <PanelHeader title="Cases by Category" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#54698d' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#54698d' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e0e5ee', borderRadius: 4 }} cursor={{ fill: '#e8f4ff' }} />
              <Bar dataKey="cases" fill="#0070d2" radius={[3, 3, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Ageing Analysis */}
        <Panel className="col-span-12 md:col-span-4">
          <PanelHeader title="Ageing Analysis" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            {ageBuckets.map(b => (
              <div key={b.label} className="text-center p-3 rounded border border-enterprise-100 bg-enterprise-50">
                <div className="text-2xl font-bold" style={{ color: b.color }}>{b.count}</div>
                <div className="text-xs text-text-muted mt-0.5">{b.label}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-enterprise-100 pt-3">
            <div className="text-xs font-semibold text-enterprise-400 uppercase tracking-wide mb-2">Team Workload</div>
            {Object.entries(workload).sort((a,b) => b[1]-a[1]).map(([name, count]) => (
              <div key={name} className="flex items-center gap-2 mb-2">
                <span className="text-xs text-text-secondary w-20 truncate">{name.split(' ')[0]}</span>
                <div className="flex-1 bg-enterprise-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(count / maxLoad) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-text-primary w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* At-Risk Snapshot */}
        <Panel className="col-span-12 md:col-span-4">
          <PanelHeader
            title="Risk Snapshot"
            actions={<Link href="/risk"><Button size="xs" icon={ArrowRight} variant="ghost">View All</Button></Link>}
          />
          {atRisk.length === 0 ? (
            <div className="text-center py-8 text-success">
              <CheckCircle size={32} className="mx-auto mb-2 opacity-60" />
              <div className="text-sm font-medium">All cases on track</div>
            </div>
          ) : (
            <div className="space-y-2">
              {atRisk.slice(0, 5).map(c => {
                const risks = computeRisks(c);
                const top = risks.find(r => r.severity === 'critical') || risks[0];
                return (
                  <Link key={c.id} href={`/cases/${c.id}`}
                    className="flex items-start gap-2 p-2.5 rounded border border-enterprise-100 hover:border-brand/30 hover:bg-brand-light/30 transition-all group">
                    <RiskBadge severity={top.severity} label={top.type} />
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-brand">{c.id}</div>
                      <div className="text-xs font-medium text-text-primary truncate">{c.title}</div>
                      <div className="text-2xs text-text-muted">{top.msg}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Upcoming Closures */}
        <Panel className="col-span-12 md:col-span-4">
          <PanelHeader title="Closing in Next 14 Days" />
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <Clock size={28} className="mx-auto mb-2 opacity-40" />
              <div className="text-sm">No upcoming closures</div>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map(({ c, days }) => (
                <Link key={c.id} href={`/cases/${c.id}`}
                  className="flex items-center gap-3 p-2.5 rounded border border-enterprise-100 hover:border-brand/30 hover:bg-brand-light/30 transition-all">
                  <div className={`text-center w-10 flex-shrink-0 rounded px-1 py-1 ${
                    days <= 2 ? 'bg-danger-bg text-danger' : days <= 5 ? 'bg-warning-bg text-warning' : 'bg-info-bg text-info'
                  }`}>
                    <div className="text-lg font-bold leading-none">{days}</div>
                    <div className="text-2xs">days</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono text-brand">{c.id}</div>
                    <div className="text-xs font-medium text-text-primary truncate">{c.title}</div>
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
