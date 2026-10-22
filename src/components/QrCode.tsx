import { QRCodeCanvas } from 'qrcode.react'
import type { Ref } from 'react'

interface QrCodeProps {
  value: string
  size?: number
  canvasRef?: Ref<HTMLCanvasElement>
}

export function QrCode({ value, size = 170, canvasRef }: QrCodeProps) {
  return (
    <div
      className="qr"
      role="img"
      aria-label={`QR code for ${value}`}
      style={{ width: size + 18 }}
    >
      <QRCodeCanvas
        ref={canvasRef}
        value={`TICKET:${value}`}
        size={size}
        level="M"
      />
    </div>
  )
}
