import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Navigation,
  LocateFixed,
  Route,
  Clock,
  Milestone,
  Search,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import GlassCard from '../components/GlassCard';
import { generateMockNavigation } from '../store/mockData';

// Leaflet CSS import (loaded in index.html via CDN or here)
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const userIcon = L.divIcon({
  className: 'user-marker',
  html: `<div class="user-marker-dot"><div class="user-marker-pulse"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'destination-marker',
});

// Map center follower
function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function MapNavigation() {
  const caneData = useAppStore((s) => s.caneData);
  const navigation = useAppStore((s) => s.navigation);
  const setNavigation = useAppStore((s) => s.setNavigation);
  useAppStore((s) => s.isNavigating);
  const setIsNavigating = useAppStore((s) => s.setIsNavigating);
  const [destination, setDestination] = useState('');
  const [searchResults] = useState([
    { name: '人民广场地铁站', lat: 31.2320, lng: 121.4735 },
    { name: '南京东路', lat: 31.2370, lng: 121.4800 },
    { name: '外滩', lat: 31.2400, lng: 121.4900 },
    { name: '豫园', lat: 31.2270, lng: 121.4920 },
    { name: '上海博物馆', lat: 31.2290, lng: 121.4730 },
  ]);
  const [showSearch, setShowSearch] = useState(false);

  const { lat, lng } = caneData.sensors.gps;

  const startNavigation = (destName: string) => {
    setDestination(destName);
    setShowSearch(false);
    setIsNavigating(true);
    const nav = generateMockNavigation(caneData.sensors.gps);
    setNavigation(nav);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setNavigation(null);
    setDestination('');
  };

  const routePositions: [number, number][] = navigation
    ? navigation.route.map((p) => [p.lat, p.lng])
    : [];

  return (
    <div className="map-page">
      <div className="map-grid">
        {/* Map */}
        <GlassCard
          title="实时地图"
          icon={<MapPin size={18} />}
          accent="#10b981"
          className="map-card"
        >
          <div className="map-wrapper">
            <MapContainer
              center={[lat, lng]}
              zoom={16}
              className="leaflet-map"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater lat={lat} lng={lng} />

              {/* User position */}
              <Marker position={[lat, lng]} icon={userIcon}>
                <Popup>
                  <strong>当前位置</strong>
                  <br />
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </Popup>
              </Marker>

              {/* Navigation route */}
              {navigation && (
                <>
                  <Polyline
                    positions={routePositions}
                    pathOptions={{
                      color: '#6366f1',
                      weight: 4,
                      opacity: 0.8,
                      dashArray: '10, 6',
                    }}
                  />
                  <Marker
                    position={[
                      navigation.destination.lat,
                      navigation.destination.lng,
                    ]}
                    icon={destIcon}
                  >
                    <Popup>
                      <strong>目的地</strong>
                      <br />
                      {destination}
                    </Popup>
                  </Marker>
                  {navigation.route.map((pt, i) =>
                    pt.instruction ? (
                      <Marker key={i} position={[pt.lat, pt.lng]} icon={defaultIcon}>
                        <Popup>{pt.instruction}</Popup>
                      </Marker>
                    ) : null
                  )}
                </>
              )}
            </MapContainer>

            {/* Map overlay controls */}
            <div className="map-overlay-controls">
              <button
                className="map-ctrl-btn"
                title="定位当前位置"
              >
                <LocateFixed size={18} />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Navigation Controls */}
        <div className="nav-controls">
          {/* Search */}
          <GlassCard
            title="目的地搜索"
            icon={<Search size={18} />}
            accent="#6366f1"
            className="search-card"
          >
            <div className="search-area">
              <div className="search-input-wrap">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="搜索目的地..."
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setShowSearch(true);
                  }}
                  onFocus={() => setShowSearch(true)}
                />
                {destination && (
                  <button onClick={() => { setDestination(''); setShowSearch(false); }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {showSearch && (
                <motion.div
                  className="search-results"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {searchResults
                    .filter((r) =>
                      r.name.toLowerCase().includes(destination.toLowerCase()) || destination === ''
                    )
                    .map((result, i) => (
                      <motion.button
                        key={i}
                        className="search-result-item"
                        onClick={() => startNavigation(result.name)}
                        whileHover={{ x: 4 }}
                      >
                        <MapPin size={14} />
                        <span>{result.name}</span>
                      </motion.button>
                    ))}
                </motion.div>
              )}
            </div>
          </GlassCard>

          {/* Current Nav Info */}
          <GlassCard
            title="导航信息"
            icon={<Navigation size={18} />}
            accent="#f59e0b"
            className="nav-info-card"
          >
            {!navigation ? (
              <div className="empty-state">
                <Route size={32} />
                <p>搜索目的地开始导航</p>
              </div>
            ) : (
              <div className="nav-details">
                <div className="nav-current-step">
                  <Navigation size={20} />
                  <span>{navigation.currentStep}</span>
                </div>

                <div className="nav-stats">
                  <div className="nav-stat">
                    <Milestone size={16} />
                    <div>
                      <span className="ns-value">
                        {navigation.distance_m >= 1000
                          ? `${(navigation.distance_m / 1000).toFixed(1)} km`
                          : `${navigation.distance_m} m`}
                      </span>
                      <span className="ns-label">总距离</span>
                    </div>
                  </div>
                  <div className="nav-stat">
                    <Clock size={16} />
                    <div>
                      <span className="ns-value">
                        {Math.ceil(navigation.duration_s / 60)} 分钟
                      </span>
                      <span className="ns-label">预计用时</span>
                    </div>
                  </div>
                </div>

                <div className="nav-steps-list">
                  {navigation.route.map((pt, i) => (
                    <motion.div
                      className={`nav-step ${i === 0 ? 'current' : ''}`}
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className={`step-dot ${i === 0 ? 'active' : ''}`} />
                      <span>{pt.instruction || `途经点 ${i + 1}`}</span>
                    </motion.div>
                  ))}
                </div>

                <button className="stop-nav-btn" onClick={stopNavigation}>
                  <X size={16} />
                  停止导航
                </button>
              </div>
            )}
          </GlassCard>

          {/* GPS Info */}
          <GlassCard
            title="GPS 信息"
            icon={<LocateFixed size={18} />}
            accent="#06b6d4"
            className="gps-info-card"
          >
            <div className="gps-details">
              <div className="gps-row">
                <span className="gps-label">纬度</span>
                <span className="gps-value">{lat.toFixed(6)}</span>
              </div>
              <div className="gps-row">
                <span className="gps-label">经度</span>
                <span className="gps-value">{lng.toFixed(6)}</span>
              </div>
              <div className="gps-row">
                <span className="gps-label">状态</span>
                <span className="gps-value gps-active">
                  <span className="gps-dot" /> 定位中
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
