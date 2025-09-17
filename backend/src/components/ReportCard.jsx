export default function FeedPanel({ reports, onAction }) {
  const getIcon = (type) => {
    switch (type) {
      case "flood":
        return "/images/icons/flood.png";
      case "storm":
        return "/images/icons/storm.png";
      case "tsunami":
        return "/images/icons/tsunami.png";
      default:
        return "/images/icons/hazard.png";
    }
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {reports.map((r) => (
        <div
          key={r.id}
          className="bg-white/90 rounded-2xl p-4 shadow flex items-center gap-4"
        >
          <img src={getIcon(r.hazard_type)} className="w-10 h-10" />
          <div className="flex-1">
            <p className="font-bold">{r.hazard_type}</p>
            <p className="text-sm text-gray-600">{r.description}</p>
            <p className="text-xs mt-1">
              Status:{" "}
              <span
                className={
                  r.status === "approved"
                    ? "text-green-600"
                    : r.status === "rejected"
                    ? "text-red-600"
                    : "text-yellow-600"
                }
              >
                {r.status}
              </span>
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {r.status === "pending" && (
              <>
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                  onClick={() => onAction(r.id, "approved")}
                >
                  Approve
                </button>
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                  onClick={() => onAction(r.id, "rejected")}
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
