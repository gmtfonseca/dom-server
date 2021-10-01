export interface EventBody {
  recaptchaToken: string
  email: Email
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
