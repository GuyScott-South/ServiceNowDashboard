import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { query, rangeClause } from "../lib/duckdb";

interface Props {
  from: string;
  to: string;
}

export function AgentActivity({ from, to }: Props) {
  const [data, setData] = useState<{ name: string; tickets: number }[]>([]);

  useEffect(() => {
    if (!from || !to) return;
    (async () => {
      const rows = await query<{ agent: string; cnt: number }>(
        `SELECT sys_created_by as agent, count(*) as cnt
         FROM tickets
         WHERE ${rangeClause("opened_at", from, to)}
         AND sys_created_by != ''
         GROUP BY sys_created_by ORDER BY cnt DESC`
      );
      setData(
        rows.map((r) => ({
          name: String(r.agent).replace(/@.*/, ""),
          tickets: Number(r.cnt),
        }))
      );
    })();
  }, [from, to]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
        Agent Activity (Tickets Created)
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 12 }} width={100} />
          <Tooltip />
          <Bar dataKey="tickets" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
