import { APIGatewayProxyEvent } from 'aws-lambda'
import { StatusCodes } from 'http-status-codes'
import { ErrorResponse } from './util'
import { Email, Env, EventBody, Response } from './types'
import { compileContentToHTML } from './template'
import recaptcha from './recaptcha'
import ses from './ses'
import ssm from './ssm'
import logger from './logger'

const loadEnv = (): Env => {
  const buildError = (varName: string): Error => {
    return new Error(`Variável de ambiente inválida: ${varName}`)
  }

  const env = {
    recaptcha: {
      ENABLED: false,
      SCORE_THRESHOLD: 0,
    },
    email: {
      SOURCE: '',
      DEST: '',
      SUBJECT: '',
    },
  }

  if (!process.env.RECAPTCHA_ENABLED) {
    throw buildError('RECAPTCHA_ENABLED')
  } else {
    env.recaptcha.ENABLED = process.env.RECAPTCHA_ENABLED === '1'
  }

  if (!process.env.RECAPTCHA_SCORE_THRESHOLD) {
    throw buildError('RECAPTCHA_SCORE_THRESHOLD')
  } else {
    env.recaptcha.SCORE_THRESHOLD = Number(
      process.env.RECAPTCHA_SCORE_THRESHOLD
    )
  }

  if (!process.env.EMAIL_SOURCE) {
    throw buildError('EMAIL_SOURCE')
  } else {
    env.email.SOURCE = process.env.EMAIL_SOURCE
  }

  if (!process.env.EMAIL_DEST) {
    throw buildError('EMAIL_DEST')
  } else {
    env.email.DEST = process.env.EMAIL_DEST
  }

  if (!process.env.EMAIL_SUBJECT) {
    throw buildError('EMAIL_SUBJECT')
  } else {
    env.email.SUBJECT = process.env.EMAIL_SUBJECT
  }

  return env
}

const env = loadEnv()

const loadParameterStore = async () => {
  const recaptchaSecret = await ssm.getParameter('/dom-server/recaptcha/secret')
  return {
    recaptchaSecret,
  }
}

const parameterStorePromise = loadParameterStore()

export async function lambdaHandler(
  event: APIGatewayProxyEvent
): Promise<Response> {
  try {
    logger.info('Env: ' + env)
    logger.info('Body: ' + event.body)

    if (!event.body) {
      logger.warn('Invalid body')
      throw new ErrorResponse({
        title: 'Corpo inválido',
        detail: 'Nenhum corpo foi especificado na requisição.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    }

    const { recaptchaToken, email } = JSON.parse(event.body) as EventBody

    validateEmail(email)

    await verifyRecaptchaAndSendEmail(recaptchaToken, email)

    logger.info('Done.')

    return {
      headers: { 'Content-Type': 'application/json' },
      body: {
        message: 'Solicitação de orçamento enviada com sucesso.',
        statusCode: StatusCodes.OK,
      },
    }
  } catch (e) {
    logger.warn(e)
    if (e instanceof ErrorResponse) {
      return e
    } else {
      return new ErrorResponse({ detail: JSON.stringify(e) })
    }
  }
}

function validateEmail(email: Email) {
  const buildResponseError = (detail: string): ErrorResponse => {
    logger.warn('Invalid email content')
    return new ErrorResponse({
      title: 'Conteúdo do e-mail é inválido',
      detail,
      statusCode: StatusCodes.BAD_REQUEST,
    })
  }

  if (!email.content) {
    throw buildResponseError('Não é possível enviar um email sem conteúdo.')
  }

  if (!email.content.customerInfo) {
    throw buildResponseError('Propriedade "customerInfo" é inválida.')
  }

  const { name, emailAddress } = email.content.customerInfo

  if (!name) {
    throw buildResponseError('Propriedade "customerInfo.name" é inválida.')
  }

  if (!emailAddress) {
    throw buildResponseError(
      'Propriedade "customerInfo.emailAddress" é inválida.'
    )
  }

  if (!email.content.cartItems) {
    throw buildResponseError('Propriedade "cartItems" é inválida.')
  }

  if (!email.content.cartItems.length) {
    throw buildResponseError('Propriedade "cartItems" está vazia.')
  }

  let isCartItemsValid = true
  for (const cartItem of email.content.cartItems) {
    if (
      !cartItem.product ||
      !cartItem.product.reference ||
      !cartItem.product.name ||
      !cartItem.quantity
    ) {
      isCartItemsValid = false
      break
    }
  }

  if (!isCartItemsValid) {
    throw buildResponseError('Itens da propriedade "cartItems" são inválidos.')
  }
}

async function verifyRecaptchaAndSendEmail(
  recaptchaToken: string,
  email: Email
) {
  if (env.recaptcha.ENABLED) {
    await verifyRecaptcha(recaptchaToken)
  }

  await sendEmail(email)
}

async function verifyRecaptcha(recaptchaToken: string) {
  const { recaptchaSecret } = await parameterStorePromise

  if (!recaptchaSecret) {
    logger.warn('reCAPTCHA secret not set')
    throw new ErrorResponse({
      title: 'Ocorreu um erro ao verificar o reCAPTCHA',
      detail: 'Parâmetro com segredo não foi atribuído no SSM.',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  }

  logger.info('Verifying reCAPTCHA')
  const isValidToken = await recaptcha.isValidToken({
    secret: recaptchaSecret,
    scoreThreshold: env.recaptcha.SCORE_THRESHOLD,
    token: recaptchaToken,
  })

  if (!isValidToken) {
    logger.warn('Invalid reCAPTCHA')
    throw new ErrorResponse({
      title: 'reCAPTCHA inválido',
      detail: 'Token do reCAPTCHA não é válido.',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  }
}

async function sendEmail(email: Email) {
  logger.info('Compiling HTML content')
  const htmlContent = compileContentToHTML(email.content)

  logger.info('Sending email')
  await ses.sendEmail({
    source: env.email.SOURCE,
    dest: [env.email.DEST],
    compiledEmail: {
      subject: email.subject || env.email.SUBJECT,
      htmlContent,
    },
  })
}
