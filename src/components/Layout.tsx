import { Moon, Sun, BarChart3 } from "lucide-react";

interface LayoutProps {
  dark: boolean;
  onToggleTheme: () => void;
  weeks: string[];
  selectedWeek: string;
  onWeekChange: (week: string) => void;
  dataLoaded: boolean;
  children: React.ReactNode;
}

export function Layout({
  dark,
  onToggleTheme,
  weeks,
  selectedWeek,
  onWeekChange,
  dataLoaded,
  children,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <h1 className="text-lg font-semibold">ServiceNow Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {dataLoaded && weeks.length > 0 && (
              <select
                value={selectedWeek}
                onChange={(e) => onWeekChange(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
              >
                {weeks.map((w) => (
                  <option key={w} value={w}>
                    w/c {w}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
