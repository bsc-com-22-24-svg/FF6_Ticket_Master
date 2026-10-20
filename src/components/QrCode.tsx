const SIZE = 21

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function makeRandom(seed: number): () => number {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function isFinderCell(row: number, column: number): boolean {
  const origins = [
    [0, 0],
    [0, SIZE - 7],
    [SIZE - 7, 0],
  ]

  return origins.some(([top, left]) => {
    const localRow = row - top
    const localColumn = column - left
    if (localRow < 0 || localRow > 6 || localColumn < 0 || localColumn > 6) return false
    const border =
      localRow === 0 || localRow === 6 || localColumn === 0 || localColumn === 6
    const core = localRow >= 2 && localRow <= 4 && localColumn >= 2 && localColumn <= 4
    return border || core
  })
}

function isReserved(row: number, column: number): boolean {
  return (
    (row < 8 && column < 8) ||
    (row < 8 && column >= SIZE - 8) ||
    (row >= SIZE - 8 && column < 8)
  )
}

function buildMatrix(value: string): boolean[] {
  const random = makeRandom(hashString(value))
  const cells: boolean[] = []

  for (let row = 0; row < SIZE; row += 1) {
    for (let column = 0; column < SIZE; column += 1) {
      if (isFinderCell(row, column)) {
        cells.push(true)
      } else if (isReserved(row, column)) {
        cells.push(false)
      } else {
        cells.push(random() > 0.5)
      }
    }
  }

  return cells
}

interface QrCodeProps {
  value: string
  size?: number
}

export function QrCode({ value, size = 170 }: QrCodeProps) {
  const cells = buildMatrix(value)
  return (
    <div
      className="qr"
      role="img"
      aria-label={`QR code for ${value}`}
      style={{ width: size }}
    >
      {cells.map((filled, index) => (
        <i key={index} className={filled ? 'k' : ''} />
      ))}
    </div>
  )
}
