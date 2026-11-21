import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveEventImage, DEFAULT_EVENT_IMAGES } from './backendEvents'
import { uploadEventImage } from './backendOrganizer'

describe('resolveEventImage', () => {
  it('serves an uploaded image through the backend proxy', () => {
    expect(resolveEventImage('/uploads/a.png', '7')).toBe('/be/uploads/a.png')
  })

  it('keeps a bundled default and an external link as they are', () => {
    expect(resolveEventImage('/images/events/event-2.jpg', '7')).toBe('/images/events/event-2.jpg')
    expect(resolveEventImage('https://x.com/a.jpg', '7')).toBe('https://x.com/a.jpg')
  })

  it('falls back to a default, including for non-numeric ids, without always using the first', () => {
    expect(DEFAULT_EVENT_IMAGES).toContain(resolveEventImage(null, '7'))
    const picks = new Set(['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot'].map((id) => resolveEventImage(undefined, id)))
    expect(picks.size).toBeGreaterThan(1)
    expect(resolveEventImage(null, 'alpha')).toBe(resolveEventImage(null, 'alpha'))
  })
})

describe('uploadEventImage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('rejects a file that is not a picture, before sending anything', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(uploadEventImage(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).rejects.toThrow(/JPG, PNG or WEBP/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns the path the backend saved', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ imageUrl: '/uploads/z.png' }), { status: 201 })))
    await expect(uploadEventImage(new File(['x'], 'a.png', { type: 'image/png' }))).resolves.toBe('/uploads/z.png')
  })

  it('shows the backend message when the upload is refused', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'The image must be a JPG, PNG or WEBP file' }), { status: 400 })))
    await expect(uploadEventImage(new File(['x'], 'a.png', { type: 'image/png' }))).rejects.toThrow('JPG, PNG or WEBP file')
  })
})
