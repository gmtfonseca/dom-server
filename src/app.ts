import { APIGatewayProxyEvent } from 'aws-lambda'
import { StatusCodes } from 'http-status-codes'
import { ErrorResponse } from './util'
import { Email, EmailContent, Env, EventBody, Response } from './types'
import { compileContentToHTML } from './template'
import recaptcha from './recaptcha'
import ses from './ses'
import ssm from './ssm'

export async function lambdaHandler(
  event: APIGatewayProxyEvent
): Promise<Response> {
  try {
    const env = loadEnvVariables()
    console.info('Running with env: ', env)
    console.info('Body: ', event.body)

    if (!event.body) {
      console.warn('Invalid body')
      throw new ErrorResponse({
        title: 'Corpo inválido',
        detail: 'Nenhum corpo foi especificado na requisição.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    }

    const { recaptchaToken, email } = JSON.parse(event.body) as EventBody

    if (!email.content) {
      console.warn('Invalid email content')
      throw new ErrorResponse({
        title: 'Email vazio',
        detail: 'Não é possível enviar um email sem conteúdo.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    }

    validateEmailContent(email.content)

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

function validateEmailContent(emailContent: EmailContent) {
  const buildResponseError = (detail: string): ErrorResponse => {
    return new ErrorResponse({
      title: 'Conteúdo do e-mail é inválido',
      detail,
      statusCode: StatusCodes.BAD_REQUEST,
    })
  }

  if (!emailContent.customerInfo) {
    throw buildResponseError('Propriedade "customerInfo" é inválida.')
  }

  const { name, emailAddress } = emailContent.customerInfo

  if (!name) {
    throw buildResponseError('Propriedade "customerInfo.name" é inválida.')
  }

  if (!emailAddress) {
    throw buildResponseError(
      'Propriedade "customerInfo.emailAddress" é inválida.'
    )
  }

  if (!emailContent.cartItems) {
    throw buildResponseError('Propriedade "cartItems" é inválida.')
  }

  if (!emailContent.cartItems.length) {
    throw buildResponseError('Propriedade "cartItems" está vazia.')
  }

  let isCartItemsValid = true
  for (const cartItem of emailContent.cartItems) {
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

async function checkRecaptchaAndSendEmail(
  env: Env,
  recaptchaToken: string,
  email: Email
) {
  if (env.NODE_ENV !== 'development') {
    const recaptchaSecret = await ssm.getParameter(
      '/dom-server/recaptcha/secret'
    )

    if (!recaptchaSecret) {
      console.warn('Recaptcha secret not set')
      throw new ErrorResponse({
        title: 'Ocorreu um erro ao verificar o reCAPTCHA',
        detail: 'Parâmetro com segredo não foi atribuído no SSM.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    }

    console.info('Verifying reCAPTCHA')
    const isValidToken = await recaptcha.isValidToken({
      secret: recaptchaSecret,
      scoreThreshold: Number(env.recaptcha.SCORE_THRESHOLD),
      token: recaptchaToken,
    })

    if (!isValidToken) {
      console.warn('Invalid recaptcha')
      throw new ErrorResponse({
        title: 'reCAPTCHA inválido',
        detail: 'Token do reCAPTCHA não é válido.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    }
  }

  console.info('Compiling email HTML')
  const htmlContent = compileContentToHTML(email.content)

  console.info('Sending email')
  await ses.sendEmail({
    source: env.email.SOURCE,
    dest: [env.email.DEST],
    compiledEmail: {
      subject: email.subject || env.email.SUBJECT,
      htmlContent,
    },
  })
}

function loadEnvVariables(): Env {
  const buildResponseError = (varName: string): ErrorResponse => {
    return new ErrorResponse({
      title: 'Erro de ambiente',
      detail: `Variável de ambiente "${varName}" não definida.`,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    })
  }

  const env = {
    NODE_ENV: '',
    recaptcha: {
      SCORE_THRESHOLD: '',
    },
    email: {
      SOURCE: '',
      DEST: '',
      SUBJECT: '',
    },
  }

  if (!process.env.NODE_ENV) {
    throw buildResponseError('NODE_ENV')
  } else {
    env.NODE_ENV = process.env.NODE_ENV
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
