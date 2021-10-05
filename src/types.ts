export interface EventBody {
  recaptchaToken: string
  email: Email
}

export interface ErrorResponseHeaders {
  'Content-Type': string
}

export interface ErrorResponseBody {
  title: string
  detail?: string
  statusCode: number
}

export interface IsValidTokenInput {
  secret: string
  scoreThreshold: number
  token: string
}

export interface Email {
  subject: string
  body: string
}

export interface SendEmailInput {
  source: string
  dest: string[]
  email: Email
}

export interface RecaptchaResponse {
  success: boolean
  score: number
  action: string
}
