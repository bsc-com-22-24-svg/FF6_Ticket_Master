import { BackendUnavailablePage } from '../../../components/BackendUnavailablePage'

export function StaffManagementPage() {
  return (
    <BackendUnavailablePage
      title="Staff management unavailable"
      feature="Staff accounts and event assignments"
      backTo="/organizer/dashboard"
    />
  )
}
