import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Eye,
  Camera,
  Box,
  Crosshair,
  Upload,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import GlassCard from '../components/GlassCard';
import RadialGauge from '../components/RadialGauge';

export default function ObstaclePanel() {
  const caneData = useAppStore((s) => s.caneData);
  const obstacles = useAppStore((s) => s.obstacles);
  const [mlModelStatus] = useState<'ready' | 'loading' | 'not-loaded'>('ready');
  const [selectedObstacle, setSelectedObstacle] = useState<string | null>(null);

  const { distance_cm, fall_alert } = caneData.sensors;
  const distanceLevel =
    distance_cm < 50 ? 'danger' : distance_cm < 150 ? 'warning' : 'safe';

  return (
    <div className="obstacle-page">
      {/* Fall Alert */}
      <AnimatePresence>
        {fall_alert && (
          <motion.div
            className="fall-alert-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AlertTriangle size={20} />
            <span>跌倒警报已触发！请立即确认用户安全状态</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="obstacle-grid">
        {/* Distance Monitor */}
        <GlassCard
          title="超声波测距"
          icon={<Crosshair size={18} />}
          accent="#6366f1"
          className="distance-monitor"
        >
          <div className="distance-display">
            <RadialGauge
              value={distance_cm}
              max={400}
              label="前方距离"
              unit="cm"
              color={
                distanceLevel === 'danger'
                  ? '#ef4444'
                  : distanceLevel === 'warning'
                    ? '#f59e0b'
                    : '#10b981'
              }
              size={200}
            />
            <div className="distance-meter">
              <div className="meter-bar">
                <motion.div
                  className={`meter-fill ${distanceLevel}`}
                  animate={{ width: `${Math.min((distance_cm / 400) * 100, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
                <div className="meter-markers">
                  <span className="marker danger-zone">50cm</span>
                  <span className="marker warning-zone">150cm</span>
                  <span className="marker safe-zone">400cm</span>
                </div>
              </div>
              <div className={`distance-status ${distanceLevel}`}>
                {distanceLevel === 'danger' && '🔴 危险距离 - 立即警告'}
                {distanceLevel === 'warning' && '🟡 注意距离 - 减速前行'}
                {distanceLevel === 'safe' && '🟢 安全距离 - 正常通行'}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Video Stream Placeholder */}
        <GlassCard
          title="视频流 & 智能识别"
          icon={<Camera size={18} />}
          accent="#8b5cf6"
          className="video-stream"
          headerRight={
            <div className="ml-status-row">
              <span className={`ml-badge ${mlModelStatus}`}>
                <Cpu size={12} />
                {mlModelStatus === 'ready'
                  ? 'ML 就绪'
                  : mlModelStatus === 'loading'
                    ? '加载中'
                    : '未加载'}
              </span>
            </div>
          }
        >
          <div className="video-container">
            {/* Simulated video frame with detection boxes */}
            <div className="video-frame">
              <div className="video-placeholder">
                <Eye size={48} />
                <p>视频流预览区域</p>
                <small>连接摄像头后将显示实时画面</small>
                <small className="stream-url">{caneData.streams.video_url}</small>
              </div>

              {/* Overlay detection boxes */}
              {obstacles.map((obs) =>
                obs.bbox ? (
                  <motion.div
                    key={obs.id}
                    className={`detection-box ${selectedObstacle === obs.id ? 'selected' : ''}`}
                    style={{
                      left: obs.bbox.x,
                      top: obs.bbox.y,
                      width: obs.bbox.w,
                      height: obs.bbox.h,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSelectedObstacle(obs.id)}
                  >
                    <span className="det-label">
                      {obs.label} {(obs.confidence * 100).toFixed(0)}%
                    </span>
                  </motion.div>
                ) : null
              )}
            </div>

            {/* ML Controls */}
            <div className="ml-controls">
              <button className="ml-btn" title="上传模型">
                <Upload size={16} />
                <span>上传模型</span>
              </button>
              <button className="ml-btn" title="刷新检测">
                <RefreshCw size={16} />
                <span>刷新检测</span>
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Detected obstacles list */}
      <GlassCard
        title="检测结果"
        icon={<Box size={18} />}
        accent="#f59e0b"
        className="detection-results"
      >
        {obstacles.length === 0 ? (
          <div className="empty-state">
            <Eye size={40} />
            <p>等待障碍物检测结果...</p>
            <small>ML 模型将自动分析视频流中的障碍物</small>
          </div>
        ) : (
          <div className="detection-table">
            <div className="det-table-header">
              <span>类型</span>
              <span>距离</span>
              <span>置信度</span>
              <span>位置</span>
            </div>
            {obstacles.map((obs) => (
              <motion.div
                className={`det-table-row ${selectedObstacle === obs.id ? 'selected' : ''}`}
                key={obs.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedObstacle(obs.id)}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <span className="det-type">
                  <AlertTriangle size={14} />
                  {obs.label}
                </span>
                <span
                  className={`det-dist ${obs.distance_cm < 50 ? 'danger' : obs.distance_cm < 150 ? 'warning' : ''}`}
                >
                  {obs.distance_cm} cm
                </span>
                <span className="det-conf">
                  <div className="conf-bar">
                    <motion.div
                      className="conf-fill"
                      animate={{ width: `${obs.confidence * 100}%` }}
                    />
                  </div>
                  {(obs.confidence * 100).toFixed(1)}%
                </span>
                <span className="det-pos">
                  {obs.bbox
                    ? `(${obs.bbox.x}, ${obs.bbox.y})`
                    : '-'}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
