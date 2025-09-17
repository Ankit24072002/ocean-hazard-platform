import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

export default function FeedPanel({ reports, onAction }) {
  const [highlighted, setHighlighted] = useState([]);

  // Highlight new reports
  useEffect(() => {
    if (reports.length === 0) return;

    const newIds = reports
      .filter((r) => !highlighted.includes(r.id))
      .map((r) => r.id);

    if (newIds.length > 0) {
      setHighlighted((prev) => [...prev, ...newIds]);
      setTimeout(() => {
        setHighlighted((prev) => prev.filter((id) => !newIds.includes(id)));
      }, 1500);
    }
  }, [reports]);

  return (
    <div className="flex flex-col gap-3">
      {/* Report List */}
      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800 transition-colors">
        {reports.length === 0 && (
          <p className="text-gray-600 dark:text-gray-300 text-center py-4">
            No reports yet.
          </p>
        )}

        {reports.map((report) => (
          <div
            key={report.id}
            className={`relative p-3 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white flex justify-between items-start transition-all hover:scale-[1.01] hover:shadow-lg
            ${highlighted.includes(report.id) ? "animate-pulse-highlight" : ""}`}
          >
            {/* New Badge */}
            {highlighted.includes(report.id) && (
              <span className="absolute top-2 left-2 bg-yellow-400 dark:bg-yellow-500 text-black dark:text-white text-xs font-bold px-2 py-0.5 rounded-full animate-fade">
                NEW
              </span>
            )}

            {/* Left: Report Details */}
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-lg">{report.hazard_type || "Unknown Hazard"}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Status:{" "}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    report.status === "Approved"
                      ? "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100"
                      : report.status === "Rejected"
                      ? "bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100"
                      : "bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
                  }`}
                >
                  {report.status}
                </span>
              </p>
              {report.timestamp && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(report.timestamp).toLocaleString()}
                </p>
              )}
              {report.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {report.description.length > 60
                    ? report.description.substring(0, 60) + "..."
                    : report.description}
                </p>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-col gap-2 ml-2">
              <button
                onClick={() => onAction(report.id, "Approved")}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500 dark:bg-blue-700 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors text-sm"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => onAction(report.id, "Rejected")}
                className="flex items-center gap-1 px-3 py-1 bg-red-500 dark:bg-red-700 text-white rounded hover:bg-red-600 dark:hover:bg-red-800 transition-colors text-sm"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
