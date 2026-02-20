import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  MapPin,
  Zap,
  TrendingDown,
  Shield,
  Cpu,
  Radio,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import GlassCard from '../components/GlassCard';
import RadialGauge from '../components/RadialGauge';

export default function Dashboard() {
  const caneData = useAppStore((s) => s.caneData);
  const distanceHistory = useAppStore((s) => s.distanceHistory);
  const obstacles = useAppStore((s) => s.obstacles);
  const broadcasts = useAppStore((s) => s.broadcasts);

  const { distance_cm, fall_alert, gps } = caneData.sensors;
  const { battery } = caneData.system;

  const distanceLevel =
    distance_cm < 50 ? 'danger' : distance_cm < 150 ? 'warning' : 'safe';

  return (
    <div className="dashboard-page">
      {/* Fall Alert Banner */}
      <AnimatePresence>
        {fall_alert && (
          <motion.div
            className="fall-alert-banner"
            initial={{ opacity: 0, y: -40, scaleY: 0 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -40, scaleY: 0 }}
          >
            <AlertTriangle size={24} />
            <span>⚠️ 跌倒警报！检测到设备异常姿态，请确认用户安全</span>
            <AlertTriangle size={24} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Cards Row */}
      <div className="stat-cards-row">
        <motion.div
          className={`stat-card distance-card ${distanceLevel}`}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <div className="stat-card-icon">
            <Activity size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">前方距离</span>
            <span className="stat-value">
              <motion.span
                key={distance_cm}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {distance_cm}
              </motion.span>
              <small> cm</small>
            </span>
            <span className={`stat-badge ${distanceLevel}`}>
              {distanceLevel === 'danger'
                ? '⚠ 危险'
                : distanceLevel === 'warning'
                  ? '⚡ 注意'
                  : '✓ 安全'}
            </span>
          </div>
        </motion.div>

        <motion.div
          className={`stat-card fall-card ${fall_alert ? 'alert' : ''}`}
          whileHover={{ scale: 1.02 }}
        >
          <div className="stat-card-icon">
            <Shield size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">跌倒检测</span>
            <span className="stat-value">
              {fall_alert ? '⚠ 警报' : '正常'}
            </span>
            <span className={`stat-badge ${fall_alert ? 'danger' : 'safe'}`}>
              {fall_alert ? '已触发' : '未触发'}
            </span>
          </div>
        </motion.div>

        <motion.div className="stat-card gps-card" whileHover={{ scale: 1.02 }}>
          <div className="stat-card-icon">
            <MapPin size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">GPS 坐标</span>
            <span className="stat-value-sm">
              {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
            </span>
            <span className="stat-badge safe">定位中</span>
          </div>
        </motion.div>

        <motion.div
          className="stat-card device-card"
          whileHover={{ scale: 1.02 }}
        >
          <div className="stat-card-icon">
            <Cpu size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">设备状态</span>
            <span className="stat-value">{caneData.system.status === 'online' ? '在线' : '离线'}</span>
            <span className="stat-badge safe">
              <Radio size={12} /> 运行中
            </span>
          </div>
        </motion.div>
      </div>

      {/* Gauges + Chart Row */}
      <div className="dashboard-grid">
        <GlassCard
          title="实时仪表"
          icon={<Zap size={18} />}
          accent="#6366f1"
          className="gauges-card"
        >
          <div className="gauges-row">
            <RadialGauge
              value={distance_cm}
              max={400}
              label="前方距离"
              unit="cm"
              color="#6366f1"
              warningThreshold={150}
              dangerThreshold={50}
            />
            <RadialGauge
              value={battery}
              max={100}
              label="电池电量"
              unit="%"
              color="#10b981"
              warningThreshold={30}
              dangerThreshold={15}
            />
          </div>
        </GlassCard>

        <GlassCard
          title="距离趋势"
          icon={<TrendingDown size={18} />}
          accent="#06b6d4"
          className="chart-card"
        >
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={distanceHistory}>
                <defs>
                  <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="time"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={11}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={11}
                  domain={[0, 400]}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="distance"
                  stroke="#6366f1"
                  fill="url(#distGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row: Obstacles + Recent Broadcasts */}
      <div className="dashboard-bottom-row">
        <GlassCard
          title="障碍物检测"
          icon={<AlertTriangle size={18} />}
          accent="#f59e0b"
          className="obstacles-mini"
        >
          {obstacles.length === 0 ? (
            <div className="empty-state">
              <Shield size={32} />
              <p>当前未检测到障碍物</p>
            </div>
          ) : (
            <div className="obstacles-list">
              {obstacles.map((obs) => (
                <motion.div
                  className="obstacle-item"
                  key={obs.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="obs-label">{obs.label}</div>
                  <div className="obs-dist">{obs.distance_cm} cm</div>
                  <div className="obs-conf">
                    {(obs.confidence * 100).toFixed(0)}%
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          title="最近播报"
          icon={<Activity size={18} />}
          accent="#8b5cf6"
          className="broadcasts-mini"
        >
          {broadcasts.length === 0 ? (
            <div className="empty-state">
              <Activity size={32} />
              <p>暂无播报记录</p>
            </div>
          ) : (
            <div className="broadcast-mini-list">
              {broadcasts.slice(0, 5).map((b) => (
                <motion.div
                  className={`broadcast-mini-item ${b.type}`}
                  key={b.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="bm-type">{b.type === 'alert' ? '🔴' : b.type === 'navigation' ? '🟢' : '🔵'}</span>
                  <span className="bm-text">{b.text}</span>
                  <span className="bm-time">
                    {new Date(b.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
