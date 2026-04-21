import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { translateBatch } from "../lib/translate";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { query } from "../lib/duckdb";
import { PRIORITY_SHORT } from "../lib/constants";

const HOLD_COLORS: Record<string, string> = {
  "With Third Party": "#ef4444",
  Monitoring: "#f59e0b",
  "With Customer Team": "#3b82f6",
  "Waiting for Customer": "#8b5cf6",
};

interface HoldBreakdown {
  reason: string;
  count: number;
}

interface AgingTicket {
  number: string;
  short_description: string;
  priority: string;
  u_on_hold_state: string;
  opened_at: string;
  days_waiting: number;
  assignment_group: string;
}

export function OnHoldAnalysis() {
  const [breakdown, setBreakdown] = useState<HoldBreakdown[]>([]);
  const [aging, setAging] = useState<AgingTicket[]>([]);
  const [translated, setTranslated] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    (async () => {
      const bdRows = await query<{ reason: string; cnt: number }>(
        `SELECT u_on_hold_state as reason, count(*) as cnt
         FROM tickets
         WHERE u_on_hold_state IS NOT NULL AND state NOT IN ('3', '6')
         GROUP BY u_on_hold_state ORDER BY cnt DESC`
      );
      setBreakdown(bdRows.map((r) => ({ reason: String(r.reason), count: Number(r.cnt) })));

      const agRows = await query<AgingTicket>(
        `SELECT number, short_description, priority, u_on_hold_state, opened_at, assignment_group,
                round(epoch(CAST(now() AS TIMESTAMP) - opened_at) / 86400, 1) as days_waiting
         FROM tickets
         WHERE u_on_hold_state IS NOT NULL AND state NOT IN ('3', '6')
         ORDER BY days_waiting DESC`
      );
      setAging(
        agRows.map((r) => ({
          ...r,
          number: String(r.number),
          short_description: String(r.short_description),
          priority: String(r.priority),
          u_on_hold_state: String(r.u_on_hold_state),
          opened_at: String(r.opened_at).slice(0, 10),
          days_waiting: Number(r.days_waiting),
          assignment_group: String(r.assignment_group),
        }))
      );
    })();
  }, []);

  const handleTranslate = async () => {
    if (Object.keys(translated).length > 0) { setTranslated({}); return; }
    setTranslating(true);
    const descs = aging.map((t) => t.short_description);
    const results = await translateBatch(descs);
    const map: Record<string, string> = {};
    aging.forEach((t, i) => { map[t.number] = results[i]; });
    setTranslated(map);
    setTranslating(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
        On-Hold / Third Party Analysis
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase">
            By Hold Reason
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={breakdown} layout="vertical">
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis dataKey="reason" type="category" tick={{ fill: "#94a3b8", fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {breakdown.map((d) => (
                  <Cell key={d.reason} fill={HOLD_COLORS[d.reason] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
              Aging Tickets (Currently On Hold)
            </h4>
            {aging.length > 0 && (
              <button
                onClick={handleTranslate}
                disabled={translating}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <Languages className="w-3.5 h-3.5" />
                {translating ? "Translating..." : Object.keys(translated).length > 0 ? "Show Original" : "Translate to English"}
              </button>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400">Ticket</th>
                <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400">Description</th>
                <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400">Priority</th>
                <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400">Hold Reason</th>
                <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400">Days Waiting</th>
              </tr>
            </thead>
            <tbody>
              {aging.map((t) => (
                <tr key={t.number} className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-2 px-2 font-mono text-xs align-middle">{t.number}</td>
                  <td className="py-2 px-2 align-middle">{translated[t.number] || t.short_description}</td>
                  <td className="py-2 px-2 align-middle whitespace-nowrap">{PRIORITY_SHORT[t.priority] || t.priority}</td>
                  <td className="py-2 px-2 whitespace-nowrap align-middle">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: HOLD_COLORS[t.u_on_hold_state] || "#6b7280" }}
                    >
                      {t.u_on_hold_state}
                    </span>
                  </td>
                  <td className={`py-2 px-2 font-semibold align-middle ${t.days_waiting > 5 ? "text-red-500" : t.days_waiting > 3 ? "text-amber-500" : ""}`}>
                    {t.days_waiting}
                  </td>
                </tr>
              ))}
              {aging.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    No tickets currently on hold
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
