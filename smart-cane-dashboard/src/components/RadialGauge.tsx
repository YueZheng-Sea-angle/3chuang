import { motion } from 'framer-motion';

interface Props {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  warningThreshold?: number;
  dangerThreshold?: number;
  size?: number;
}

export default function RadialGauge({
  value,
  max,
  label,
  unit,
  color,
  warningThreshold,
  dangerThreshold,
  size = 160,
}: Props) {
  const ratio = Math.min(value / max, 1);
  const circumference = 2 * Math.PI * 60;
  const offset = circumference * (1 - ratio);

  let gaugeColor = color;
  if (dangerThreshold && value <= dangerThreshold) gaugeColor = '#ef4444';
  else if (warningThreshold && value <= warningThreshold) gaugeColor = '#f59e0b';

  return (
    <div className="radial-gauge" style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" className="gauge-svg">
        <circle
          cx="70"
          cy="70"
          r="60"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
        />
        <motion.circle
          cx="70"
          cy="70"
          r="60"
          fill="none"
          stroke={gaugeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          transform="rotate(-90 70 70)"
          style={{ filter: `drop-shadow(0 0 6px ${gaugeColor}60)` }}
        />
      </svg>
      <div className="gauge-text">
        <motion.span
          className="gauge-value"
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {value}
        </motion.span>
        <span className="gauge-unit">{unit}</span>
        <span className="gauge-label">{label}</span>
      </div>
    </div>
  );
}
