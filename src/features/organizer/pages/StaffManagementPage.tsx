import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/backend";
import { listMyEvents } from "../../../lib/backendOrganizer";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  assignedEventIds: string[];
}

interface OrganizerEvent {
  id: string;
  name: string;
}

const STAFF_KEY = ["organizer-staff"];

export function StaffManagementPage() {
  const queryClient = useQueryClient();
  const staff = useQuery({
    queryKey: STAFF_KEY,
    queryFn: () => api<StaffMember[]>("/organizers/me/staff"),
  });
  const events = useQuery({
    queryKey: ["events", "mine"],
    queryFn: listMyEvents,
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const selectedStaff = staff.data?.find(
    (member) => member.id === selectedStaffId,
  );

  useEffect(() => {
    setSelectedEvents(selectedStaff?.assignedEventIds ?? []);
  }, [selectedStaff]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: STAFF_KEY });
  };
  const createStaff = useMutation({
    mutationFn: () =>
      api<StaffMember>("/organizers/me/staff", {
        method: "POST",
        body: { name, email, password },
      }),
    onSuccess: async (created) => {
      await refresh();
      setName("");
      setEmail("");
      setPassword("");
      setSelectedStaffId(created.id);
      setError("");
      setSuccess("Staff account created.");
    },
    onError: (reason) =>
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not create staff account.",
      ),
  });
  const assignEvents = useMutation({
    mutationFn: () =>
      api(
        `/organizers/me/staff/${encodeURIComponent(selectedStaffId)}/events`,
        {
          method: "PUT",
          body: { eventIds: selectedEvents },
        },
      ),
    onSuccess: async () => {
      await refresh();
      setSuccess("Event assignments saved.");
      setError("");
    },
    onError: (reason) =>
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save event assignments.",
      ),
  });
  const setActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api(`/organizers/me/staff/${encodeURIComponent(id)}/active`, {
        method: "PATCH",
        body: { isActive },
      }),
    onSuccess: refresh,
    onError: (reason) =>
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not update staff account.",
      ),
  });
  const deactivate = useMutation({
    mutationFn: (id: string) =>
      api(`/organizers/me/staff/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    onSuccess: refresh,
    onError: (reason) =>
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not deactivate staff account.",
      ),
  });

  function submitCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    createStaff.mutate();
  }

  function saveAssignments(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    assignEvents.mutate();
  }

  const loadingError = staff.error ?? events.error;

  return (
    <div className="page-content-wrapper">
      <div className="content-header">
        <div>
          <h2 className="view-title">Staff accounts and event assignments</h2>
          <p className="view-subtitle">
            Create check-in staff and assign only events you manage.
          </p>
        </div>
      </div>

      {loadingError && (
        <p role="alert" className="form-error-banner">
          {loadingError.message}
        </p>
      )}
      {error && (
        <p role="alert" className="form-error-banner">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="form-error-banner">
          {success}
        </p>
      )}

      <section className="card-body-frame">
        <h3>Create staff account</h3>
        <form className="event-creation-form" onSubmit={submitCreate}>
          <div className="form-group">
            <label htmlFor="staff-name">Name</label>
            <input
              id="staff-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="staff-email">Email</label>
            <input
              id="staff-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="staff-password">
              Temporary password (at least 8 characters)
            </label>
            <input
              id="staff-password"
              type="password"
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={createStaff.isPending}
          >
            {createStaff.isPending ? "Creating..." : "Create staff account"}
          </button>
        </form>
      </section>

      <section className="card-body-frame">
        <h3>Staff roster</h3>
        {staff.isLoading ? (
          <p>Loading staff accounts...</p>
        ) : (
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Assigned events</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(staff.data ?? []).map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.assignedEventIds.length}</td>
                    <td>{member.isActive ? "Active" : "Disabled"}</td>
                    <td className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-action"
                        onClick={() => setSelectedStaffId(member.id)}
                      >
                        Assign events
                      </button>
                      <button
                        type="button"
                        className="btn-action"
                        disabled={setActive.isPending}
                        onClick={() =>
                          setActive.mutate({
                            id: member.id,
                            isActive: !member.isActive,
                          })
                        }
                      >
                        {member.isActive ? "Disable" : "Enable"}
                      </button>
                      {member.isActive && (
                        <button
                          type="button"
                          className="btn-action"
                          disabled={deactivate.isPending}
                          onClick={() => deactivate.mutate(member.id)}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {staff.data?.length === 0 && (
                  <tr>
                    <td colSpan={5}>No staff accounts yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedStaff && (
        <section className="card-body-frame">
          <h3>Assign events to {selectedStaff.name}</h3>
          {events.isLoading ? (
            <p>Loading your events...</p>
          ) : (
            <form className="event-creation-form" onSubmit={saveAssignments}>
              {(events.data ?? []).map((event: OrganizerEvent) => (
                <label key={event.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event.id)}
                    onChange={(change) =>
                      setSelectedEvents((current) =>
                        change.target.checked
                          ? [...current, event.id]
                          : current.filter((id) => id !== event.id),
                      )
                    }
                  />
                  {event.name}
                </label>
              ))}
              <button
                type="submit"
                className="btn-primary"
                disabled={assignEvents.isPending}
              >
                {assignEvents.isPending ? "Saving..." : "Save assignments"}
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
