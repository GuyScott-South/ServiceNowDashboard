import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { query } from "../lib/duckdb";
import { PRIORITY_SHORT, PRIORITY_COLORS } from "../lib/constants";

interface Props {
  weekStart: string;
}

export function PriorityChart({ weekStart }: Props) {
  const [data, setData] = useState<{ name: string; value: number; priority: string }[]>([]);

  useEffect(() => {
    (async () => {
      const we = `DATE '${weekStart}' + INTERVAL 7 DAY`;
      const rows = await query<{ priority: string; cnt: number }>(
        `SELECT priority, count(*) as cnt FROM tickets
         WHERE opened_at >= DATE '${weekStart}'
         AND opened_at < ${we}
         GROUP BY priority ORDER BY priority`
      );
      setData(
        rows.map((r) => ({
          name: PRIORITY_SHORT[String(r.priority)] || `P${r.priority}`,
          value: Number(r.cnt),
          priority: String(r.priority),
        }))
      );
    })();
  }, [weekStart]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
        Priority Distribution
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 12 }} width={40} />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={PRIORITY_COLORS[d.priority] || "#6b7280"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
