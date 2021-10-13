import { APIGatewayProxyEvent } from 'aws-lambda'
import { StatusCodes } from 'http-status-codes'
import { ErrorResponse } from './util'
import { Email, EventBody, Response } from './types'
import { compileContentToHTML } from './template'
import env from './env'
import recaptcha from './recaptcha'
import ses from './ses'
import ssm from './ssm'
import logger from './logger'

const envVars = env.loadVars()

export async function lambdaHandler(
  event: APIGatewayProxyEvent
): Promise<Response> {
  try {
    logger.info('Env vars: ' + envVars)
    logger.info('Body: ' + event.body)

    if (!event.body) {
      logger.warn('Invalid body')
      throw new ErrorResponse({
        title: 'Body inválido',
        detail: 'Nenhum body foi especificado na requisição.',
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
    if (e instanceof ErrorResponse) {
      logger.warn(e)
      return e
    } else {
      logger.error(e)
      return new ErrorResponse({ detail: JSON.stringify(e) })
    }
  }
}

function validateEmail(email: Email) {
  const buildResponseError = (detail: string): ErrorResponse => {
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
  if (envVars.recaptcha.ENABLED) {
    await verifyRecaptcha(recaptchaToken)
  }

  await sendEmail(email)
}

async function verifyRecaptcha(recaptchaToken: string) {
  const recaptchaSecret = await ssm.getParameter('/dom-server/recaptcha/secret')

  if (!recaptchaSecret) {
    throw new ErrorResponse({
      title: 'Ocorreu um erro ao verificar o reCAPTCHA',
      detail: 'Parâmetro com segredo não foi atribuído no SSM.',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  }

  logger.info('Verifying reCAPTCHA')
  const isValidToken = await recaptcha.isValidToken({
    secret: recaptchaSecret,
    scoreThreshold: envVars.recaptcha.SCORE_THRESHOLD,
    token: recaptchaToken,
  })

  if (!isValidToken) {
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
    source: envVars.email.SOURCE,
    dest: [envVars.email.DEST],
    compiledEmail: {
      subject: email.subject || envVars.email.SUBJECT,
      htmlContent,
    },
  })
}
