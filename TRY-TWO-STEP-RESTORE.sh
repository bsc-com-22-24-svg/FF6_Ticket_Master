#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

python3 - <<'PY'
path = 'src/features/organizer/pages/OrganizerDashboardPage.tsx'
src = open(path).read()

old = '''async function handleRestoreEvent(eventId: string, target: 'Draft' | 'Published') {
    setBusyId(eventId)
    try {
      await restoreEvent(eventId, target)
      await queryClient.invalidateQueries({ queryKey: ['events'] })
      showToast(`Event restored to ${target}`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not restore event', 'error')
    } finally {
      setBusyId(null)
    }
  }'''

new = '''async function handleRestoreEvent(eventId: string, target: 'Draft' | 'Published') {
    setBusyId(eventId)
    try {
      if (target === 'Published') {
        // Two-step restore: CANCELLED → DRAFT → PUBLISHED.
        // Many backends allow CANCELLED → DRAFT but reject CANCELLED → PUBLISHED
        // because "publish" is meant to transition from DRAFT only.
        try {
          await restoreEvent(eventId, 'Draft')
        } catch (draftErr) {
          // If even the DRAFT step fails, surface the real error
          throw new Error(
            `Backend rejected CANCELLED → DRAFT: ${draftErr instanceof Error ? draftErr.message : String(draftErr)}`,
          )
        }
        try {
          await restoreEvent(eventId, 'Published')
        } catch (pubErr) {
          // Restored to DRAFT — partial success, but tell the user
          await queryClient.invalidateQueries({ queryKey: ['events'] })
          showToast(
            `Restored to DRAFT (publish failed: ${pubErr instanceof Error ? pubErr.message : 'unknown'}). Click Publish to try again.`,
            'error',
          )
          return
        }
      } else {
        await restoreEvent(eventId, target)
      }
      await queryClient.invalidateQueries({ queryKey: ['events'] })
      showToast(`Event restored to ${target}`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not restore event', 'error')
    } finally {
      setBusyId(null)
    }
  }'''

if old in src:
    src = src.replace(old, new)
    open(path, 'w').write(src)
    print('  ✓ Patched handleRestoreEvent to two-step')
else:
    print('  ⚠ Could not find handleRestoreEvent — dumping nearby context:')
    idx = src.find('handleRestoreEvent')
    print(repr(src[idx-100:idx+400]) if idx >= 0 else 'not found')
PY

npx tsc -p tsconfig.app.json --noEmit && echo "TSC-OK"
