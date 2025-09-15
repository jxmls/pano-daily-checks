export default function CircleCard({ label, value, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 bg-white border rounded-2xl p-4 shadow-sm transition ${active ? "ring-2 ring-blue-400" : "hover:shadow-md"}`}
      title={label}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full border-2">
        <span className="text-xl font-bold">{value}</span>
      </div>
      <div className="text-left">
        <div className="text-xs text-gray-500 uppercase tracking-wide">Today</div>
        <div className="text-sm font-semibold text-gray-800">{label}</div>
      </div>
    </button>
  );
}
