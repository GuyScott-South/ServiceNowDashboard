import { useState, useCallback } from "react";
import { Upload, FileJson } from "lucide-react";

interface FileUploadProps {
  onFileLoaded: (records: Record<string, unknown>[]) => void;
}

export function FileUpload({ onFileLoaded }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback(
    (file: File) => {
      setError("");
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const records = data.records || data;
          if (!Array.isArray(records)) {
            setError('JSON must contain a "records" array or be an array.');
            return;
          }
          onFileLoaded(records);
        } catch {
          setError("Invalid JSON file.");
        }
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`w-full max-w-lg p-12 rounded-xl border-2 border-dashed text-center transition-colors cursor-pointer
          ${
            dragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500"
          }`}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json";
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFile(file);
          };
          input.click();
        }}
      >
        <div className="flex flex-col items-center gap-4">
          {dragging ? (
            <FileJson className="w-12 h-12 text-blue-500" />
          ) : (
            <Upload className="w-12 h-12 text-slate-400" />
          )}
          <div>
            <p className="text-lg font-medium">Drop your ServiceNow JSON export here</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              or click to browse
            </p>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}
