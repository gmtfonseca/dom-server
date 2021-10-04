import { APIGatewayProxyEvent } from 'aws-lambda'
import { StatusCodes } from 'http-status-codes'
import { ErrorResponse } from './util'
/* import recaptcha from '@/recaptcha'
import ses from '@/ses'
import { EventBody } from '@/types' */

const env = {
  recaptcha: {
    SECRET: '',
    SCORE_THRESHOLD: '',
  },
  email: {
    SOURCE: '',
    DEST: '',
    SUBJECT: '',
  },
}

const buildMsg = (varName: string) => {
  return `Env variable "${varName}" not set.`
}

if (!process.env.RECAPTCHA_SECRET) {
  throw new Error(buildMsg('RECAPTCHA_SECRET'))
} else {
  env.recaptcha.SECRET = process.env.RECAPTCHA_SECRET
}

if (!process.env.RECAPTCHA_SCORE_THRESHOLD) {
  throw new Error(buildMsg('RECAPTCHA_SCORE_THRESHOLD'))
} else {
  env.recaptcha.SCORE_THRESHOLD = process.env.RECAPTCHA_SCORE_THRESHOLD
}

if (!process.env.EMAIL_SOURCE) {
  throw new Error(buildMsg('EMAIL_SOURCE'))
} else {
  env.email.SOURCE = process.env.EMAIL_SOURCE
}

if (!process.env.EMAIL_DEST) {
  throw new Error(buildMsg('EMAIL_DEST'))
} else {
  env.email.DEST = process.env.EMAIL_DEST
}

if (!process.env.EMAIL_SUBJECT) {
  throw new Error(buildMsg('EMAIL_SUBJECT'))
} else {
  env.email.SUBJECT = process.env.EMAIL_SUBJECT
}

exports.lambdaHandler = async (event: APIGatewayProxyEvent) => {
  console.log('Running with env: ', env)
  console.log('Body: ', event.body)

  try {
    if (!event.body) {
      console.log('Invalid body')
      throw new ErrorResponse('Invalid body', StatusCodes.BAD_REQUEST)
    }
    /* const { recaptchaToken, email } = JSON.parse(event.body) as EventBody
    console.log('Validating recaptcha')
    const isValidToken = await recaptcha.isValidToken({
      secret: env.recaptcha.SECRET,
      scoreThreshold: Number(env.recaptcha.SCORE_THRESHOLD),
      token: recaptchaToken,
    })

    if (!isValidToken) {
      throw new ErrorResponse(
        'Invalid recaptcha score.',
        StatusCodes.BAD_REQUEST
      )
    }

    console.log('Sending email')
    await ses.sendEmail({
      source: env.email.SOURCE,
      dest: [env.email.DEST],
      email: {
        subject: email.subject || env.email.SUBJECT,
        body: email.body,
      },
    }) */

    console.log('Done.')
    return { message: 'Email sent.' }
  } catch (e) {
    console.log(e)
    if (e instanceof ErrorResponse) {
      return e
    } else {
      return new ErrorResponse()
    }
  }
}
