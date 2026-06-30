import { useEffect, useState, useMemo } from "react";
import { query, rangeClause } from "../lib/duckdb";
import { STATE_MAP, PRIORITY_SHORT, formatDate } from "../lib/constants";
import { ChevronUp, ChevronDown, Languages } from "lucide-react";
import { translateBatch } from "../lib/translate";

interface Props {
  from: string;
  to: string;
}

interface Ticket {
  number: string;
  short_description: string;
  priority: string;
  state: string;
  opened_at: string;
  resolved_at: string;
  mttr_hours: number | null;
  sla_breached: string;
  u_on_hold_state: string;
  sys_created_by: string;
  contact_type: string;
}

type SortKey = keyof Ticket;

export function TicketTable({ from, to }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("opened_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterState, setFilterState] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterHold, setFilterHold] = useState("");
  const [translated, setTranslated] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (!from || !to) return;
    (async () => {
      const sql = "SELECT number, short_description, priority, state, " +
        "CAST(opened_at AS VARCHAR) as opened_at, CAST(resolved_at AS VARCHAR) as resolved_at, " +
        "CASE WHEN resolved_at IS NOT NULL THEN round(epoch(resolved_at - opened_at) / 3600, 1) ELSE NULL END as mttr_hours, " +
        "CAST(u_asg_outside_sla_matrix AS VARCHAR) as sla_breached, u_on_hold_state, sys_created_by, contact_type " +
        "FROM tickets " +
        "WHERE " + rangeClause("opened_at", from, to) + " " +
        "ORDER BY opened_at DESC";
      const rows = await query<Ticket>(sql);
      setTickets(
        rows.map((r) => ({
          number: String(r.number),
          short_description: String(r.short_description),
          priority: String(r.priority),
          state: String(r.state),
          opened_at: r.opened_at != null ? String(r.opened_at) : "",
          resolved_at: r.resolved_at != null ? String(r.resolved_at) : "",
          mttr_hours: r.mttr_hours != null ? Number(r.mttr_hours) : null,
          sla_breached: String(r.sla_breached),
          u_on_hold_state: String(r.u_on_hold_state),
          sys_created_by: String(r.sys_created_by),
          contact_type: String(r.contact_type),
        }))
      );
    })();
  }, [from, to]);

  const filtered = useMemo(() => {
    let list = tickets;
    if (filterState) list = list.filter((t) => t.state === filterState);
    if (filterPriority) list = list.filter((t) => t.priority === filterPriority);
    if (filterHold) list = list.filter((t) => t.u_on_hold_state === filterHold);
    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [tickets, filterState, filterPriority, filterHold, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortAsc ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />
    ) : null;

  const handleTranslate = async () => {
    if (Object.keys(translated).length > 0) { setTranslated({}); return; }
    setTranslating(true);
    const descs = filtered.map((t) => t.short_description);
    const results = await translateBatch(descs);
    const map: Record<string, string> = {};
    filtered.forEach((t, i) => { map[t.number] = results[i]; });
    setTranslated(map);
    setTranslating(false);
  };

  const uniqueStates = [...new Set(tickets.map((t) => t.state))];
  const uniquePriorities = [...new Set(tickets.map((t) => t.priority))];
  const uniqueHolds = [...new Set(tickets.map((t) => t.u_on_hold_state).filter(Boolean))];

  const columns: [SortKey, string][] = [
    ["number", "Number"], ["short_description", "Description"], ["priority", "Priority"],
    ["state", "State"], ["opened_at", "Opened"], ["resolved_at", "Resolved"],
    ["mttr_hours", "MTTR (hrs)"], ["sla_breached", "SLA Met"],
    ["u_on_hold_state", "Hold Reason"], ["sys_created_by", "Created By"],
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Ticket Details ({filtered.length})
        </h3>
        <div className="flex gap-2 text-xs">
          <select value={filterState} onChange={(e) => setFilterState(e.target.value)}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
            <option value="">All States</option>
            {uniqueStates.map((s) => <option key={s} value={s}>{STATE_MAP[s] || s}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
            <option value="">All Priorities</option>
            {uniquePriorities.map((p) => <option key={p} value={p}>{PRIORITY_SHORT[p] || p}</option>)}
          </select>
          {uniqueHolds.length > 0 && (
            <select value={filterHold} onChange={(e) => setFilterHold(e.target.value)}
              className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
              <option value="">All Hold States</option>
              {uniqueHolds.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          )}
          <button
            onClick={handleTranslate}
            disabled={translating}
            className="flex items-center gap-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <Languages className="w-3.5 h-3.5" />
            {translating ? "Translating..." : Object.keys(translated).length > 0 ? "Show Original" : "Translate"}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
              {columns.map(([key, label]) => (
                <th key={key} onClick={() => handleSort(key)}
                  className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 whitespace-nowrap">
                  {label}<SortIcon col={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.number} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="py-2 px-2 font-mono text-xs align-middle">{t.number}</td>
                <td className="py-2 px-2 align-middle">{translated[t.number] || t.short_description}</td>
                <td className="py-2 px-2 align-middle whitespace-nowrap">{PRIORITY_SHORT[t.priority] || t.priority}</td>
                <td className="py-2 px-2 align-middle whitespace-nowrap">{STATE_MAP[t.state] || t.state}</td>
                <td className="py-2 px-2 whitespace-nowrap text-xs align-middle">{formatDate(t.opened_at)}</td>
                <td className="py-2 px-2 whitespace-nowrap text-xs align-middle">{formatDate(t.resolved_at)}</td>
                <td className="py-2 px-2 align-middle">{t.mttr_hours != null ? t.mttr_hours : "-"}</td>
                <td className="py-2 px-2 align-middle">
                  {t.sla_breached !== "true" ? (
                    <span className="text-emerald-500 font-medium">Yes</span>
                  ) : t.resolved_at ? (
                    <span className="text-red-500 font-medium">No</span>
                  ) : "-"}
                </td>
                <td className="py-2 px-2 text-xs align-middle whitespace-nowrap">{t.u_on_hold_state || "-"}</td>
                <td className="py-2 px-2 text-xs align-middle whitespace-nowrap">{t.sys_created_by.replace(/@.*/, "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
