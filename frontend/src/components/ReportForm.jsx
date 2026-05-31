import { useEffect, useState } from "react";
import { Camera, MapPin, Send, WifiOff } from "lucide-react";

const API = import.meta.env.VITE_API || "http://localhost:4000";
const QUEUE_KEY = "offlineReportQueue";

export default function ReportForm({ onCreated, defaultLat = "", defaultLon = "" }) {
  const [form, setForm] = useState({
    description: "",
    hazard_type: "",
    lat: defaultLat,
    lon: defaultLon,
    media: null
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [queuedCount, setQueuedCount] = useState(() => getQueue().length);

  useEffect(() => {
    setForm((prev) => ({ ...prev, lat: defaultLat || prev.lat, lon: defaultLon || prev.lon }));
  }, [defaultLat, defaultLon]);

  function update(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function locate() {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        update("lat", position.coords.latitude.toFixed(5));
        update("lon", position.coords.longitude.toFixed(5));
      },
      () => setMessage("Unable to read your location.")
    );
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const created = await sendReport(form);
      onCreated?.(created);
      setForm({ description: "", hazard_type: "", lat: "", lon: "", media: null });
      event.target.reset();
      setMessage("Report submitted successfully.");
    } catch (error) {
      queueReport(form);
      setQueuedCount(getQueue().length);
      setMessage(`Saved offline. Sync when connected. (${error.message})`);
    } finally {
      setLoading(false);
    }
  }

  async function syncQueue() {
    const queue = getQueue();
    if (!queue.length) return;

    setLoading(true);
    const remaining = [];
    for (const item of queue) {
      try {
        const created = await sendReport(item);
        onCreated?.(created);
      } catch {
        remaining.push(item);
      }
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    setQueuedCount(remaining.length);
    setLoading(false);
    setMessage(remaining.length ? "Some offline reports still need syncing." : "Offline reports synced.");
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="font-semibold">Submit Hazard Report</h2>
        <p className="text-sm text-slate-600">Geotagged citizen reports can include photo or video evidence.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <select
          value={form.hazard_type}
          onChange={(event) => update("hazard_type", event.target.value)}
          required
          className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-700"
        >
          <option value="">Select hazard type</option>
          <option>High Waves</option>
          <option>High Tide</option>
          <option>Coastal Flooding</option>
          <option>Storm Surge</option>
          <option>Tsunami</option>
          <option>Wave Damage</option>
          <option>Oil Spill</option>
        </select>

        <textarea
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          required
          rows={4}
          placeholder="What is happening? Include visible impact, nearby landmark, and urgency."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-700"
        />

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={form.lat}
            onChange={(event) => update("lat", event.target.value)}
            required
            type="number"
            step="0.00001"
            placeholder="Latitude"
            className="min-h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-700"
          />
          <input
            value={form.lon}
            onChange={(event) => update("lon", event.target.value)}
            required
            type="number"
            step="0.00001"
            placeholder="Longitude"
            className="min-h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-700"
          />
          <button type="button" onClick={locate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium transition hover:border-cyan-700 hover:bg-slate-50">
            <MapPin size={16} />
            Use GPS
          </button>
        </div>

        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 px-3 text-sm text-slate-600 transition hover:border-cyan-700 hover:bg-cyan-50/40">
          <Camera size={18} />
          <span>{form.media ? form.media.name : "Attach photo or video"}</span>
          <input type="file" accept="image/*,video/*" onChange={(event) => update("media", event.target.files?.[0] || null)} className="hidden" />
        </label>

        {message && <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button disabled={loading} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-2 font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-70">
            <Send size={16} />
            {loading ? "Working..." : "Submit report"}
          </button>
          <button type="button" onClick={syncQueue} disabled={!queuedCount || loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 font-medium transition hover:bg-slate-50 disabled:opacity-50">
            <WifiOff size={16} />
            Sync offline ({queuedCount})
          </button>
        </div>
      </form>
    </div>
  );
}

async function sendReport(report) {
  const token = localStorage.getItem("token");
  const body = new FormData();
  body.append("description", report.description);
  body.append("hazard_type", report.hazard_type);
  body.append("lat", report.lat);
  body.append("lon", report.lon);
  if (report.media instanceof File) body.append("media", report.media);

  const res = await fetch(`${API}/api/reports`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Network/API unavailable");
  return data;
}

function queueReport(report) {
  const queue = getQueue();
  queue.push({
    description: report.description,
    hazard_type: report.hazard_type,
    lat: report.lat,
    lon: report.lon
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}
