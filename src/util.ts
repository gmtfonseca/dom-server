import { StatusCodes } from 'http-status-codes'
import { HttpHeaders, ErrorResponseBody, Response } from 'types'

export class ErrorResponse implements Response {
  headers: HttpHeaders
  body: ErrorResponseBody
  constructor(body: Partial<ErrorResponseBody>) {
    this.headers = {
      'Content-Type': 'application/json',
    }
    this.body = {
      title: body.title || 'Ocorreu um erro',
      detail: body.detail,
      statusCode: body.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    }
  }
}
