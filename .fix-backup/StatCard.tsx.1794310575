import React from 'react';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <span className="stat-title">{title}</span>
        <span className="stat-value">{value}</span>
      </div>
      {icon && <span className="stat-icon" style={{ color: color }}>{icon}</span>}
    </div>
  );
};
