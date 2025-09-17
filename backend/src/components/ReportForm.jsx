import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";

const API = import.meta.env.VITE_API || "http://localhost:4000";

export default function ReportForm({ onCreated, onDeleted, initialReports = [], defaultLat, defaultLon }) {
  const [description, setDescription] = useState("");
  const [hazardType, setHazardType] = useState("");
  const [feedback, setFeedback] = useState("");
  const [image, setImage] = useState(null);
  const [lat, setLat] = useState(defaultLat || "");
  const [lon, setLon] = useState(defaultLon || "");
  const [reports, setReports] = useState(initialReports);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");

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
      const formData = new FormData();
      formData.append("description", description);
      formData.append("hazard_type", hazardType);
      formData.append("feedback", feedback);
      formData.append("lat", parseFloat(lat));
      formData.append("lon", parseFloat(lon));
      if (image) formData.append("image", image);

      const res = await fetch(`${API}/api/reports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit report");

      setReports((prev) => [...prev, data]);
      if (onCreated) onCreated(data);

      setDescription("");
      setHazardType("");
      setFeedback("");
      setLat("");
      setLon("");
      setImage(null);
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
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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

  // ✅ Download Single Report PDF
  const handleDownloadPDF = (report) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Hazard Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Hazard Type: ${report.hazard_type}`, 20, 40);
    doc.text(`Description: ${report.description}`, 20, 50);
    doc.text(`Feedback: ${report.feedback || "N/A"}`, 20, 60);
    doc.text(`Latitude: ${report.lat}`, 20, 70);
    doc.text(`Longitude: ${report.lon}`, 20, 80);
    doc.text(`Status: ${report.status || "Pending"}`, 20, 90);
    doc.text(`Timestamp: ${new Date(report.createdAt || Date.now()).toLocaleString()}`, 20, 100);
    doc.save("hazard_report.pdf");
  };

  // ✅ Download All Reports PDF
  const handleDownloadAllPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("All Hazard Reports", 20, 20);
    let y = 40;
    reports.forEach((r, i) => {
      doc.setFontSize(12);
      doc.text(`${i + 1}. ${r.hazard_type} - ${r.description}`, 20, y);
      doc.text(`Status: ${r.status || "Pending"} | Feedback: ${r.feedback || "N/A"}`, 20, y + 10);
      y += 25;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save("all_hazard_reports.pdf");
  };

  // ✅ Filtered Reports
  const filteredReports =
    filter === "all" ? reports : reports.filter((r) => r.hazard_type === filter);

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

        <textarea
          placeholder="Feedback (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-4/5 p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="w-4/5"
        />

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
        </div>

        {success && <p className="text-green-600 text-sm">{success}</p>}
      </form>

      {/* Filter + Export All */}
      <div className="flex justify-between items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        >
          <option value="all">All Hazards</option>
          <option value="Flood">Flood</option>
          <option value="Cyclone">Cyclone</option>
          <option value="Tsunami">Tsunami</option>
          <option value="Pollution">Pollution</option>
          <option value="Shipwreck">Shipwreck</option>
        </select>
        <button
          onClick={handleDownloadAllPDF}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          📄 Export All to PDF
        </button>
      </div>

      {/* Reports List */}
      {filteredReports.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 text-black dark:text-white">Your Reports</h3>
          <ul className="space-y-2">
            {filteredReports.map((r) => (
              <li
                key={r._id || r.id}
                className="flex flex-col md:flex-row md:justify-between md:items-center p-2 bg-gray-100 dark:bg-gray-700 rounded"
              >
                <div>
                  <p className="font-semibold">{r.hazard_type}</p>
                  <p>{r.description}</p>
                  <p className="text-xs">Feedback: {r.feedback || "N/A"}</p>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      r.status === "verified"
                        ? "bg-green-200 text-green-800"
                        : r.status === "rejected"
                        ? "bg-red-200 text-red-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {r.status || "Pending"}
                  </span>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button
                    onClick={() => handleDownloadPDF(r)}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleDelete(r._id || r.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
