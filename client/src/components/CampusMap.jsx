import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';

// Daffodil International University (Ashulia Campus / Daffodil Smart City) center
export const DIU_CAMPUS_CENTER = [23.8788, 90.3225];

// Important buildings and landmarks across DIU Daffodil Smart City
export const DIU_BUILDINGS = [
  {
    name: 'Knowledge Tower (Academic Building 4)',
    category: 'Academic',
    lat: 23.8795,
    lng: 90.3220,
    desc: 'Main multi-storey academic tower, Architecture labs & International Conference Hall',
    icon: '🏛️',
  },
  {
    name: 'Engineering Complex',
    category: 'Academic',
    lat: 23.8805,
    lng: 90.3235,
    desc: 'Faculty of Engineering, CSE/EEE Labs, and Innovation Centers',
    icon: '🔬',
  },
  {
    name: 'Central Library & Auditorium',
    category: 'Facility',
    lat: 23.8785,
    lng: 90.3218,
    desc: 'Central Knowledge Hub, Study halls & Grand Auditorium',
    icon: '📚',
  },
  {
    name: 'DSC Central Cafeteria & Food Court',
    category: 'Food',
    lat: 23.8778,
    lng: 90.3229,
    desc: 'Main Student Food Village, Snacks & Refreshment area',
    icon: '☕',
  },
  {
    name: 'Yabushita Sports Complex & Stadium',
    category: 'Sports',
    lat: 23.8765,
    lng: 90.3242,
    desc: 'Football Playground, Basketball courts & Gymnasium',
    icon: '⚽',
  },
  {
    name: 'Yunus Social Business Centre (Admin Block)',
    category: 'Admin',
    lat: 23.8791,
    lng: 90.3208,
    desc: 'Administrative Offices, Admission & Registrar',
    icon: '🏢',
  },
  {
    name: 'Male & Female Student Halls (Dormitories)',
    category: 'Residential',
    lat: 23.8820,
    lng: 90.3248,
    desc: 'Residential Hall complexes for male and female students',
    icon: '🏠',
  },
  {
    name: 'DIU Main Gate & Transport Terminal',
    category: 'Entrance',
    lat: 23.8760,
    lng: 90.3205,
    desc: 'Main Campus Entrance, Shuttle Bus terminal & Security Checkpost',
    icon: '🚪',
  },
];

// Helper to create clean custom HTML markers with Leaflet
function createHtmlIcon(emoji, bgClass, size = 34) {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${bgClass};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        font-size: ${size * 0.55}px;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const stationIcon = (available) =>
  createHtmlIcon('🚲', available > 0 ? '#059669' : '#dc2626', 36);

const buildingIcon = (icon) =>
  createHtmlIcon(icon, '#3b82f6', 30);

export default function CampusMap({ stations = [], selectedStationId, onSelectStation }) {
  return (
    <div className="card overflow-hidden !p-0 shadow-md">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <h3 className="font-semibold text-slate-800">🗺️ Daffodil International University Campus Map</h3>
          <p className="text-xs text-slate-500">Daffodil Smart City (DSC), Ashulia · Live bike stations & landmark buildings</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-emerald-600"></span> Bike Station (Available)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-red-600"></span> Station (Full/Empty)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-500"></span> Campus Building
          </span>
        </div>
      </div>

      <div className="h-[460px] w-full">
        <MapContainer
          center={DIU_CAMPUS_CENTER}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Important DIU Buildings */}
          {DIU_BUILDINGS.map((b) => (
            <Marker
              key={b.name}
              position={[b.lat, b.lng]}
              icon={buildingIcon(b.icon)}
            >
              <Tooltip direction="top" offset={[0, -15]} opacity={0.9}>
                <span className="font-medium">{b.name}</span>
              </Tooltip>
              <Popup>
                <div className="p-1">
                  <p className="font-semibold text-slate-900">{b.icon} {b.name}</p>
                  <span className="my-1 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700 font-medium">
                    {b.category}
                  </span>
                  <p className="mt-1 text-xs text-slate-600">{b.desc}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Bike Sharing Stations */}
          {stations.map((s) => {
            // Default nearby positions if lat/lng not populated
            const lat = s.lat ?? DIU_CAMPUS_CENTER[0];
            const lng = s.lng ?? DIU_CAMPUS_CENTER[1];

            return (
              <Marker
                key={s.id}
                position={[lat, lng]}
                icon={stationIcon(s.availableCount)}
                eventHandlers={{
                  click: () => onSelectStation && onSelectStation(s),
                }}
              >
                <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
                  <div className="text-center font-medium">
                    📍 {s.name} ({s.availableCount} available)
                  </div>
                </Tooltip>
                <Popup>
                  <div className="p-1 text-left">
                    <p className="font-semibold text-slate-900">📍 {s.name}</p>
                    <p className="text-xs text-slate-500">{s.location || 'Daffodil Smart City'}</p>
                    <div className="my-2 rounded bg-slate-50 p-2 text-xs">
                      <p>🚴 Available bikes: <b className="text-emerald-600">{s.availableCount}</b></p>
                      <p>🅿️ Dock capacity: <b>{s.bikeCount} / {s.capacity}</b></p>
                    </div>
                    <Link
                      to={`/stations/${s.id}`}
                      className="btn-primary inline-block w-full text-center text-xs !py-1.5"
                    >
                      View Station Bikes →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
