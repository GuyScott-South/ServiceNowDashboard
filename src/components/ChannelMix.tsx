import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { query } from "../lib/duckdb";
import { CHART_COLORS } from "../lib/constants";

interface Props {
  weekStart: string;
}

export function ChannelMix({ weekStart }: Props) {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    (async () => {
      const we = `DATE '${weekStart}' + INTERVAL 7 DAY`;
      const rows = await query<{ contact_type: string; cnt: number }>(
        `SELECT CASE WHEN contact_type = '' THEN 'Unknown' ELSE contact_type END as contact_type,
                count(*) as cnt
         FROM tickets
         WHERE opened_at >= DATE '${weekStart}'
         AND opened_at < ${we}
         GROUP BY 1 ORDER BY cnt DESC`
      );
      setData(rows.map((r) => ({ name: String(r.contact_type), value: Number(r.cnt) })));
    })();
  }, [weekStart]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
        Contact Channel
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
