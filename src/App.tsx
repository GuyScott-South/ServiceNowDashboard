import { useState, useCallback } from "react";
import { useTheme } from "./hooks/useTheme";
import { initDuckDB, loadJSON, getWeeks, getDateRange } from "./lib/duckdb";
import { addDays, daysInclusive } from "./lib/constants";
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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [bounds, setBounds] = useState({ min: "", max: "" });
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
      const range = await getDateRange();
      setBounds(range);

      // Default the range to the most recent full week of data
      if (wks.length > 0) {
        setFrom(wks[0]);
        setTo(addDays(wks[0], 6));
      } else if (range.min && range.max) {
        setFrom(range.min);
        setTo(range.max);
      }
      setDataLoaded(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const resetView = () => {
    setDataLoaded(false);
    setFrom("");
    setTo("");
    setBounds({ min: "", max: "" });
  };

  // Derive the prior comparison period: the equal-length window immediately
  // before the selected range.
  let prevFrom = "";
  let prevTo = "";
  if (from && to) {
    const len = daysInclusive(from, to);
    prevTo = addDays(from, -1);
    prevFrom = addDays(prevTo, -(len - 1));
  }

  const noop = () => {};

  if (loading) {
    return (
      <Layout dark={dark} onToggleTheme={toggle} from="" to="" minDate="" maxDate="" onFromChange={noop} onToChange={noop} dataLoaded={false}>
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
      <Layout dark={dark} onToggleTheme={toggle} from="" to="" minDate="" maxDate="" onFromChange={noop} onToChange={noop} dataLoaded={false}>
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
      <Layout dark={dark} onToggleTheme={toggle} from="" to="" minDate="" maxDate="" onFromChange={noop} onToChange={noop} dataLoaded={false}>
        <FileUpload onFileLoaded={handleFileLoaded} />
      </Layout>
    );
  }

  return (
    <Layout
      dark={dark}
      onToggleTheme={toggle}
      from={from}
      to={to}
      minDate={bounds.min}
      maxDate={bounds.max}
      onFromChange={setFrom}
      onToChange={setTo}
      dataLoaded={dataLoaded}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {recordCount} records loaded &middot; Showing {from} &rarr; {to}
        </p>
        <button
          onClick={resetView}
          className="text-sm text-blue-500 hover:text-blue-600 underline"
        >
          Upload new file
        </button>
      </div>

      <KpiCards from={from} to={to} prevFrom={prevFrom} prevTo={prevTo} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <StateBreakdown from={from} to={to} />
        <PriorityChart from={from} to={to} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <VolumeTimeline />
        <MttrChart from={from} to={to} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChannelMix from={from} to={to} />
        <AgentActivity from={from} to={to} />
      </div>

      <div className="mb-4">
        <OnHoldAnalysis />
      </div>

      <TicketTable from={from} to={to} />
    </Layout>
  );
}
