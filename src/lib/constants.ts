export const STATE_MAP: Record<string, string> = {
  "1": "New",
  "2": "In Progress",
  "3": "Closed",
  "6": "Resolved",
  "10": "Pending",
  "18": "On Hold",
};

export const PRIORITY_MAP: Record<string, string> = {
  "1": "P1 - Critical",
  "2": "P2 - High",
  "3": "P3 - Medium",
  "4": "P4 - Low",
};

export const PRIORITY_SHORT: Record<string, string> = {
  "1": "P1",
  "2": "P2",
  "3": "P3",
  "4": "P4",
};

export const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export const STATE_COLORS: Record<string, string> = {
  New: "#3b82f6",
  "In Progress": "#06b6d4",
  Resolved: "#10b981",
  Closed: "#6b7280",
  "On Hold": "#f59e0b",
  Pending: "#8b5cf6",
};

export const PRIORITY_COLORS: Record<string, string> = {
  "1": "#ef4444",
  "2": "#f59e0b",
  "3": "#3b82f6",
  "4": "#6b7280",
};

export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatWeekLabel(monday: Date): string {
  return `w/c ${monday.toISOString().slice(0, 10)}`;
}

export function formatDate(d: string): string {
  if (!d) return "-";
  const s = String(d).slice(0, 19);
  const parts = s.split(/[T ]/);
  if (parts.length < 2) return s;
  const dp = parts[0].split("-");
  if (dp.length !== 3) return s;
  return dp[2] + "/" + dp[1] + "/" + dp[0] + " " + parts[1];
}
