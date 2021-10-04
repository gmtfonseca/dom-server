if (process.env.NODE_ENV === 'production') {
  require('module-alias/register')
}

import { APIGatewayProxyEvent } from 'aws-lambda'
import { StatusCodes } from 'http-status-codes'
import { ErrorResponse } from '@/util'
import recaptcha from '@/recaptcha'
import ses from '@/ses'
import { EventBody } from '@/types'

// TODO - Handle dev env variables
const throwEnvError = (varName: string) => {
  throw new Error(`Env variable "${varName}" is not set.`)
}

if (!process.env.RECAPTCHA_SECRET) {
  throwEnvError('RECAPTCHA_SECRET')
}

if (!process.env.RECAPTCHA_SCORE_THRESHOLD) {
  throwEnvError('RECAPTCHA_SCORE_THRESHOLD')
}

if (!process.env.EMAIL_SOURCE) {
  throwEnvError('EMAIL_SOURCE')
}

if (!process.env.EMAIL_DEST) {
  throwEnvError('EMAIL_DEST')
}

if (!process.env.EMAIL_SUBJECT) {
  throwEnvError('EMAIL_SUBJECT')
}

const env = {
  recaptcha: {
    SECRET: process.env.RECAPTCHA_SECRET as string,
    SCORE_THRESHOLD: Number(process.env.RECAPTCHA_SCORE_THRESHOLD),
  },
  email: {
    SOURCE: process.env.EMAIL_SOURCE as string,
    DEST: process.env.EMAIL_DEST as string,
    SUBJECT: process.env.EMAIL_SUBJECT as string,
  },
}

exports.handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    throw new ErrorResponse('Invalid body', StatusCodes.BAD_REQUEST)
  }

  try {
    const { recaptchaToken, email } = JSON.parse(event.body) as EventBody
    const isValidToken = await recaptcha.isValidToken({
      secret: env.recaptcha.SECRET,
      scoreThreshold: env.recaptcha.SCORE_THRESHOLD,
      token: recaptchaToken,
    })

    if (!isValidToken) {
      throw new ErrorResponse(
        'Invalid recaptcha score.',
        StatusCodes.BAD_REQUEST
      )
    }

    ses.sendEmail({
      source: env.email.SOURCE,
      dest: [env.email.DEST],
      email: {
        subject: email.subject || env.email.SUBJECT,
        body: email.body,
      },
    })
  } catch (e) {
    console.log(e)
    if (e instanceof ErrorResponse) {
      return e
    } else {
      return new ErrorResponse()
    }
  }
}
