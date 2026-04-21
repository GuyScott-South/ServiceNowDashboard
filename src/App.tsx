import { useState, useCallback } from "react";
import { useTheme } from "./hooks/useTheme";
import { initDuckDB, loadJSON, getWeeks } from "./lib/duckdb";
import { Layout } from "./components/Layout";
import { FileUpload } from "./components/FileUpload";
import { KpiCards } from "./components/KpiCards";
import { StateBreakdown } from "./components/StateBreakdown";
import { PriorityChart } from "./components/PriorityChart";
import { VolumeTimeline } from "./components/VolumeTimeline";
import { MttrChart } from "./components/MttrChart";
import { ChannelMix } from "./components/ChannelMix";
import { AgentActivity } from "./components/AgentActivity";
import { OnHoldAnalysis } from "./components/OnHoldAnalysis";
import { TicketTable } from "./components/TicketTable";
import { Loader2 } from "lucide-react";

export default function App() {
  const { dark, toggle } = useTheme();
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [weeks, setWeeks] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [recordCount, setRecordCount] = useState(0);
  const [error, setError] = useState("");

  const handleFileLoaded = useCallback(async (records: Record<string, unknown>[]) => {
    setLoading(true);
    setError("");
    try {
      await initDuckDB();
      const count = await loadJSON(records);
      setRecordCount(count);

      const wks = await getWeeks();
      setWeeks(wks);

      // Default to the most recent full week (second in list if current partial week exists)
      if (wks.length > 0) {
        // Pick the most recent week that has data
        setSelectedWeek(wks[0]);
      }
      setDataLoaded(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Derive previous week start from selected week
  let prevWeekStart = "";
  if (selectedWeek) {
    const parts = String(selectedWeek).slice(0, 10).split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() - 7);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      prevWeekStart = y + "-" + m + "-" + day;
    }
  }

  if (loading) {
    return (
      <Layout dark={dark} onToggleTheme={toggle} weeks={[]} selectedWeek="" onWeekChange={() => {}} dataLoaded={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-slate-500">Initializing DuckDB and loading data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout dark={dark} onToggleTheme={toggle} weeks={[]} selectedWeek="" onWeekChange={() => {}} dataLoaded={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <p className="text-red-600 dark:text-red-400 font-medium">Error loading data</p>
            <p className="text-sm text-red-500 mt-2">{error}</p>
            <button
              onClick={() => { setError(""); setDataLoaded(false); }}
              className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 rounded-md text-sm hover:bg-red-200 dark:hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!dataLoaded) {
    return (
      <Layout dark={dark} onToggleTheme={toggle} weeks={[]} selectedWeek="" onWeekChange={() => {}} dataLoaded={false}>
        <FileUpload onFileLoaded={handleFileLoaded} />
      </Layout>
    );
  }

  return (
    <Layout
      dark={dark}
      onToggleTheme={toggle}
      weeks={weeks}
      selectedWeek={selectedWeek}
      onWeekChange={setSelectedWeek}
      dataLoaded={dataLoaded}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {recordCount} records loaded &middot; Showing w/c {selectedWeek}
        </p>
        <button
          onClick={() => { setDataLoaded(false); setWeeks([]); setSelectedWeek(""); }}
          className="text-sm text-blue-500 hover:text-blue-600 underline"
        >
          Upload new file
        </button>
      </div>

      <KpiCards weekStart={selectedWeek} prevWeekStart={prevWeekStart} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <StateBreakdown weekStart={selectedWeek} />
        <PriorityChart weekStart={selectedWeek} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <VolumeTimeline />
        <MttrChart weekStart={selectedWeek} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChannelMix weekStart={selectedWeek} />
        <AgentActivity weekStart={selectedWeek} />
      </div>

      <div className="mb-4">
        <OnHoldAnalysis />
      </div>

      <TicketTable weekStart={selectedWeek} />
    </Layout>
  );
}
