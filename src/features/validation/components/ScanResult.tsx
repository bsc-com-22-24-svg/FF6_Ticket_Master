import type { ReactNode } from 'react'
import type { TicketValidationResult } from '../../../lib/tickets'

const ICONS: Record<TicketValidationResult['status'], string> = {
  valid: '✓',
  invalid: '✕',
  used: '✕',
  wrong_event: '✕',
}

interface ScanResultProps {
  result: TicketValidationResult
  compact?: boolean
}

export function ScanResult({ result, compact = false }: ScanResultProps): ReactNode {
  const positive = result.status === 'valid'
  return (
    <div className={`result ${result.status}${compact ? ' result-compact' : ''}`}>
      <span className={positive ? 'ok' : 'bad'} style={{ fontSize: compact ? 14 : 20 }}>
        {ICONS[result.status]} {result.title}
      </span>
      <p className="m" style={{ marginTop: 4 }}>
        {result.message}
      </p>
    </div>
  )
}
