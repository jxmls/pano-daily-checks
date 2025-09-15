import { REQUIRED_MODULES } from "../../lib/storage";
import { prettyLocal } from "../../lib/dates";

export default function ComplianceSummary({
  rows,
  quick,
  from,
  to,
  clearQuick,
  onArchive,
  onExport,
  jumpToDay,
  toggleAck,
  addNote,
}) {
  if (!rows.length) return null;

  return (
    <section
      id="compliance-summary"
      className="mb-4 bg-white border rounded-2xl p-3 md:p-4 shadow-sm"
    >
      <div className="flex items-center justify-between text-gray-700 mb-2">
        <div className="flex items-center gap-2">
          <span>⚠️</span>
          <h3 className="font-semibold">Daily compliance summary</h3>
          <span className="text-xs text-gray-500">(within current filters)</span>
        </div>
        <div className="flex items-center gap-2">
          {(quick || from || to) && (
            <button
              onClick={clearQuick}
              className="border px-3 py-1.5 rounded-lg text-sm"
              title="Clear the quick/date filters and show all days"
            >
              Show all days
            </button>
          )}
          <button
            onClick={onArchive}
            className="border px-3 py-1.5 rounded-lg text-sm"
            title="Open archive to view all failed days and export reports"
          >
            Archived
          </button>
          <button
            onClick={onExport}
            className="border px-3 py-1.5 rounded-lg text-sm"
          >
            Export view
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((s) => (
          <div
            key={s.dateKey}
            className="flex flex-wrap items-center justify-between gap-2 border rounded-xl p-2"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm font-medium">{prettyLocal(s.dateKey)}</div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                {s.submittedCount} / {REQUIRED_MODULES.length} submitted
              </span>
              <div className="flex flex-wrap gap-1">
                {s.missingModules.map((m) => (
                  <span
                    key={m}
                    className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700"
                  >
                    Missing: {m}
                  </span>
                ))}
              </div>
              {s.note && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Note: {s.note.length > 40 ? s.note.slice(0, 40) + "…" : s.note}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => jumpToDay(s.dateKey)}
                className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50"
              >
                View day
              </button>
              <button
                onClick={() => toggleAck(s.dateKey)}
                className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50"
              >
                Acknowledge
              </button>
              <button
                onClick={() => addNote(s.dateKey)}
                className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50"
              >
                Note
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
