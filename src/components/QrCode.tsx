import { QRCodeCanvas } from 'qrcode.react'
import { useMemo, type Ref } from 'react'
import { ticketQrValue } from '../lib/tickets'

interface QrCodeProps {
  value: string
  size?: number
  canvasRef?: Ref<HTMLCanvasElement>
}

export function QrCode({ value, size = 170, canvasRef }: QrCodeProps) {
  // the code holds the ticket id plus its security tag
  const qrValue = useMemo(() => ticketQrValue(value), [value])

  return (
    <div
      className="qr"
      role="img"
      aria-label={`QR code for ${value}`}
      style={{ width: size + 18 }}
    >
      <QRCodeCanvas
        ref={canvasRef}
        value={qrValue}
        size={size}
        level="M"
      />
    </div>
  )
}
