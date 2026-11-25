import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Ambulance,
  Building2,
  Cpu,
  History,
  LayoutDashboard,
  Menu,
  RotateCcw,
  ShieldCheck,
  Siren,
  X,
} from 'lucide-react';
import { useAveriq } from '../context/AveriqContext';
import { NavSection } from '../types/averiq';

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'emergency-management', label: 'Emergency Management', icon: Siren },
  { id: 'ambulance-fleet', label: 'Ambulance Fleet', icon: Ambulance },
  { id: 'hospital-network', label: 'Hospital Network', icon: Building2 },
  { id: 'agent-monitoring', label: 'AI Agent Monitoring', icon: Cpu },
  { id: 'dispatch-history', label: 'Dispatch History', icon: History },
  { id: 'system-alerts', label: 'System Alerts', icon: AlertTriangle },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeSection,
    setActiveSection,
    cases,
    alerts,
    ambulances,
    demoBannerMessage,
    clearBanner,
    resetDemoState,
  } = useAveriq();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clock, setClock] = useState(() => new Date().toTimeString().slice(0, 8));

  useEffect(() => {
    const t = setInterval(() => {
      setClock(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const pendingOrActiveCount = cases.filter(
    (c) =>
      c.lifecycleStatus === 'Awaiting Approval' ||
      c.lifecycleStatus === 'Reassignment Pending'
  ).length;
  const unresolvedAlertsCount = alerts.filter((a) => !a.acknowledged).length;
  const verifiedAvailableCount = ambulances.filter(
    (a) => a.status === 'Available' && a.gpsScore >= 70
  ).length;

  const currentNav = NAV_ITEMS.find((n) => n.id === activeSection);

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/10">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path
                  d="M12 2L4 5.5V11.5C4 16.8 7.4 21.4 12 22.8C16.6 21.4 20 16.8 20 11.5V5.5L12 2Z"
                  stroke="#22D3EE"
                  strokeWidth="1.75"
                />
                <path
                  d="M7.5 12H10L11.4 9.2L13 15L14.4 12H16.5"
                  stroke="#34D399"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="font-display text-base font-bold tracking-wider text-slate-100">
                AVERIQ
              </div>
              <div className="text-[11px] font-medium text-cyan-400/90">
                Command IQ · 108 EMS
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 px-3 py-4" aria-label="Main Control Navigation">
          <div className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Dispatch Modules
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            let badge: string | number | null = null;
            let badgeTone = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';

            if (item.id === 'emergency-management' && pendingOrActiveCount > 0) {
              badge = `${pendingOrActiveCount} Open`;
              badgeTone = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
            } else if (item.id === 'system-alerts' && unresolvedAlertsCount > 0) {
              badge = unresolvedAlertsCount;
              badgeTone = 'bg-red-500/15 text-red-300 border-red-500/35';
            } else if (item.id === 'ambulance-fleet') {
              badge = `${verifiedAvailableCount} Ready`;
              badgeTone = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`group flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                  active
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                    : 'border-transparent text-slate-400 hover:border-slate-800 hover:bg-[#10192B] hover:text-slate-100'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {badge !== null && (
                  <span
                    className={`shrink-0 whitespace-nowrap rounded border px-1.5 py-0.5 font-mono-tech text-[10px] font-semibold ${badgeTone}`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom System Info & Demo Reset */}
      <div className="space-y-3 border-t border-slate-800/80 p-4">
        <div className="rounded-lg border border-slate-800 bg-[#070B14] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              3 AI Agents Online
            </span>
            <span className="font-mono-tech text-[11px] text-slate-400">Rules v2.4</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
            Advanced Verification &amp; Emergency Response IQ · Human-supervised dispatch prototype.
          </p>
        </div>

        <button
          type="button"
          onClick={resetDemoState}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700/80 bg-[#10192B] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Demo Scenario
        </button>

        <div className="text-center text-[11px] text-slate-500">
          K! Hacks 4.0 · Team FOREX
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#060911] text-[#F1F5F9]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[272px] shrink-0 border-r border-slate-800/80 bg-[#0B111E] lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">{renderSidebarContent()}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 h-full w-68 border-r border-slate-800 bg-[#0B111E]">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Command Bar */}
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0B111E]/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-slate-700/80 bg-slate-900 p-2 text-slate-300 hover:text-white lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base font-bold tracking-tight text-slate-100 sm:text-lg">
                  {currentNav?.label ?? 'Overview'}
                </h1>
                <span className="hidden text-xs text-slate-500 sm:inline">
                  / Control Room Console #01
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Required Simulation Mode Label */}
            <div className="inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              SIMULATION MODE – DEMONSTRATION DATA
            </div>

            <div className="hidden items-center gap-1.5 rounded-md border border-slate-800 bg-[#060911] px-2.5 py-1 font-mono-tech text-xs text-slate-300 sm:inline-flex">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>IST {clock}</span>
            </div>
          </div>
        </header>

        {/* Optional Action Feedback Toast/Banner */}
        {demoBannerMessage && (
          <div className="animate-enter flex items-center justify-between gap-3 border-b border-cyan-500/30 bg-cyan-950/30 px-4 py-2 text-xs text-cyan-100 sm:px-6">
            <span className="font-medium">{demoBannerMessage}</span>
            <button
              type="button"
              onClick={clearBanner}
              className="shrink-0 rounded px-2 py-0.5 text-cyan-300 hover:bg-cyan-500/20"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Page Canvas */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};
