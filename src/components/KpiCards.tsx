import { useEffect, useState } from "react";
import { query } from "../lib/duckdb";
import {
  Ticket,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  ExternalLink,
  Zap,
} from "lucide-react";

interface KpiCardsProps {
  weekStart: string;
  prevWeekStart: string;
}

interface KpiData {
  label: string;
  value: string;
  delta: number | null;
  icon: React.ReactNode;
  color: string;
}

async function getKpisForWeek(weekStart: string) {
  const ws = weekStart;
  const we = `DATE '${ws}' + INTERVAL 7 DAY`;

  const [created, resolved, open, sla, mttr, thirdParty, flf] = await Promise.all([
    query(`SELECT count(*) as v FROM tickets WHERE opened_at >= DATE '${ws}' AND opened_at < ${we}`),
    query(`SELECT count(*) as v FROM tickets WHERE opened_at >= DATE '${ws}' AND opened_at < ${we}`),
    query(`SELECT count(*) as v FROM tickets WHERE opened_at >= DATE '${ws}' AND opened_at < ${we} AND state NOT IN ('3','6')`),
    query(`SELECT
      CASE WHEN count(*) = 0 THEN 100
      ELSE round(100 * sum(CASE WHEN CAST(u_asg_outside_sla_matrix AS VARCHAR) != 'true' THEN 1 ELSE 0 END) / count(*))
      END as v
      FROM tickets WHERE opened_at >= DATE '${ws}' AND opened_at < ${we}`),
    query(`SELECT coalesce(round(avg(epoch(resolved_at - opened_at) / 3600), 1), 0) as v
      FROM tickets WHERE opened_at >= DATE '${ws}' AND opened_at < ${we}`),
    query(`SELECT count(*) as v FROM tickets WHERE opened_at >= DATE '${ws}' AND opened_at < ${we} AND (u_first_line_fix = true OR CAST(u_first_line_fix AS VARCHAR) = 'true')`),
    query(`SELECT count(*) as v FROM tickets WHERE u_on_hold_state = 'With Third Party' AND opened_at >= DATE '${ws}' AND opened_at < ${we}`),
  ]);

  return {
    created: Number(created[0]?.v ?? 0),
    resolved: Number(resolved[0]?.v ?? 0),
    open: Number(open[0]?.v ?? 0),
    sla: Number(sla[0]?.v ?? 100),
    mttr: Number(mttr[0]?.v ?? 0),
    thirdParty: Number(thirdParty[0]?.v ?? 0),
    flf: Number(flf[0]?.v ?? 0),
  };
}

export function KpiCards({ weekStart, prevWeekStart }: KpiCardsProps) {
  const [kpis, setKpis] = useState<KpiData[]>([]);

  useEffect(() => {
    (async () => {
      const [curr, prev] = await Promise.all([
        getKpisForWeek(weekStart),
        getKpisForWeek(prevWeekStart),
      ]);

      const delta = (c: number, p: number) => (p === 0 ? null : c - p);

      setKpis([
        {
          label: "Tickets Created",
          value: String(curr.created),
          delta: delta(curr.created, prev.created),
          icon: <Ticket className="w-5 h-5" />,
          color: "text-blue-500",
        },
        {
          label: "Resolved",
          value: String(curr.resolved),
          delta: delta(curr.resolved, prev.resolved),
          icon: <CheckCircle className="w-5 h-5" />,
          color: "text-emerald-500",
        },
        {
          label: "Open / In Progress",
          value: String(curr.open),
          delta: delta(curr.open, prev.open),
          icon: <AlertCircle className="w-5 h-5" />,
          color: "text-amber-500",
        },
        {
          label: "SLA Compliance",
          value: `${Math.round(curr.sla)}%`,
          delta: prev.sla > 0 ? Math.round(curr.sla - prev.sla) : null,
          icon: <TrendingUp className="w-5 h-5" />,
          color: curr.sla >= 90 ? "text-emerald-500" : "text-red-500",
        },
        {
          label: "Avg Resolution (hrs)",
          value: String(curr.mttr),
          delta: prev.mttr > 0 ? Math.round((curr.mttr - prev.mttr) * 10) / 10 : null,
          icon: <Clock className="w-5 h-5" />,
          color: "text-violet-500",
        },
        {
          label: "With Third Party",
          value: String(curr.thirdParty),
          delta: delta(curr.thirdParty, prev.thirdParty),
          icon: <ExternalLink className="w-5 h-5" />,
          color: "text-orange-500",
        },
        {
          label: "First Line Fix",
          value: `${curr.created > 0 ? Math.round((curr.flf / curr.created) * 100) : 0}%`,
          delta: prev.created > 0 ? Math.round((curr.flf / curr.created) * 100) - Math.round((prev.flf / prev.created) * 100) : null,
          icon: <Zap className="w-5 h-5" />,
          color: (curr.created > 0 ? (curr.flf / curr.created) * 100 : 0) >= 50 ? "text-emerald-500" : "text-amber-500",
        },
      ]);
    })();
  }, [weekStart, prevWeekStart]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {k.label}
            </span>
            <span className={k.color}>{k.icon}</span>
          </div>
          <div className="text-2xl font-bold">{k.value}</div>
          {k.delta !== null && (
            <div
              className={`text-xs mt-1 ${
                k.label === "Avg Resolution (hrs)" || k.label === "Open / In Progress" || k.label === "With Third Party"
                  ? k.delta <= 0
                    ? "text-emerald-500"
                    : "text-red-500"
                  : k.delta >= 0
                  ? "text-emerald-500"
                  : "text-red-500"
              }`}
            >
              {k.delta > 0 ? "+" : ""}
              {k.delta} vs prior week
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
