import { CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function ClickHandler({ onClick }) {
  useMapEvents({
    click(event) {
      onClick?.(event.latlng);
    }
  });
  return null;
}

function LocateControl() {
  const map = useMap();

  return (
    <button
      type="button"
      onClick={() => {
        map.locate().once("locationfound", (event) => {
          map.flyTo(event.latlng, 12);
        });
      }}
      className="absolute right-3 top-3 z-[1000] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
    >
      Locate me
    </button>
  );
}

export default function MapView({ reports = [], warnings = [], hotspots = [], socialPosts = [], onMapClick }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold">Operational Map</h2>
          <p className="text-sm text-slate-600">Citizen pins, official warnings, hotspots, and social chatter overlays</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-md bg-slate-100 px-2 py-1">Reports {reports.length}</span>
          <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-800">Warnings {warnings.length}</span>
          <span className="rounded-md bg-rose-50 px-2 py-1 text-rose-700">Hotspots {hotspots.length}</span>
        </div>
      </div>
      <MapContainer center={[15.5, 78.9]} zoom={5} className="h-[60vh] min-h-[420px] w-full xl:h-[72vh]">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onClick={onMapClick} />
        <LocateControl />

        {reports.map((report) => (
          <Marker key={report.id} position={[Number(report.lat), Number(report.lon)]}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{report.hazard_type || "Hazard report"}</p>
                <p>{report.description}</p>
                <p>Status: {report.status || "pending"}</p>
                <p>Credibility: {Math.round((report.credibility || 0) * 100)}%</p>
              </div>
            </Popup>
            <Tooltip>Citizen report</Tooltip>
          </Marker>
        ))}

        {warnings.filter(hasCoords).map((warning) => (
          <CircleMarker
            key={warning.id}
            center={[Number(warning.lat), Number(warning.lon)]}
            radius={18}
            pathOptions={{ color: "#d97706", fillColor: "#f59e0b", fillOpacity: 0.24, weight: 2 }}
          >
            <Popup>
              <p className="font-semibold">{warning.title}</p>
              <p>{warning.area}</p>
              <p>Severity: {warning.severity}</p>
            </Popup>
          </CircleMarker>
        ))}

        {hotspots.filter(hasCoords).map((hotspot, index) => (
          <CircleMarker
            key={`${hotspot.lat}-${hotspot.lon}-${index}`}
            center={[Number(hotspot.lat), Number(hotspot.lon)]}
            radius={Math.min(34, 10 + Number(hotspot.count || 1) * 4)}
            pathOptions={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: 0.28, weight: 2 }}
          >
            <Popup>
              <p className="font-semibold">Hotspot</p>
              <p>{hotspot.hazard_type || "Hazard"} signals: {hotspot.count}</p>
            </Popup>
          </CircleMarker>
        ))}

        {socialPosts.filter(hasCoords).map((post) => (
          <CircleMarker
            key={post.id}
            center={[Number(post.lat), Number(post.lon)]}
            radius={8}
            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.45, weight: 1 }}
          >
            <Popup>
              <p className="font-semibold">{post.platform}</p>
              <p>{post.content}</p>
              <p>{post.sentiment || "informative"} - {post.urgency || "low"} urgency</p>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

function hasCoords(item) {
  return item.lat !== null && item.lat !== undefined && item.lon !== null && item.lon !== undefined;
}
