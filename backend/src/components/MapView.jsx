import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon issue in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Original hazard icons
const hazardIcons = {
  flood: new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/616/616490.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
  pollution: new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/565/565547.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
  default: new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  }),
};

// Location pin icon for "Locate Me"
const locationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

function MouseTracker() {
  const [coords, setCoords] = useState(null);

  useMapEvents({
    mousemove(e) {
      setCoords(e.latlng);
    },
  });

  if (!coords) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 10,
        left: 10,
        backgroundColor: "rgba(255,255,255,0.9)",
        padding: "4px 8px",
        borderRadius: 4,
        fontSize: 12,
        zIndex: 1000,
      }}
    >
      📍 Lat: {coords.lat.toFixed(5)}, Lon: {coords.lng.toFixed(5)}
    </div>
  );
}

function LocateMeButton({ map }) {
  const handleClick = () => {
    if (!map) return;
    map.locate().on("locationfound", (e) => {
      map.flyTo(e.latlng, 12);
      L.marker(e.latlng, { icon: locationIcon })
        .addTo(map)
        .bindPopup("📍 You are here")
        .openPopup();
    });
  };

  return (
    <button
      onClick={handleClick}
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        background: "white",
        border: "1px solid #ccc",
        padding: "6px 10px",
        borderRadius: "6px",
        cursor: "pointer",
        zIndex: 1000,
      }}
    >
      🎯 Locate Me
    </button>
  );
}

export default function MapView({ reports, onMapClick }) {
  const [map, setMap] = useState(null);

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={[20, 80]}
        zoom={5}
        whenCreated={setMap}
        style={{ height: "70vh", width: "100%", borderRadius: "12px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hazard Reports with tooltips */}
        {reports.map((report) => {
          const icon = hazardIcons[report.hazard_type?.toLowerCase()] || hazardIcons.default;
          return (
            <Marker key={report.id} position={[report.lat, report.lon]} icon={icon}>
              <Popup>
                <div style={{ minWidth: "150px" }}>
                  <h3 style={{ margin: 0, fontWeight: "bold" }}>
                    {report.description || "Hazard Report"}
                  </h3>
                  <p style={{ margin: "4px 0" }}>
                    <b>Type:</b> {report.hazard_type || "Unknown"}
                    <br />
                    <b>Credibility:</b> {report.credibility || 0}
                  </p>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                📍 Hazard Location
              </Tooltip>
            </Marker>
          );
        })}

        {onMapClick && <ClickHandler onClick={onMapClick} />}
        <MouseTracker />
      </MapContainer>

      {map && <LocateMeButton map={map} />}
    </div>
  );
}
