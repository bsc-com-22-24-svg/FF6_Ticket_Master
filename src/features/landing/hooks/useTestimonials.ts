import { useQuery } from '@tanstack/react-query'
import { testimonials } from '../../../mocks/testimonials'
import { withDelay } from '../../../mocks/delay'

// Gets the reviews for the "What people say" section
export function useTestimonials() {
  return useQuery({ queryKey: ['testimonials'], queryFn: () => withDelay(testimonials) })
}
