import type { TicketRecord } from '../../lib/tickets'
import type { Ticket, TicketStatus } from './ticketTypes'
import { formatDate, formatMoney } from './ticketFormat'

// One normalised shape used by both call sites (My Tickets and checkout).
export interface TicketImageData {
  id: string
  eventTitle: string
  venue: string
  city: string
  date: string
  time: string
  ticketType: string
  entry: string
  price: number
  holder: string
  status: TicketStatus
}

export function ticketFromRecord(record: TicketRecord): TicketImageData {
  return {
    id: record.id,
    eventTitle: record.eventName,
    venue: record.venue,
    city: record.city,
    date: record.date,
    time: record.time,
    ticketType: record.ticketType,
    entry: `${record.ticketType} Admission`,
    price: record.price,
    holder: record.holder,
    status: record.status,
  }
}

export function ticketFromView(ticket: Ticket): TicketImageData {
  return {
    id: ticket.id,
    eventTitle: ticket.eventTitle,
    venue: ticket.venue,
    city: ticket.city,
    date: ticket.date,
    time: ticket.time,
    ticketType: ticket.ticketType,
    // Keep this identical to ticketFromRecord so both download paths match.
    entry: `${ticket.ticketType} Admission`,
    price: ticket.price,
    holder: ticket.holder,
    status: ticket.status,
  }
}

// Logical size of the ticket card. It is rendered at 2x so the PNG stays
// crisp on phones and high-DPI displays.
export const TICKET_IMAGE_WIDTH = 1000
export const TICKET_IMAGE_HEIGHT = 420
export const TICKET_IMAGE_SCALE = 2

type CanvasFactory = (width: number, height: number) => HTMLCanvasElement

interface RenderOptions {
  scale?: number
  createCanvas?: CanvasFactory
}

function createCanvasElement(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
}

export function renderTicketImage(
  ticket: TicketImageData,
  qrCanvas: HTMLCanvasElement | null,
  options: RenderOptions = {},
): HTMLCanvasElement | null {
  const scale = options.scale ?? TICKET_IMAGE_SCALE
  const createCanvas = options.createCanvas ?? createCanvasElement
  const canvas = createCanvas(
    Math.round(TICKET_IMAGE_WIDTH * scale),
    Math.round(TICKET_IMAGE_HEIGHT * scale),
  )
  const context = canvas.getContext('2d')
  if (!context) return null

  // Draw in logical units; the scale handles high-DPI output.
  context.scale(scale, scale)

  // Card background and border
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, TICKET_IMAGE_WIDTH, TICKET_IMAGE_HEIGHT)
  context.strokeStyle = '#d9e2ef'
  context.lineWidth = 2
  roundRect(context, 1, 1, TICKET_IMAGE_WIDTH - 2, TICKET_IMAGE_HEIGHT - 2, 20)
  context.stroke()

  // Navy header band, clipped to the rounded card
  context.save()
  roundRect(context, 1, 1, TICKET_IMAGE_WIDTH - 2, TICKET_IMAGE_HEIGHT - 2, 20)
  context.clip()
  context.fillStyle = '#12326b'
  context.fillRect(0, 0, TICKET_IMAGE_WIDTH, 70)
  context.restore()

  context.fillStyle = '#ffffff'
  context.font = 'bold 24px sans-serif'
  context.textBaseline = 'middle'
  context.fillText('TICKET MASTER', 32, 36)

  // Status badge
  const valid = ticket.status === 'valid'
  context.fillStyle = valid ? '#dcfce7' : '#e2e8f0'
  roundRect(context, 834, 20, 134, 32, 16)
  context.fill()
  context.fillStyle = valid ? '#15803d' : '#475569'
  context.font = 'bold 16px sans-serif'
  context.textAlign = 'center'
  context.fillText(valid ? 'Valid' : 'Used', 901, 37)
  context.textAlign = 'start'
  context.textBaseline = 'alphabetic'

  // Event title and place
  context.fillStyle = '#0a1f47'
  context.font = 'bold 30px sans-serif'
  context.fillText(ticket.eventTitle, 32, 132, 600)
  context.fillStyle = '#64748b'
  context.font = '20px sans-serif'
  context.fillText(`${ticket.venue}, ${ticket.city}`, 32, 164, 600)

  // Details grid: date/time/ticket then entry/price/holder
  const details: Array<[string, string, number, number, number]> = [
    ['Date', formatDate(ticket.date), 32, 222, 190],
    ['Time', ticket.time, 250, 222, 170],
    ['Ticket', ticket.ticketType, 448, 222, 200],
    ['Entry', ticket.entry, 32, 300, 190],
    ['Price', formatMoney(ticket.price), 250, 300, 170],
    ['Holder', ticket.holder, 448, 300, 200],
  ]

  for (const [label, value, x, y, maxWidth] of details) {
    context.fillStyle = '#64748b'
    context.font = '16px sans-serif'
    context.fillText(label, x, y)
    context.fillStyle = '#0a1f47'
    context.font = 'bold 18px sans-serif'
    context.fillText(value, x, y + 24, maxWidth)
  }

  // QR panel
  context.strokeStyle = '#d9e2ef'
  context.lineWidth = 2
  context.setLineDash([6, 5])
  roundRect(context, 690, 40, 270, 340, 18)
  context.stroke()
  context.setLineDash([])

  if (qrCanvas) {
    context.drawImage(qrCanvas, 735, 66, 180, 180)
  }

  context.textAlign = 'center'
  context.fillStyle = '#0a1f47'
  context.font = 'bold 17px sans-serif'
  context.fillText(ticket.id, 825, 278, 240)
  context.fillStyle = '#64748b'
  context.font = '15px sans-serif'
  context.fillText('Show this code at the entrance', 825, 306, 240)
  context.textAlign = 'start'

  return canvas
}

export function ticketImageBlob(
  ticket: TicketImageData,
  qrCanvas: HTMLCanvasElement | null,
  options: RenderOptions = {},
): Promise<Blob | null> {
  const canvas = renderTicketImage(ticket, qrCanvas, options)
  if (!canvas) return Promise.resolve(null)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

export async function downloadTicketImage(
  ticket: TicketImageData,
  qrCanvas: HTMLCanvasElement | null,
): Promise<void> {
  const blob = await ticketImageBlob(ticket, qrCanvas)
  if (!blob) return

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${ticket.id}.png`
  link.click()
  URL.revokeObjectURL(url)
}
