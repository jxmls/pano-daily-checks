export default function Header({ showHome, showSignOut, onBackToDashboard, onSignOut }) {
  return (
    <div className="w-full bg-black flex justify-between items-center px-6 py-3 shadow relative">
      <img src="/panologo.png" alt="Panoptics logo" className="h-20" />

      <div className="flex gap-4 absolute right-6 top-1/2 transform -translate-y-1/2">
        {showHome && (
          <button
            onClick={onBackToDashboard}
            className="bg-white hover:bg-gray-200 text-black text-sm px-4 py-1 rounded"
          >
            Home
          </button>
        )}
        {showSignOut && (
          <button
            onClick={onSignOut}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1 rounded"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
