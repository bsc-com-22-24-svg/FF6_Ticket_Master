import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../authentication";
import { api } from "../../../lib/backend";
import type { OrganizerKyc } from "../../../lib/backendAdmin";

export function OrganizerKycPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["organizer-kyc", user?.id],
    queryFn: () => api<OrganizerKyc | null>("/organizers/me/kyc"),
    enabled: !!user,
  });

  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile.data) return;
    setBusinessName(profile.data.businessName);
    setPhoneNumber(profile.data.phoneNumber);
    setNationalId(profile.data.nationalId);
  }, [profile.data]);

  const save = useMutation({
    mutationFn: (
      input: Pick<OrganizerKyc, "businessName" | "phoneNumber" | "nationalId">,
    ) =>
      api<OrganizerKyc>("/organizers/me/kyc", { method: "PUT", body: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["organizer-kyc", user?.id],
      });
      void navigate({ to: "/organizer/dashboard" });
    },
    onError: (reason) =>
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save your details.",
      ),
  });

  if (!user) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!businessName.trim())
      return setError("Enter your business or organization name.");
    if (!/^[+\d][\d\s-]{6,}$/.test(phoneNumber.trim()))
      return setError(
        "Enter a valid phone number, for example +265 999 000 000.",
      );
    if (nationalId.trim().length < 5)
      return setError("Enter your national ID number.");
    setError("");
    save.mutate({
      businessName: businessName.trim(),
      phoneNumber: phoneNumber.trim(),
      nationalId: nationalId.trim(),
    });
  }

  const field =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20";

  if (profile.isLoading) {
    return (
      <p className="mx-auto max-w-lg px-4 pt-24 text-sm text-slate-600">
        Loading your saved details...
      </p>
    );
  }

  if (profile.error) {
    return (
      <p
        role="alert"
        className="mx-auto max-w-lg px-4 pt-24 text-sm text-red-700"
      >
        {profile.error.message}
      </p>
    );
  }

  if (profile.data?.status === "Verified") {
    return (
      <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-24">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-extrabold text-navy-dark">
            Details verified
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            {profile.data.businessName} · {profile.data.phoneNumber}
          </p>
          <button
            type="button"
            onClick={() => void navigate({ to: "/organizer/dashboard" })}
            className="mt-6 w-full rounded-lg bg-navy px-4 py-3 font-semibold text-white hover:bg-navy-dark"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-24">
      <form
        onSubmit={submit}
        className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        noValidate
      >
        <h1 className="text-2xl font-extrabold text-navy-dark">
          Confirm your details
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Welcome, {user.name}. Before you create events, tell us about your
          business. This takes a minute and you only do it once.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <label className="mt-5 block text-sm font-semibold text-slate-700">
          Business or organization name
          <input
            className={field}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Nyasa Events"
            autoComplete="organization"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Phone number
          <input
            className={field}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+265 999 000 000"
            inputMode="tel"
            autoComplete="tel"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          National ID number
          <input
            className={field}
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            placeholder="Your national ID"
          />
        </label>

        <button
          type="submit"
          disabled={save.isPending}
          className="mt-6 w-full rounded-lg bg-navy px-4 py-3 font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
        >
          {save.isPending ? "Saving..." : "Save and continue"}
        </button>
      </form>
    </div>
  );
}
