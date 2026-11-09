import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Power, Trash2, Eye, UserPlus } from "lucide-react";
import { useAuth } from "../../authentication";
import type {
  AccountStatus,
  ManagedUser,
  Role,
} from "../../authentication/authStore";
import {
  deactivateBackendUser,
  createBackendUser,
  getOrganizerKyc,
  listBackendUsers,
  updateBackendUserStatus,
} from "../../../lib/backendAdmin";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { useToast } from "../../toast";

const PAGE_SIZE = 8;
const ROLES: Role[] = ["customer", "organizer", "staff", "admin"];
const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "customer" as Role,
  organizerId: "",
  actorPassword: "",
};
const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function Activity({ target }: { target: ManagedUser }) {
  const kyc = useQuery({
    queryKey: ["organizer-kyc-admin", target.id],
    queryFn: () => getOrganizerKyc(target.id),
    enabled: target.role === "organizer",
  });
  const rows: [string, string][] =
    target.role === "organizer"
      ? [
          [
            "Verification",
            kyc.isLoading
              ? "Loading..."
              : kyc.error
                ? "Unavailable"
                : (kyc.data?.status ?? "Unverified"),
          ],
        ]
      : [];

  return (
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd className="font-semibold text-navy-dark">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function UserManagement() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [status, setStatus] = useState<AccountStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [createError, setCreateError] = useState("");
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: listBackendUsers,
  });
  const everyone = users.data ?? [];
  const organizers = everyone.filter((account) => account.role === "organizer");
  const refreshUsers = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  const changeStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: AccountStatus }) =>
      updateBackendUserStatus(id, next),
    onSuccess: async (_result, variables) => {
      await refreshUsers();
      showToast(
        variables.next === "active" ? "Account enabled" : "Account disabled",
        "success",
      );
    },
    onError: (reason) =>
      showToast(
        reason instanceof Error ? reason.message : "Something went wrong",
        "error",
      ),
  });
  const deactivate = useMutation({
    mutationFn: deactivateBackendUser,
    onSuccess: async () => {
      await refreshUsers();
      setDeleting(null);
      showToast("Account deactivated", "success");
    },
    onError: (reason) =>
      showToast(
        reason instanceof Error ? reason.message : "Something went wrong",
        "error",
      ),
  });
  const create = useMutation({
    mutationFn: () =>
      createBackendUser({
        ...form,
        organizerId: form.organizerId || undefined,
      }),
    onSuccess: async () => {
      await refreshUsers();
      setCreating(false);
      setForm(emptyForm);
      setCreateError("");
      showToast("Account created", "success");
    },
    onError: (reason) =>
      setCreateError(
        reason instanceof Error
          ? reason.message
          : "Could not create the account.",
      ),
  });

  const q = search.trim().toLowerCase();
  const filtered = everyone
    .filter(
      (u) =>
        (role === "all" || u.role === role) &&
        (status === "all" || u.status === status),
    )
    .filter(
      (u) =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE,
  );

  if (!user) return null;

  function submitCreate(event: FormEvent) {
    event.preventDefault();
    setCreateError("");
    create.mutate();
  }

  const filterClass =
    "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy-dark">
          Users ({filtered.length})
        </h2>
        <button
          onClick={() => {
            setCreateError("");
            setCreating(true);
          }}
          className="flex items-center gap-2 rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
        >
          <UserPlus size={16} /> Create user
        </button>
      </div>

      {users.isLoading && (
        <p role="status" className="mb-4 text-sm text-slate-500">
          Loading users...
        </p>
      )}
      {users.error && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {users.error.message}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-56 flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label="Search users"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or email"
            className={`${filterClass} w-full pl-9`}
          />
        </label>
        <select
          aria-label="Filter by role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value as Role | "all");
            setPage(1);
          }}
          className={filterClass}
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r} className="capitalize">
              {r}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as AccountStatus | "all");
            setPage(1);
          }}
          className={filterClass}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  {users.isLoading
                    ? "Loading users..."
                    : "No users match your search."}
                </td>
              </tr>
            )}
            {visible.map((u) => (
              <tr
                key={u.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-navy-dark">{u.name}</div>
                  <div className="text-xs">{u.email}</div>
                </td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}
                  >
                    {u.status === "active" ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{date(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => setViewing(u)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      disabled={u.id === user.id || changeStatus.isPending}
                      onClick={() =>
                        changeStatus.mutate({
                          id: u.id,
                          next: u.status === "active" ? "disabled" : "active",
                        })
                      }
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                    >
                      <Power size={14} />{" "}
                      {u.status === "active" ? "Disable" : "Enable"}
                    </button>
                    <button
                      disabled={u.id === user.id}
                      onClick={() => setDeleting(u)}
                      className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>
          Page {current} of {pages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={current >= pages}
            onClick={() => setPage(current + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? ""}
      >
        {viewing && (
          <div className="text-sm text-slate-600">
            <p>{viewing.email}</p>
            <p className="mt-1 capitalize">
              {viewing.role} · {viewing.status} · registered{" "}
              {date(viewing.createdAt)}
            </p>
            <Activity target={viewing} />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={creating}
        onClose={() => setCreating(false)}
        title="Create user"
      >
        <form onSubmit={submitCreate} className="space-y-3">
          <label className="block text-sm font-medium">
            Full name
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Temporary password
            <input
              type="password"
              minLength={8}
              maxLength={72}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Role
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.role}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value as Role })
              }
            >
              {ROLES.map((item) => (
                <option key={item} value={item} className="capitalize">
                  {item}
                </option>
              ))}
            </select>
          </label>
          {form.role === "staff" && (
            <label className="block text-sm font-medium">
              Organizer
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.organizerId}
                onChange={(event) =>
                  setForm({ ...form, organizerId: event.target.value })
                }
                required
              >
                <option value="">Choose an organizer</option>
                {organizers.map((organizer) => (
                  <option key={organizer.id} value={organizer.id}>
                    {organizer.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {form.role === "admin" && (
            <label className="block text-sm font-medium">
              Your password (to confirm)
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.actorPassword}
                onChange={(event) =>
                  setForm({ ...form, actorPassword: event.target.value })
                }
                required
              />
            </label>
          )}
          {createError && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {createError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
            >
              {create.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deactivate.mutate(deleting.id);
        }}
        title={
          deleting ? `Deactivate ${deleting.name}?` : "Deactivate account?"
        }
        description="This disables their login and preserves their event and ticket history. You can enable the account again later."
        confirmLabel="Deactivate"
        variant="danger"
      />
    </div>
  );
}
