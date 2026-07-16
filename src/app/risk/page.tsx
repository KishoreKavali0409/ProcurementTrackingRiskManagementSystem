'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { StatusBadge, PriorityBadge, RiskBadge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';
import { computeRisks, getNextActions, caseAge, formatCurrency } from '@/lib/data';
import { AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

export default function RiskMonitorPage() {
  const { cases, init } = useStore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { init(); }, []);

  const open = cases.filter(c => c.status !== 'GRN / Closed');
  const casesWithRisks = open
    .map(c => ({ c, risks: computeRisks(c) }))
    .filter(({ risks }) => risks.length > 0)
    .sort((a, b) => {
      const aC = a.risks.some(r => r.severity === 'critical') ? 1 : 0;
      const bC = b.risks.some(r => r.severity === 'critical') ? 1 : 0;
      return bC - aC || b.risks.length - a.risks.length;
    });

  const critCount = casesWithRisks.filter(({ risks }) => risks.some(r => r.severity === 'critical')).length;
  const warnCount = casesWithRisks.length - critCount;
  const healthyCount = open.length - casesWithRisks.length;

  const RISK_TYPES = [
    { type: 'Overdue', desc: 'Expected closure date has passed', sev: 'critical' },
    { type: 'Stale', desc: 'No updates in 10+ days', sev: 'critical' },
    { type: 'Budget Overrun', desc: 'Estimated cost exceeds budget by >10%', sev: 'critical' },
    { type: 'Long-Running Critical', desc: 'Critical priority case open 30+ days', sev: 'critical' },
    { type: 'Due Soon', desc: 'Closes within 3 days', sev: 'warning' },
    { type: 'Budget Escalation', desc: 'Estimated cost exceeds budget', sev: 'warning' },
    { type: 'Missing Docs', desc: 'Required documents not received', sev: 'warning' },
  ];

  return (
    <AppShell
      title="Risk Monitor"
      subtitle={`${casesWithRisks.length} case${casesWithRisks.length !== 1 ? 's' : ''} require attention`}
      breadcrumbs={[{ label: 'Risk Monitor' }]}
    >
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <KpiCard label="Critical Risks" value={critCount} icon={AlertTriangle} variant="danger"
          sub="Require immediate action" />
        <KpiCard label="Warnings" value={warnCount} icon={Clock} variant="warning"
          sub="Monitor closely" />
        <KpiCard label="Healthy Cases" value={healthyCount} icon={CheckCircle} variant="success"
          sub="No issues detected" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Risk cases list */}
        <div className="col-span-12 lg:col-span-8">
          {casesWithRisks.length === 0 ? (
            <Panel className="text-center py-16">
              <CheckCircle size={48} className="mx-auto mb-3 text-success opacity-60" />
              <div className="text-lg font-semibold text-success mb-1">All Cases Healthy</div>
              <p className="text-sm text-text-muted">No at-risk cases detected. All active cases are progressing on schedule.</p>
            </Panel>
          ) : (
            <div className="space-y-3">
              {casesWithRisks.map(({ c, risks }) => {
                const hasCrit = risks.some(r => r.severity === 'critical');
                const actions = getNextActions(c, risks);
                const age = caseAge(c);
                const daysSinceUpd = Math.floor((Date.now() - new Date(c.lastUpdated).getTime()) / 86400000);

                return (
                  <Panel key={c.id} className={clsx('border-l-4', hasCrit ? 'border-l-danger' : 'border-l-warning')} noPad>
                    {/* Case header */}
                    <div className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-xs text-brand font-medium">{c.id}</span>
                            <StatusBadge status={c.status} />
                            <PriorityBadge priority={c.priority} />
                            <span className="text-xs text-text-muted">{c.department}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-text-primary mb-1">{c.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-text-muted">
                            <span>Owner: {c.assignedTo}</span>
                            <span>Opened: {age}d ago</span>
                            <span>Updated: {daysSinceUpd}d ago</span>
                            <span className="font-medium text-text-secondary">{formatCurrency(c.estimatedValue)}</span>
                          </div>
                        </div>
                        <Link href={`/cases/${c.id}`}>
                          <Button size="xs" icon={ExternalLink} variant="ghost">Open</Button>
                        </Link>
                      </div>
                    </div>

                    {/* Risk chips */}
                    <div className="px-4 py-2 border-t border-enterprise-100 flex flex-wrap gap-1.5">
                      {risks.map((r, i) => (
                        <RiskBadge key={i} severity={r.severity} label={`${r.type}: ${r.msg}`} />
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 border-t border-enterprise-100 bg-enterprise-50 rounded-b">
                      <div className="text-xs font-semibold text-enterprise-400 uppercase tracking-wide mb-2">
                        Recommended Actions
                      </div>
                      <ol className="space-y-1">
                        {actions.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                            <span className="w-4 h-4 rounded-full bg-brand text-white text-2xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                            {a}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Risk legend + summary */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Panel>
            <PanelHeader title="Risk Type Legend" icon={<AlertTriangle size={14} />} />
            <div className="space-y-2">
              {RISK_TYPES.map(r => (
                <div key={r.type} className="flex items-start gap-2">
                  <RiskBadge severity={r.sev as 'critical' | 'warning'} label={r.type} />
                  <span className="text-xs text-text-muted">{r.desc}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Risk by Type" />
            {(() => {
              const typeCounts: Record<string, number> = {};
              casesWithRisks.forEach(({ risks }) => risks.forEach(r => {
                typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
              }));
              const entries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
              const max = Math.max(...entries.map(e => e[1]), 1);
              return entries.length === 0 ? (
                <div className="text-xs text-text-muted text-center py-4">No risks</div>
              ) : (
                <div className="space-y-2">
                  {entries.map(([type, count]) => (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">{type}</span>
                        <span className="font-semibold text-text-primary">{count}</span>
                      </div>
                      <div className="h-1.5 bg-enterprise-100 rounded-full overflow-hidden">
                        <div className="h-full bg-danger rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
