import { Moon, Sun, BarChart3 } from "lucide-react";

interface LayoutProps {
  dark: boolean;
  onToggleTheme: () => void;
  from: string;
  to: string;
  minDate: string;
  maxDate: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  dataLoaded: boolean;
  children: React.ReactNode;
}

export function Layout({
  dark,
  onToggleTheme,
  from,
  to,
  minDate,
  maxDate,
  onFromChange,
  onToChange,
  dataLoaded,
  children,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <h1 className="text-lg font-semibold">ServiceNow Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {dataLoaded && (
              <div className="flex items-center gap-2 text-sm">
                <label className="text-slate-500 dark:text-slate-400">From</label>
                <input
                  type="date"
                  value={from}
                  min={minDate || undefined}
                  max={to || maxDate || undefined}
                  onChange={(e) => onFromChange(e.target.value)}
                  className="px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                />
                <label className="text-slate-500 dark:text-slate-400">To</label>
                <input
                  type="date"
                  value={to}
                  min={from || minDate || undefined}
                  max={maxDate || undefined}
                  onChange={(e) => onToChange(e.target.value)}
                  className="px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                />
              </div>
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
