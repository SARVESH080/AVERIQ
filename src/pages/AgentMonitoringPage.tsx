import React from 'react';
import { ArrowRight, Cpu, MessageSquare, ShieldCheck, Timer } from 'lucide-react';
import { useAveriq } from '../context/AveriqContext';

export const AgentMonitoringPage: React.FC = () => {
  const { agentMetrics, agentComms, pipeline, cases } = useAveriq();

  const latestCase = cases[0];

  const recentTimeline =
    pipeline.timeline.length > 0
      ? pipeline.timeline
      : [
          {
            agent: 'Agent 01 — Emergency Assessment',
            detail: latestCase?.assessment.summary ?? 'Evaluated clinical severity & priority tier',
            time: latestCase?.registeredAt ?? '20:24:11',
            status: 'done' as const,
          },
          {
            agent: 'Agent 02 — Smart Ambulance Allocation',
            detail: latestCase?.allocation.explanation ?? 'Verified GPS trust scores & computed optimal ETA',
            time: latestCase?.registeredAt ?? '20:24:12',
            status: 'done' as const,
          },
          {
            agent: 'Agent 03 — Hospital Coordination',
            detail: latestCase?.hospitalMatch.explanation ?? 'Matched ICU & trauma capacity',
            time: latestCase?.registeredAt ?? '20:24:14',
            status: 'done' as const,
          },
        ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-[#0B111E] px-5 py-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-100 sm:text-lg">
            AI Agent Monitoring &amp; Inter-Agent Coordination Bus
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Simulated rule-based orchestration telemetry across AVERIQ&apos;s three specialized decision agents (zero external LLM/API calls).
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Deterministic Simulation Engine Active
        </span>
      </div>

      {/* Three Agent Cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {agentMetrics.map((agent) => {
          const isBusy =
            agent.status === 'Processing' || agent.status === 'Reassigning';
          const statusStyle =
            agent.status === 'Processing'
              ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
              : agent.status === 'Reassigning'
              ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
              : agent.status === 'Active Verification'
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
              : 'border-slate-700 bg-slate-800/70 text-slate-300';

          return (
            <div
              key={agent.id}
              className={`rounded-xl border bg-[#0B111E] p-5 transition ${
                isBusy ? 'border-cyan-400/60' : 'border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-cyan-500/15 px-2 py-0.5 font-mono-tech text-[11px] font-bold text-cyan-300">
                  {agent.code}
                </span>
                <span
                  className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${statusStyle}`}
                >
                  {agent.status}
                </span>
              </div>

              <h3 className="mt-3 flex items-center gap-2 text-base font-semibold text-slate-100">
                <Cpu className="h-4 w-4 text-cyan-400" />
                {agent.name}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">{agent.role}</p>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-slate-800 bg-[#060911] p-3">
                <div>
                  <div className="text-[11px] text-slate-500">Tasks Processed</div>
                  <div className="mt-0.5 font-mono-tech text-lg font-bold text-slate-100">
                    {agent.tasksProcessed}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">{agent.keyMetricLabel}</div>
                  <div className="mt-0.5 font-mono-tech text-sm font-semibold text-emerald-300">
                    {agent.keyMetricValue}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold uppercase tracking-wider">Latest Decision</span>
                  <span className="font-mono-tech">{agent.latestTimestamp}</span>
                </div>
                <p className="mt-1.5 rounded-lg border border-slate-800/80 bg-[#10192B]/70 p-3 text-xs leading-relaxed text-slate-200">
                  {agent.latestDecision}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Processing Timeline + Inter-Agent Communication Bus */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Processing Timeline */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-5 xl:col-span-5">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Timer className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Latest Processing Timeline
            </h3>
          </div>
          <div className="mt-4 space-y-4">
            {recentTimeline.map((step, index) => (
              <div key={index} className="relative pl-6">
                {index < recentTimeline.length - 1 && (
                  <div className="absolute left-[7px] top-4 h-full w-px bg-slate-800" />
                )}
                <div
                  className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 ${
                    step.status === 'done'
                      ? 'border-emerald-400 bg-emerald-950'
                      : step.status === 'active'
                      ? 'border-cyan-400 bg-cyan-950'
                      : 'border-slate-600 bg-slate-900'
                  }`}
                />
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-100">{step.agent}</span>
                  <span className="font-mono-tech text-[11px] text-slate-400">{step.time}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Inter-Agent Communication Log */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-5 xl:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Communication Between Agents
              </h3>
            </div>
            <span className="font-mono-tech text-xs text-slate-400">
              {agentComms.length} Packets
            </span>
          </div>

          <div className="mt-4 max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
            {agentComms.map((comm) => (
              <div
                key={comm.id}
                className="rounded-lg border border-slate-800 bg-[#060911] p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono-tech">
                    <span className="font-semibold text-cyan-300">{comm.from}</span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span className="font-semibold text-blue-300">{comm.to}</span>
                    <span className="ml-1 rounded border border-slate-700 bg-[#10192B] px-1.5 py-0.5 text-[10px] text-slate-300">
                      {comm.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono-tech text-[11px] text-slate-500">
                    <span className="text-slate-400">{comm.emergencyId}</span>
                    <span>{comm.timestamp}</span>
                  </div>
                </div>
                <p className="mt-1.5 leading-relaxed text-slate-300">{comm.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
