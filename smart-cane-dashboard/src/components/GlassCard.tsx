import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: string;
  headerRight?: ReactNode;
}

export default function GlassCard({
  title,
  icon,
  children,
  className = '',
  accent,
  headerRight,
}: Props) {
  return (
    <motion.div
      className={`glass-card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={accent ? { borderTop: `3px solid ${accent}` } : undefined}
    >
      <div className="glass-card-header">
        <div className="glass-card-title">
          {icon && <span className="card-icon">{icon}</span>}
          <h3>{title}</h3>
        </div>
        {headerRight && <div className="card-header-right">{headerRight}</div>}
      </div>
      <div className="glass-card-body">{children}</div>
    </motion.div>
  );
}
