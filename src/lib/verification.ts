import { api } from './backend';

export type KYCStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';

export interface OrganizerKYC {
  userId: string;
  businessName: string;
  documentType: string;
  documentUrl: string;
  registrationNumber?: string;
  status: KYCStatus;
  reviewerNotes?: string | null;
  submittedAt?: string;
  reviewedAt?: string | null;
  isVerified?: boolean;
}

export interface SubmitKycInput {
  businessName: string;
  documentType: string;
  documentUrl: string;
  registrationNumber?: string;
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
  businessName?: string;
  documentType?: string;
  documentUrl?: string;
  registrationNumber?: string | null;
  status: string;
  reviewerNotes?: string | null;
  submittedAt?: string;
  reviewedAt?: string | null;
  isVerified?: boolean;
}

function mapStatus(remote: BackendKyc): KYCStatus {
  if (remote.status === 'APPROVED' || remote.isVerified) return 'Verified';
  if (remote.status === 'PENDING') return 'Pending';
  if (remote.status === 'REJECTED') return 'Rejected';
  return 'Unverified';
}

function toKyc(userId: string, remote: BackendKyc): OrganizerKYC {
  return {
    userId,
    businessName: remote.businessName ?? '',
    documentType: remote.documentType ?? '',
    documentUrl: remote.documentUrl ?? '',
    registrationNumber: remote.registrationNumber ?? undefined,
    status: mapStatus(remote),
    reviewerNotes: remote.reviewerNotes ?? null,
    submittedAt: remote.submittedAt,
    reviewedAt: remote.reviewedAt ?? null,
    isVerified: remote.isVerified ?? remote.status === 'APPROVED',
  };
}

function emptyKyc(userId: string): OrganizerKYC {
  return {
    userId,
    businessName: '',
    documentType: 'National ID',
    documentUrl: '',
    status: 'Unverified',
  };
}

async function fetchBackendKyc(): Promise<BackendKyc | null> {
  return api<BackendKyc | null>('/organizers/me/kyc');
}

export async function fetchMyKyc(userId: string): Promise<OrganizerKYC> {
  const remote = await fetchBackendKyc();
  return remote ? toKyc(userId, remote) : emptyKyc(userId);
}

export async function syncKyc(userId: string): Promise<OrganizerKYC | null> {
  const remote = await fetchBackendKyc();
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

export async function submitKyc(userId: string, input: SubmitKycInput): Promise<OrganizerKYC> {
  const remote = await api<BackendKyc>('/organizers/me/kyc', { method: 'POST', body: input });
  const kyc = toKyc(userId, remote);
  saveKYC(kyc);
  return kyc;
}
