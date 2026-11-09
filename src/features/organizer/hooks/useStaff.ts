import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../authentication";
import { listOrganizerStaff } from "../../../lib/backendAdmin";
import type { BackendStaffMember } from "../../../lib/backendAdmin";
import type { ManagedUser } from "../../authentication/authStore";

export function useStaff() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const result = useQuery({
    queryKey: ["organizer-staff", user?.id],
    queryFn: listOrganizerStaff,
    enabled: !!user && user.role === "organizer",
  });

  const staff: ManagedUser[] = (result.data ?? []).map(
    (member: BackendStaffMember) => ({
      ...member,
      role: "staff",
      status: member.isActive ? "active" : "disabled",
      createdAt: "",
    }),
  );
  const filtered = staff.filter((member) =>
    `${member.name} ${member.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return {
    staff: filtered,
    totalStaff: staff.length,
    activeStaff: staff.filter((member) => member.status === "active").length,
    disabledStaff: staff.filter((member) => member.status === "disabled")
      .length,
    search,
    setSearch,
    loading: result.isLoading,
    error: result.error instanceof Error ? result.error.message : "",
  };
}
