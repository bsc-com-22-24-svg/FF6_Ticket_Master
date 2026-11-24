import { api } from './backend'

export interface ContactInput {
  name: string
  email: string
  subject: string
  message: string
}

export function sendContact(input: ContactInput): Promise<void> {
  return api<void>('/contact', {
    method: 'POST',
    body: {
      name: input.name.trim(),
      email: input.email.trim(),
      subject: input.subject.trim(),
      message: input.message.trim(),
    },
  })
}
