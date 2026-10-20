export type KYCStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';

export interface OrganizerKYC {
  userId: string;
  businessName: string;
  phoneNumber: string;
  nationalId: string;
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
