import type { Ticket } from './ticketTypes';
import { formatDate, formatMoney } from './ticketFormat';

export function downloadTicketImage(
  ticket: Ticket,
  qrCanvas: HTMLCanvasElement | null,
): void {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 380;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // background + header band
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 800, 380);
  ctx.fillStyle = '#12326b';
  ctx.fillRect(0, 0, 800, 70);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('TICKET MASTER', 32, 35);
  ctx.textBaseline = 'alphabetic';

  // title + venue
  ctx.fillStyle = '#0a1f47';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(ticket.eventTitle, 32, 125, 500);
  ctx.fillStyle = '#64748b';
  ctx.font = '18px sans-serif';
  ctx.fillText(ticket.venue, 32, 155, 500);

  // details
  const lines: [string, string][] = [
    ['Date', formatDate(ticket.date)],
    ['Time', ticket.time],
    ['Ticket', ticket.ticketType],
    ['Entry', ticket.seat],
    ['Price', formatMoney(ticket.price)],
    ['Status', ticket.status],
  ];
  lines.forEach(([label, value], i) => {
    const y = 205 + i * 28;
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(label, 32, y);
    ctx.fillStyle = '#0a1f47';
    ctx.font = '16px sans-serif';
    ctx.fillText(value, 120, y, 380);
  });

  // QR code + ticket id
  if (qrCanvas) {
    ctx.drawImage(qrCanvas, 580, 110, 180, 180);
  }
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ticket.id, 670, 320);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${ticket.id}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
