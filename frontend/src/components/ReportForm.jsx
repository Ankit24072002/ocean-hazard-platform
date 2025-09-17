import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";

const API = import.meta.env.VITE_API || "http://localhost:4000";

export default function ReportForm({ onCreated, onDeleted, initialReports = [], defaultLat, defaultLon }) {
  const [description, setDescription] = useState("");
  const [hazardType, setHazardType] = useState("");
  const [lat, setLat] = useState(defaultLat || "");
  const [lon, setLon] = useState(defaultLon || "");
  const [reports, setReports] = useState(initialReports);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (defaultLat) setLat(defaultLat);
    if (defaultLon) setLon(defaultLon);
  }, [defaultLat, defaultLon]);

  // ✅ Submit Report
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    try {
      const res = await fetch(`${API}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          description,
          hazard_type: hazardType,
          lat: parseFloat(lat),
          lon: parseFloat(lon),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit report");

      setReports((prev) => [...prev, data]); // add to local list
      if (onCreated) onCreated(data);

      setDescription("");
      setHazardType("");
      setLat("");
      setLon("");
      setSuccess("✅ Report submitted successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete Report
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/api/reports/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete");

      setReports((prev) => prev.filter((r) => r._id !== id));
      if (onDeleted) onDeleted(id);
    } catch (err) {
      alert(err.message);
    }
  };

  // ✅ Use My Location
  const getLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5));
        setLon(pos.coords.longitude.toFixed(5));
      },
      () => alert("Unable to fetch location")
    );
  };

  // ✅ Download PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Hazard Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Hazard Type: ${hazardType}`, 20, 40);
    doc.text(`Description: ${description}`, 20, 50);
    doc.text(`Latitude: ${lat}`, 20, 60);
    doc.text(`Longitude: ${lon}`, 20, 70);
    doc.text(`Timestamp: ${new Date().toLocaleString()}`, 20, 80);
    doc.save("hazard_report.pdf");
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow space-y-6">
      <h2 className="text-lg font-bold text-black dark:text-white">📌 Submit Report</h2>

      {/* Submit Form */}
      <form onSubmit={handleSubmit} className="space-y-3 text-center">
        <input
          placeholder="Hazard description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-4/5 p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <select
          value={hazardType}
          onChange={(e) => setHazardType(e.target.value)}
          required
          className="w-4/5 p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        >
          <option value="">Select hazard type</option>
          <option value="Flood">Flood</option>
          <option value="Cyclone">Cyclone</option>
          <option value="Tsunami">Tsunami</option>
          <option value="Pollution">Pollution</option>
          <option value="Shipwreck">Shipwreck</option>
        </select>

        <div className="flex justify-between w-4/5 mx-auto space-x-2">
          <input
            placeholder="Latitude"
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
            className="w-1/2 p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
          />
          <input
            placeholder="Longitude"
            type="number"
            step="0.0001"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            required
            className="w-1/2 p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
          />
        </div>

        <button
          type="button"
          onClick={getLocation}
          className="w-4/5 bg-gray-500 text-white py-2 rounded"
        >
          📍 Use My Location
        </button>

        <div className="flex flex-col gap-2 w-4/5 mx-auto">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            📄 Download PDF
          </button>
        </div>

        {success && <p className="text-green-600 text-sm">{success}</p>}
      </form>

      {/* Reports List */}
      {reports.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 text-black dark:text-white">Your Reports</h3>
          <ul className="space-y-2">
            {reports.map((r) => (
              <li
                key={r._id || r.id}
                className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded"
              >
                <span>{r.hazard_type} – {r.description}</span>
                <button
                  onClick={() => handleDelete(r._id || r.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
