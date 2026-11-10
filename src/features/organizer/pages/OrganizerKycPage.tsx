import { BackendUnavailablePage } from '../../../components/BackendUnavailablePage'

export function OrganizerKycPage() {
  return (
    <BackendUnavailablePage
      title="Organizer verification unavailable"
      feature="Organizer KYC submission and review"
      backTo="/organizer/dashboard"
    />
  )
}
