import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ObstaclePanel from './pages/ObstaclePanel';
import VoiceControl from './pages/VoiceControl';
import MapNavigation from './pages/MapNavigation';
import BroadcastPanel from './pages/BroadcastPanel';

function App() {
  const simulateTick = useAppStore((s) => s.simulateTick);
  const isSimulating = useAppStore((s) => s.isSimulating);

  useEffect(() => {
    if (!isSimulating) return;
    const timer = setInterval(simulateTick, 2000);
    return () => clearInterval(timer);
  }, [isSimulating, simulateTick]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="obstacle" element={<ObstaclePanel />} />
          <Route path="voice" element={<VoiceControl />} />
          <Route path="map" element={<MapNavigation />} />
          <Route path="broadcast" element={<BroadcastPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
