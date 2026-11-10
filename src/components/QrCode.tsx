interface QrCodeProps {
  value: string
  size?: number
  dataUrl?: string
}

export function QrCode({ value, size = 170, dataUrl }: QrCodeProps) {
  return (
    <div
      className="qr flex items-center justify-center"
      role={dataUrl ? 'img' : undefined}
      aria-label={dataUrl ? `QR code for ${value}` : undefined}
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
        <p className="px-2 text-center text-xs text-slate-500">The backend did not provide a QR code.</p>
      )}
    </div>
  )
}
