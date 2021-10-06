import { APIGatewayProxyEvent } from 'aws-lambda'
import { StatusCodes } from 'http-status-codes'
import { ErrorResponse } from './util'
import recaptcha from './recaptcha'
import ses from './ses'
import { Email, Env, EventBody, Response } from './types'

export async function lambdaHandler(
  event: APIGatewayProxyEvent
): Promise<Response> {
  try {
    const env = loadEnv()
    console.info('Running with env: ', env)
    console.info('Body: ', event.body)

    if (!event.body) {
      console.warn('Invalid body')
      throw new ErrorResponse({
        title: 'Conteúdo inválido',
        detail: 'Não é possível enviar um email sem conteúdo.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    }
    const { recaptchaToken, email } = JSON.parse(event.body) as EventBody
    await checkRecaptchaAndSendEmail(env, recaptchaToken, email)

    console.info('Done.')
    return {
      headers: { 'Content-Type': 'application/json' },
      body: {
        message: 'Solicitação de orçamento enviada com sucesso.',
        statusCode: StatusCodes.OK,
      },
    }
  } catch (e) {
    console.warn(e)
    if (e instanceof ErrorResponse) {
      return e
    } else {
      return new ErrorResponse({ detail: JSON.stringify(e) })
    }
  }
}

function loadEnv(): Env {
  const buildResponseError = (varName: string): ErrorResponse => {
    return new ErrorResponse({
      title: 'Erro de ambiente',
      detail: `Variável de ambiente "${varName}" não definida.`,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    })
  }

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

  if (!process.env.RECAPTCHA_SECRET) {
    throw buildResponseError('RECAPTCHA_SECRET')
  } else {
    env.recaptcha.SECRET = process.env.RECAPTCHA_SECRET
  }

  if (!process.env.RECAPTCHA_SCORE_THRESHOLD) {
    throw buildResponseError('RECAPTCHA_SCORE_THRESHOLD')
  } else {
    env.recaptcha.SCORE_THRESHOLD = process.env.RECAPTCHA_SCORE_THRESHOLD
  }

  if (!process.env.EMAIL_SOURCE) {
    throw buildResponseError('EMAIL_SOURCE')
  } else {
    env.email.SOURCE = process.env.EMAIL_SOURCE
  }

  if (!process.env.EMAIL_DEST) {
    throw buildResponseError('EMAIL_DEST')
  } else {
    env.email.DEST = process.env.EMAIL_DEST
  }

  if (!process.env.EMAIL_SUBJECT) {
    throw buildResponseError('EMAIL_SUBJECT')
  } else {
    env.email.SUBJECT = process.env.EMAIL_SUBJECT
  }

  return env
}

async function checkRecaptchaAndSendEmail(
  env: Env,
  recaptchaToken: string,
  email: Email
) {
  console.info('Verifying reCAPTCHA')
  const isValidToken = await recaptcha.isValidToken({
    secret: env.recaptcha.SECRET,
    scoreThreshold: Number(env.recaptcha.SCORE_THRESHOLD),
    token: recaptchaToken,
  })

  if (!isValidToken) {
    throw new ErrorResponse({
      title: 'reCAPTCHA inválido',
      detail: 'Token do reCAPTCHA não é válido.',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  }

  console.info('Sending email')
  await ses.sendEmail({
    source: env.email.SOURCE,
    dest: [env.email.DEST],
    email: {
      subject: email.subject || env.email.SUBJECT,
      content: email.content,
    },
  })
}
