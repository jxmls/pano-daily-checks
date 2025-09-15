function Th({ children }) { return <th className="text-left text-xs font-semibold tracking-wide px-4 py-2">{children}</th>; }
function Td({ children, className = "" }) { return <td className={`px-4 py-2 text-gray-800 ${className}`}>{children}</td>; }

export default function SubmissionsTable({ paged, filteredCount, page, setPage, pageSize, setInspect }) {
  return (
    <section id="submissions-table" className="bg-white border rounded-2xl shadow-sm">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-gray-700">Submissions</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <Th>Created</Th>
              <Th>Module</Th>
              <Th>Engineer</Th>
              <Th>Clients</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paged.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <Td>{new Date(s.createdAt).toLocaleString()}</Td>
                <Td className="capitalize">{s.module}</Td>
                <Td>{s.engineer || "-"}</Td>
                <Td>{Array.isArray(s.meta?.clients) ? s.meta.clients.join(", ") : "-"}</Td>
                <Td>
                  {s.passed ? (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Pass</span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Fail</span>
                  )}
                </Td>
                <Td>
                  <button onClick={() => setInspect(s)} className="text-blue-600 hover:underline">
                    {s.pdf?.dataUrl ? "View PDF" : "View"}
                  </button>
                </Td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 p-6">
                  No submissions match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs text-gray-500">
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredCount)} of {filteredCount}
        </span>
        <div className="flex gap-2">
          <button className="border rounded-md px-2 py-1 text-sm disabled:opacity-40" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <button className="border rounded-md px-2 py-1 text-sm disabled:opacity-40" onClick={() => setPage((p) => (p * pageSize < filteredCount ? p + 1 : p))} disabled={page * pageSize >= filteredCount}>Next</button>
        </div>
      </div>
    </section>
  );
}
