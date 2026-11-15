interface QrCodeProps {
  value: string
  size?: number
  dataUrl?: string
}

// The QR image is issued by the backend, which keeps the secret behind it.
export function QrCode({ value, size = 170, dataUrl }: QrCodeProps) {
  return (
    <div className="qr" role="img" aria-label={`QR code for ${value}`} style={{ width: size + 18 }}>
      {dataUrl ? (
        <img
          src={dataUrl}
          width={size}
          height={size}
          alt=""
          style={{ width: size, height: size, objectFit: 'contain' }}
        />
      ) : (
        <p style={{ fontSize: 12, textAlign: 'center' }}>QR code unavailable</p>
      )}
    </div>
  )
}
