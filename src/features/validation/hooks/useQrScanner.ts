import { useCallback, useEffect, useRef, useState } from 'react'

interface DetectedBarcode {
  rawValue: string
}

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike
}

export type QrScannerStatus =
  | 'idle'
  | 'starting'
  | 'scanning'
  | 'unsupported'
  | 'denied'
  | 'error'

const SCAN_INTERVAL_MS = 400
const REPEAT_COOLDOWN_MS = 2500

function getBarcodeDetectorConstructor(): BarcodeDetectorConstructor | undefined {
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
}

export function useQrScanner(onDetected: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BarcodeDetectorLike | null>(null)
  const timerRef = useRef<number | null>(null)
  const lastCodeRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })
  const onDetectedRef = useRef(onDetected)

  const [status, setStatus] = useState<QrScannerStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    detectorRef.current = null
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    setError(null)

    const Detector = getBarcodeDetectorConstructor()
    if (!Detector) {
      setStatus('unsupported')
      setError('QR scanning is not supported in this browser. Enter the ticket ID manually below.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      setError('Camera access is not available here. Enter the ticket ID manually below.')
      return
    }

    setStatus('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream

      const video = videoRef.current
      if (!video) {
        stop()
        return
      }
      video.srcObject = stream
      await video.play()

      detectorRef.current = new Detector({ formats: ['qr_code'] })
      setStatus('scanning')

      timerRef.current = window.setInterval(async () => {
        const currentVideo = videoRef.current
        const detector = detectorRef.current
        if (!currentVideo || !detector || currentVideo.readyState < 2) return
        try {
          const codes = await detector.detect(currentVideo)
          const value = codes[0]?.rawValue?.trim()
          if (!value) return
          const now = Date.now()
          if (value === lastCodeRef.current.code && now - lastCodeRef.current.at < REPEAT_COOLDOWN_MS) {
            return
          }
          lastCodeRef.current = { code: value, at: now }
          onDetectedRef.current(value)
        } catch {
          // Ignore transient decoding errors and keep scanning.
        }
      }, SCAN_INTERVAL_MS)
    } catch (caught) {
      stop()
      const denied = caught instanceof DOMException && caught.name === 'NotAllowedError'
      setStatus(denied ? 'denied' : 'error')
      setError(
        denied
          ? 'Camera permission was denied. Enter the ticket ID manually below.'
          : 'Could not start the camera. Enter the ticket ID manually below.',
      )
    }
  }, [stop])

  useEffect(() => stop, [stop])

  return { videoRef, status, error, start, stop }
}
