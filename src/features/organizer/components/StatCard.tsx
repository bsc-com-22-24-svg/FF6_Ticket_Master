import React, { isValidElement, type ReactNode } from 'react'

interface StatCardProps {
  label?: string
  title?: string
  value: string | number
  detail?: string
  icon?: ReactNode | React.ComponentType<{ size?: number }> | string
  color?: string
}

export function StatCard({ label, title, value, detail, icon, color }: StatCardProps) {
  // Support both `label` (new) and `title` (old)
  const displayLabel = label ?? title ?? ''

  // Determine how to render the icon safely
  let renderedIcon: ReactNode = null

  if (icon) {
    // 1. If it's a plain element (e.g. <ShieldAlert />) → render as-is
    if (isValidElement(icon)) {
      renderedIcon = icon
    }
    // 2. If it's a string (e.g. emoji) → wrap in a span
    else if (typeof icon === 'string') {
      renderedIcon = <span aria-hidden="true">{icon}</span>
    }
    // 3. If it's a component reference (e.g. ShieldAlert) → call it correctly
    else if (typeof icon === 'function') {
      const Icon = icon as React.ComponentType<{ size?: number }>
      renderedIcon = <Icon size={19} />
    }
  }

  return (
    <article className="stat-card">
      <div className="stat-info">
        <span className="stat-title">{displayLabel}</span>
        <span className="stat-value">{value}</span>
        {detail && <small className="stat-detail">{detail}</small>}
      </div>
      {renderedIcon && (
        <span className="stat-icon" style={{ color }}>
          {renderedIcon}
        </span>
      )}
    </article>
  )
}

export default StatCard
