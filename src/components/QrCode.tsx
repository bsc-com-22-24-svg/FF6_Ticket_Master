import { QRCodeCanvas } from 'qrcode.react'
import { useMemo, type Ref } from 'react'
import { ticketQrValue } from '../lib/tickets'

interface QrCodeProps {
  value: string
  size?: number
  canvasRef?: Ref<HTMLCanvasElement>
  dataUrl?: string
}

export function QrCode({ value, size = 170, canvasRef, dataUrl }: QrCodeProps) {
  // the code holds the ticket id plus its security tag
  const qrValue = useMemo(() => ticketQrValue(value), [value])

  return (
    <div
      className="qr"
      role="img"
      aria-label={`QR code for ${value}`}
      style={{ width: size + 18 }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          width={size}
          height={size}
          alt=""
          style={{ width: size, height: size, objectFit: 'contain' }}
        />
      ) : (
        <QRCodeCanvas
          ref={canvasRef}
          value={qrValue}
          size={size}
          level="M"
        />
      )}
    </div>
  )
}
