import React, { useMemo, useState } from 'react';
import { History, Search } from 'lucide-react';
import { useAveriq } from '../context/AveriqContext';
import { LogCategory } from '../types/averiq';

const CATEGORIES: Array<'All' | LogCategory> = [
  'All',
  'Emergency Registration',
  'Agent Assessment',
  'Ambulance Recommendation',
  'GPS Anomaly Alert',
  'Hospital Recommendation',
  'Dispatcher Approval',
  'Reassignment',
];

export const DispatchHistoryPage: React.FC = () => {
  const { logs } = useAveriq();
  const [selectedCategory, setSelectedCategory] = useState<'All' | LogCategory>('All');
  const [query, setQuery] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const catOk = selectedCategory === 'All' || log.category === selectedCategory;
      const q = query.trim().toLowerCase();
      const qOk =
        !q ||
        log.title.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.emergencyId?.toLowerCase().includes(q) ?? false);
      return catOk && qOk;
    });
  }, [logs, query, selectedCategory]);

  const badgeTone: Record<string, string> = {
    critical: 'border-red-500/35 bg-red-500/15 text-red-300',
    warning: 'border-amber-500/35 bg-amber-500/15 text-amber-300',
    success: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
    info: 'border-cyan-500/35 bg-cyan-500/15 text-cyan-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-[#0B111E] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <History className="h-5 w-5 text-cyan-400" />
          <div>
            <h2 className="font-display text-base font-semibold text-slate-100 sm:text-lg">
              Dispatch History &amp; Chronological Activity Logs
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Immutable decision audit trail spanning registrations, AI evaluations, GPS alerts, approvals, and reassignments.
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ID, ambulance, log..."
            className="w-full rounded-lg border border-slate-700/80 bg-[#060911] py-2 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              selectedCategory === cat
                ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                : 'border-slate-800 bg-[#0B111E] text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Chronological Activity Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#0B111E]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#070B14] text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Emergency ID</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Event &amp; Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#10192B]/60">
                  <td className="whitespace-nowrap px-4 py-3 font-mono-tech text-slate-400">
                    {log.timestamp}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[11px] font-medium ${
                        badgeTone[log.severity]
                      }`}
                    >
                      {log.category}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono-tech text-cyan-300">
                    {log.emergencyId ?? 'FLEET-SYS'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">{log.actor}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-100">{log.title}</div>
                    <div className="mt-0.5 leading-relaxed text-slate-400">{log.details}</div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No activity log entries match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
