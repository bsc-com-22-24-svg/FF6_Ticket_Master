import type { TicketRecord } from '../../lib/tickets'

export function formatTicketDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function downloadTicketImage(
  ticket: TicketRecord,
  qrCanvas: HTMLCanvasElement | null,
): void {
  if (!qrCanvas) return

  const canvas = document.createElement('canvas')
  canvas.width = 1000
  canvas.height = 420
  const context = canvas.getContext('2d')
  if (!context) return

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#d9e2ef'
  context.lineWidth = 2
  context.beginPath()
  context.roundRect(1, 1, 998, 418, 20)
  context.stroke()

  context.fillStyle = '#dcfce7'
  context.beginPath()
  context.roundRect(32, 28, 82, 30, 15)
  context.fill()
  context.fillStyle = '#15803d'
  context.font = 'bold 16px sans-serif'
  context.textBaseline = 'middle'
  context.fillText(ticket.status === 'valid' ? 'Valid' : 'Used', 73, 43, 68)

  context.textBaseline = 'alphabetic'
  context.fillStyle = '#0a1f47'
  context.font = 'bold 30px sans-serif'
  context.fillText(ticket.eventName, 32, 104, 540)
  context.fillStyle = '#64748b'
  context.font = '20px sans-serif'
  context.fillText(`${ticket.venue}, ${ticket.city}`, 32, 136, 540)

  const details = [
    ['Date', formatTicketDate(ticket.date), 32, 190],
    ['Time', ticket.time, 350, 190],
    ['Ticket', ticket.ticketType, 32, 254],
    ['Entry', `${ticket.ticketType} Admission`, 350, 254],
    ['Price', `MK ${Math.round(ticket.price).toLocaleString('en-US')}`, 32, 318],
    ['Holder', ticket.holder, 350, 318],
  ] as const

  for (const [label, value, x, y] of details) {
    context.fillStyle = '#64748b'
    context.font = '16px sans-serif'
    context.fillText(label, x, y)
    context.fillStyle = '#0a1f47'
    context.font = 'bold 18px sans-serif'
    context.fillText(value, x, y + 23, 260)
  }

  context.strokeStyle = '#d9e2ef'
  context.setLineDash([5, 4])
  context.beginPath()
  context.roundRect(690, 48, 270, 324, 18)
  context.stroke()
  context.setLineDash([])
  context.drawImage(qrCanvas, 735, 68, 180, 180)
  context.fillStyle = '#0a1f47'
  context.textAlign = 'center'
  context.font = 'bold 17px sans-serif'
  context.fillText(ticket.id, 825, 280)
  context.fillStyle = '#64748b'
  context.font = '15px sans-serif'
  context.fillText('Show this code at the entrance', 825, 307)
  context.textAlign = 'start'

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${ticket.id}.png`
    link.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}