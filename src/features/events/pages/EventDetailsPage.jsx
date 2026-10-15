import { useParams } from '@tanstack/react-router'

// Event details page - empty on purpose. Write your code for this page here.
// Smaller pieces go in ../components and data hooks go in ../hooks
export default function EventDetailsPage() {
  const { eventId } = useParams({ strict: false })

  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-16 text-center">
      <h1 className="text-3xl font-extrabold">Event details page</h1>
      <p className="mt-2">Event #{eventId}</p>
    </section>
  )
}
