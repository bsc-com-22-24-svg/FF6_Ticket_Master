import { describe, expect, it } from 'vitest'
import { hmacSha256Hex, isValidTicketTag, signTicket } from './ticketSignature'

describe('hmacSha256Hex', () => {
  // test vectors from RFC 4231
  it('matches RFC 4231 test case 1', () => {
    expect(hmacSha256Hex('\x0b'.repeat(20), 'Hi There')).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
    )
  })

  it('matches RFC 4231 test case 2', () => {
    expect(hmacSha256Hex('Jefe', 'what do ya want for nothing?')).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    )
  })

  it('matches the browser crypto for different lengths and long keys', async () => {
    const cases: [string, string][] = [
      ['k', ''],
      ['secret', 'a'],
      ['secret', 'x'.repeat(55)],
      ['secret', 'x'.repeat(56)],
      ['secret', 'x'.repeat(64)],
      ['secret', 'x'.repeat(200)],
      ['L'.repeat(100), 'message with unicode: Chimwemwe Banda - Lilongwe'],
    ]
    for (const [key, message] of cases) {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(key),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      )
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
      const expected = Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('')
      expect(hmacSha256Hex(key, message)).toBe(expected)
    }
  })
})

describe('signTicket', () => {
  it('makes a 10 character tag that is stable for the same ticket', () => {
    const tag = signTicket('TM-2026-ABCDEFGHJKLM', 'lake-of-stars')
    expect(tag).toMatch(/^[0-9A-F]{10}$/)
    expect(signTicket('TM-2026-ABCDEFGHJKLM', 'lake-of-stars')).toBe(tag)
    expect(signTicket('tm-2026-abcdefghjklm', 'lake-of-stars')).toBe(tag)
  })

  it('changes when the ticket id or the event changes', () => {
    const tag = signTicket('TM-2026-ABCDEFGHJKLM', 'lake-of-stars')
    expect(signTicket('TM-2026-ABCDEFGHJKLN', 'lake-of-stars')).not.toBe(tag)
    expect(signTicket('TM-2026-ABCDEFGHJKLM', 'dev-summit')).not.toBe(tag)
  })

  it('only accepts the matching tag', () => {
    const tag = signTicket('TM-2026-ABCDEFGHJKLM', 'lake-of-stars')
    expect(isValidTicketTag('TM-2026-ABCDEFGHJKLM', 'lake-of-stars', tag)).toBe(true)
    expect(isValidTicketTag('TM-2026-ABCDEFGHJKLM', 'lake-of-stars', tag.toLowerCase())).toBe(true)
    expect(isValidTicketTag('TM-2026-ABCDEFGHJKLM', 'lake-of-stars', '0000000000')).toBe(false)
    expect(isValidTicketTag('TM-2026-ABCDEFGHJKLM', 'lake-of-stars', '')).toBe(false)
    expect(isValidTicketTag('TM-2026-ABCDEFGHJKLM', 'lake-of-stars', tag + '0')).toBe(false)
  })
})
