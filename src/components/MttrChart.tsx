import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { query, rangeClause } from "../lib/duckdb";
import { PRIORITY_SHORT, PRIORITY_COLORS } from "../lib/constants";

interface Props {
  from: string;
  to: string;
}

export function MttrChart({ from, to }: Props) {
  const [data, setData] = useState<{ name: string; hours: number; priority: string }[]>([]);

  useEffect(() => {
    if (!from || !to) return;
    (async () => {
      const rows = await query<{ priority: string; avg_hours: number }>(
        `SELECT priority,
                round(avg(epoch(resolved_at - opened_at) / 3600), 1) as avg_hours
         FROM tickets
         WHERE resolved_at IS NOT NULL
         AND ${rangeClause("resolved_at", from, to)}
         GROUP BY priority ORDER BY priority`
      );
      setData(
        rows.map((r) => ({
          name: PRIORITY_SHORT[String(r.priority)] || `P${r.priority}`,
          hours: Number(r.avg_hours),
          priority: String(r.priority),
        }))
      );
    })();
  }, [from, to]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
        Avg Resolution Time by Priority (hours)
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip formatter={(v) => [`${v} hrs`, "MTTR"]} />
          <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={PRIORITY_COLORS[d.priority] || "#6b7280"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
