import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchMyKyc, submitKyc } from './verification'

function stubResponse(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => new Response(
    JSON.stringify(body),
    { status, headers: { 'Content-Type': 'application/json' } },
  ))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

describe('verification API', () => {
  it('maps a pending backend submission to the pending UI status', async () => {
    stubResponse({
      kycId: '3',
      businessName: 'Nyasa Events',
      documentType: 'National ID',
      documentUrl: 'https://example.com/id.pdf',
      status: 'PENDING',
    })

    const kyc = await fetchMyKyc('8')

    expect(kyc.status).toBe('Pending')
    expect(kyc.businessName).toBe('Nyasa Events')
  })

  it('submits the registration number with the KYC details', async () => {
    const fetchMock = stubResponse({ status: 'PENDING' }, 201)

    await submitKyc('8', {
      businessName: 'Nyasa Events',
      registrationNumber: 'REG-2026-88412',
      documentType: 'Business registration',
      documentUrl: 'https://example.com/reg.pdf',
    })

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({
      businessName: 'Nyasa Events',
      registrationNumber: 'REG-2026-88412',
      documentType: 'Business registration',
      documentUrl: 'https://example.com/reg.pdf',
    })
  })
})
