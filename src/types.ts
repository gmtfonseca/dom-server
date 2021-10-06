export interface Env {
  recaptcha: RecaptchaEnv
  email: EmailEnv
}

interface RecaptchaEnv {
  SECRET: string
  SCORE_THRESHOLD: string
}

interface EmailEnv {
  SOURCE: string
  DEST: string
  SUBJECT: string
}

export interface EventBody {
  recaptchaToken: string
  email: Email
}

export interface Response {
  message: string
}

export interface HttpHeaders {
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
  content: string
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
