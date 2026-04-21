import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { query } from "../lib/duckdb";

export function VolumeTimeline() {
  const [data, setData] = useState<{ week: string; created: number; resolved: number }[]>([]);

  useEffect(() => {
    (async () => {
      const rows = await query<{ week: string; created: number; resolved: number }>(
        "WITH weeks AS (" +
        "  SELECT CAST(CAST(date_trunc('week', opened_at) AS DATE) AS VARCHAR) as week FROM tickets WHERE opened_at IS NOT NULL" +
        "  UNION" +
        "  SELECT CAST(CAST(date_trunc('week', resolved_at) AS DATE) AS VARCHAR) as week FROM tickets WHERE resolved_at IS NOT NULL" +
        ") " +
        "SELECT" +
        "  w.week," +
        "  coalesce(c.cnt, 0) as created," +
        "  coalesce(r.cnt, 0) as resolved " +
        "FROM (SELECT DISTINCT week FROM weeks) w " +
        "LEFT JOIN (" +
        "  SELECT CAST(CAST(date_trunc('week', opened_at) AS DATE) AS VARCHAR) as week, count(*) as cnt" +
        "  FROM tickets WHERE opened_at IS NOT NULL GROUP BY 1" +
        ") c ON w.week = c.week " +
        "LEFT JOIN (" +
        "  SELECT CAST(CAST(date_trunc('week', resolved_at) AS DATE) AS VARCHAR) as week, count(*) as cnt" +
        "  FROM tickets WHERE resolved_at IS NOT NULL GROUP BY 1" +
        ") r ON w.week = r.week " +
        "ORDER BY w.week"
      );
      setData(
        rows.map((r) => ({
          week: "w/c " + String(r.week).slice(8, 10) + "/" + String(r.week).slice(5, 7),
          created: Number(r.created),
          resolved: Number(r.resolved),
        }))
      );
    })();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
        Weekly Volume: Created vs Resolved
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="created" fill="#3b82f6" name="Created" radius={[4, 4, 0, 0]} />
          <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
