import { api } from "./backend";

export type BackendRole = "ATTENDEE" | "ORGANIZER" | "CHECK_IN_STAFF" | "ADMIN";

interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: BackendRole;
  isActive: boolean;
  createdAt: string;
}

interface BackendUsersPage {
  data: BackendUser[];
  totalPages: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "organizer" | "staff" | "admin";
  status: "active" | "disabled";
  createdAt: string;
  organizerId?: string;
  assignedEventIds: string[];
}

export interface OrganizerKyc {
  userId: string;
  businessName: string;
  phoneNumber: string;
  nationalId: string;
  status: "Unverified" | "Pending" | "Verified" | "Rejected";
  submittedAt?: string;
}

const ROLE_MAP: Record<BackendRole, AdminUser["role"]> = {
  ATTENDEE: "customer",
  ORGANIZER: "organizer",
  CHECK_IN_STAFF: "staff",
  ADMIN: "admin",
};

function toAdminUser(user: BackendUser): AdminUser {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: ROLE_MAP[user.role],
    status: user.isActive ? "active" : "disabled",
    createdAt: user.createdAt,
    assignedEventIds: [],
  };
}

export async function listBackendUsers(): Promise<AdminUser[]> {
  const users: BackendUser[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await api<BackendUsersPage>(`/users?page=${page}&limit=100`);
    users.push(...result.data);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);

  return users.map(toAdminUser);
}

export async function updateBackendUserStatus(
  userId: string,
  status: AdminUser["status"],
): Promise<void> {
  await api(`/users/${encodeURIComponent(userId)}/active`, {
    method: "PATCH",
    body: { isActive: status === "active" },
  });
}

export async function createBackendUser(input: {
  name: string;
  email: string;
  password: string;
  role: AdminUser["role"];
  organizerId?: string;
  actorPassword?: string;
}): Promise<void> {
  const role: Record<AdminUser["role"], BackendRole> = {
    customer: "ATTENDEE",
    organizer: "ORGANIZER",
    staff: "CHECK_IN_STAFF",
    admin: "ADMIN",
  };
  await api("/users", {
    method: "POST",
    body: {
      ...input,
      role: role[input.role],
      organizerId: input.role === "staff" ? input.organizerId : undefined,
      actorPassword: input.role === "admin" ? input.actorPassword : undefined,
    },
  });
}

export async function deactivateBackendUser(userId: string): Promise<void> {
  await api(`/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
}

export async function getOrganizerKyc(
  userId: string,
): Promise<OrganizerKyc | null> {
  return api<OrganizerKyc | null>(
    `/organizers/${encodeURIComponent(userId)}/kyc`,
  );
}

export interface BackendStaffMember {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  assignedEventIds: string[];
}

export async function listOrganizerStaff(): Promise<BackendStaffMember[]> {
  return api<BackendStaffMember[]>("/organizers/me/staff");
}
