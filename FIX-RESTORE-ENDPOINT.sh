#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Delete the restoreEvent function that calls POST /publish (which is 404),
# and make everything go through PATCH /events/:id with { status: 'PUBLISHED' }.
python3 - <<'PY'
path = 'src/lib/backendEvents.ts'
src = open(path).read()

# Remove the old broken restoreEvent function
old = '''// Restore an event that was cancelled. We need to know its original status
// so we can restore it to the right state (DRAFT or PUBLISHED).
export async function restoreEvent(id: string, target: "Draft" | "Published"): Promise<void> {
  await api(`/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: target === "Published" ? "PUBLISHED" : "DRAFT" }),
  });
  if (target === "Published") {
    await api(`/events/${encodeURIComponent(id)}/publish`, { method: "POST" });
  }
}'''

new = '''// Restore an event that was cancelled. Uses PATCH /events/:id because
// POST /events/:id/publish does not exist on the backend (404).
// Note: the backend currently rejects CANCELLED -> PUBLISHED with 409.
// This function will surface that error honestly to the caller.
export async function restoreEvent(id: string, target: "Draft" | "Published"): Promise<void> {
  await api(`/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { status: target === "Published" ? "PUBLISHED" : "DRAFT" },
  });
}'''

if old in src:
    src = src.replace(old, new)
    open(path, 'w').write(src)
    print('  ✓ backendEvents.ts: removed POST /publish call')
else:
    print('  ⚠ Could not find the restoreEvent function — file may already be patched')
PY

npx tsc -p tsconfig.app.json --noEmit && echo "TSC-OK"
