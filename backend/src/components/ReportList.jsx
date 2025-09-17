import { useEffect, useState } from "react";
import api from "../services/api";

export default function ReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await api.get("/api/reports");
        setReports(res.data);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) return <p>Loading reports...</p>;
  if (!reports.length) return <p>No reports yet</p>;

  return (
    <div style={{ marginTop: 30 }}>
      <h2>All Reports</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {reports.map((r) => (
          <li key={r.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
            <p><strong>{r.hazard_type}</strong> at ({r.lat}, {r.lon})</p>
            <p>{r.description}</p>
            <p>Status: {r.status} | Credibility: {r.credibility}</p>
            <p>Submitted at: {new Date(r.created_at).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
