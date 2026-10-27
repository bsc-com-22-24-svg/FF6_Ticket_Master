import type { ReactNode } from 'react'

interface QuantityStepperProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

export function QuantityStepper({ value, min, max, onChange }: QuantityStepperProps): ReactNode {
  return (
    <div className="stepper" role="group" aria-label="Ticket quantity">
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="stepper-value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}
