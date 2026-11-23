import { api } from './backend';

export type KYCStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';

export interface OrganizerKYC {
  userId: string;
  businessName: string;
  documentType: string;
  documentUrl: string;
  status: KYCStatus;
  submittedAt?: string;
}

const KYC_KEY = 'tm.ticket-master.kyc';

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getKYC(userId: string): OrganizerKYC | null {
  if (!hasStorage()) return null;
  const raw = window.localStorage.getItem(KYC_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OrganizerKYC[];
    return parsed.find((k) => k.userId === userId) ?? null;
  } catch {
    return null;
  }
}

export function saveKYC(data: OrganizerKYC): void {
  if (!hasStorage()) return;
  const raw = window.localStorage.getItem(KYC_KEY);
  let parsed: OrganizerKYC[] = [];
  if (raw) {
    try { parsed = JSON.parse(raw) as OrganizerKYC[]; } catch {}
  }
  const existingIndex = parsed.findIndex((k) => k.userId === data.userId);
  if (existingIndex >= 0) {
    parsed[existingIndex] = data;
  } else {
    parsed.push(data);
  }
  window.localStorage.setItem(KYC_KEY, JSON.stringify(parsed));
}

export function listAllKYC(): OrganizerKYC[] {
  if (!hasStorage()) return [];
  const raw = window.localStorage.getItem(KYC_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as OrganizerKYC[]; } catch { return []; }
}

interface BackendKyc {
  businessName: string;
  documentType: string;
  documentUrl: string;
  status: string;
  submittedAt?: string;
}

function toKyc(userId: string, remote: BackendKyc): OrganizerKYC {
  return {
    userId,
    businessName: remote.businessName,
    documentType: remote.documentType,
    documentUrl: remote.documentUrl,
    status: remote.status as KYCStatus,
    submittedAt: remote.submittedAt,
  };
}

// The backend keeps the organizer's details. This copies them into the browser, so the
// route guards (which read getKYC) work without waiting for the network.
export async function syncKyc(userId: string): Promise<OrganizerKYC | null> {
  const remote = await api<BackendKyc | null>('/organizers/me/kyc');
  if (!remote) {
    if (hasStorage()) {
      const kept = listAllKYC().filter((k) => k.userId !== userId);
      window.localStorage.setItem(KYC_KEY, JSON.stringify(kept));
    }
    return null;
  }
  const kyc = toKyc(userId, remote);
  saveKYC(kyc);
  return kyc;
}

export async function submitKyc(
  userId: string,
  input: { businessName: string; documentType: string; documentUrl: string },
): Promise<OrganizerKYC> {
  const remote = await api<BackendKyc>('/organizers/me/kyc', { method: 'POST', body: input });
  const kyc = toKyc(userId, remote);
  saveKYC(kyc);
  return kyc;
}
