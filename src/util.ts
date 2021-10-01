import { StatusCodes } from 'http-status-codes'

export class ErrorResponse {
  public body: string
  public headers: { 'Content-Type': string }
  constructor(
    message = 'An error occurred',
    public statusCode = StatusCodes.INTERNAL_SERVER_ERROR
  ) {
    const body = JSON.stringify({ message })
    this.body = body
    this.headers = {
      'Content-Type': 'application/json',
    }
  }
}
