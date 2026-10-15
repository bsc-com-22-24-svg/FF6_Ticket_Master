import { SERVICE_FEE } from './mockData'

export interface OrderTotals {
  subtotal: number
  serviceFee: number
  total: number
}

export function formatKwacha(amount: number): string {
  return `MK${Math.round(amount).toLocaleString('en-US')}`
}

export function calculateTotals(
  price: number,
  quantity: number,
  serviceFee: number = SERVICE_FEE,
): OrderTotals {
  const subtotal = price * quantity
  return { subtotal, serviceFee, total: subtotal + serviceFee }
}
