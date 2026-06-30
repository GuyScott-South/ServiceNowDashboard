import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { query, rangeClause } from "../lib/duckdb";
import { STATE_MAP, STATE_COLORS } from "../lib/constants";

interface Props {
  from: string;
  to: string;
}

export function StateBreakdown({ from, to }: Props) {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    if (!from || !to) return;
    (async () => {
      const rows = await query<{ state: string; cnt: number }>(
        `SELECT state, count(*) as cnt FROM tickets
         WHERE ${rangeClause("opened_at", from, to)}
         GROUP BY state ORDER BY cnt DESC`
      );
      setData(
        rows.map((r) => ({
          name: STATE_MAP[String(r.state)] || `State ${r.state}`,
          value: Number(r.cnt),
        }))
      );
    })();
  }, [from, to]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
        State Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="55%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
            {data.map((d) => (
              <Cell key={d.name} fill={STATE_COLORS[d.name] || "#6b7280"} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
