import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  AlertTriangle,
  Mic,
  Map,
  Volume2,
  Menu,
  X,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/obstacle', icon: AlertTriangle, label: '障碍检测' },
  { path: '/voice', icon: Mic, label: '语音控制' },
  { path: '/map', icon: Map, label: '地图导航' },
  { path: '/broadcast', icon: Volume2, label: '智能播报' },
];

function getBatteryIcon(level: number) {
  if (level <= 20) return BatteryLow;
  if (level <= 60) return BatteryMedium;
  if (level <= 90) return BatteryFull;
  return Battery;
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const caneData = useAppStore((s) => s.caneData);
  const isSimulating = useAppStore((s) => s.isSimulating);
  const toggleSimulation = useAppStore((s) => s.toggleSimulation);

  const BatteryIcon = getBatteryIcon(caneData.system.battery);
  const isOnline = caneData.system.status === 'online';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <motion.aside
        className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}
        animate={{ width: sidebarOpen ? 240 : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-header">
          <motion.div
            className="logo"
            animate={{ opacity: sidebarOpen ? 1 : 0 }}
          >
            {sidebarOpen && <span className="logo-text">🦯 智能盲杖</span>}
          </motion.div>
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <motion.div
                className="nav-icon-wrap"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon size={20} />
              </motion.div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    className="nav-label"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className={`sim-toggle ${isSimulating ? 'active' : ''}`}
            onClick={toggleSimulation}
            title={isSimulating ? '暂停模拟' : '开始模拟'}
          >
            <div className={`sim-dot ${isSimulating ? 'pulse' : ''}`} />
            {sidebarOpen && (
              <span>{isSimulating ? '模拟中' : '已暂停'}</span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="main-area">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">
              {navItems.find(
                (n) =>
                  n.path === location.pathname ||
                  (n.path === '/' && location.pathname === '/')
              )?.label || '智能盲杖控制台'}
            </h1>
          </div>
          <div className="topbar-right">
            <div className={`status-chip ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? '在线' : '离线'}</span>
            </div>
            <div
              className={`battery-chip ${caneData.system.battery <= 20 ? 'low' : ''}`}
            >
              <BatteryIcon size={16} />
              <span>{caneData.system.battery}%</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="page-wrapper"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
