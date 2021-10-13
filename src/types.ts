export interface EnvVars {
  recaptcha: EnvVarsRecaptcha
  email: EnvVarsEmail
}

interface EnvVarsRecaptcha {
  ENABLED: boolean
  SCORE_THRESHOLD: number
  SECRET?: string
}

interface EnvVarsEmail {
  SOURCE: string
  DEST: string
  SUBJECT: string
}

export interface HttpHeaders {
  'Content-Type': string
}

export interface Response {
  headers: HttpHeaders
  body: ResponseBody | ErrorResponseBody
}

export interface ResponseBody {
  message: string
  statusCode: number
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

export interface EventBody {
  recaptchaToken: string
  email: Email
}

export interface Email {
  subject: string
  content: EmailContent
}

export interface EmailContent {
  customerInfo: CustomerInfo
  customized: boolean
  cartItems: CartItem[]
}

export interface CustomerInfo {
  name: string
  emailAddress: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Product {
  reference: string
  name: string
}

export interface CompiledEmail {
  subject: string
  htmlContent: string
}

export interface SendEmailInput {
  source: string
  dest: string[]
  compiledEmail: CompiledEmail
}

export type CompileContentToHTMLInput = EmailContent

export interface RecaptchaResponse {
  success: boolean
  score: number
  action: string
}
