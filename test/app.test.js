/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from 'http-status-codes'
import { lambdaHandler } from '../src/app'
import recaptcha from '../src/recaptcha'
import ses from '../src/ses'
import ssm from '../src/ssm'

jest.mock('../src/recaptcha')
jest.mock('../src/ses')
jest.mock('../src/ssm')

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj))
}

const validEmailContent = {
  customerInfo: {
    name: 'John Doe',
    emailAddress: 'john@doe.com',
  },
  customized: false,
  cartItems: [
    {
      product: {
        reference: 100,
        name: 'Pente 100',
      },
      quantity: 50,
    },
    {
      product: {
        reference: 101,
        name: 'Pente 101',
      },
      quantity: 2000,
    },
  ],
}

describe('App', () => {
  it('should return error when env vars are not set', async () => {
    const OLD_ENV = process.env
    const event = {
      body: JSON.stringify({
        email: {
          content: validEmailContent,
        },
      }),
    }

    const clearVarAndTest = async (varName) => {
      jest.resetModules()
      process.env = { ...OLD_ENV }
      process.env[varName] = ''

      const res = await lambdaHandler(event)
      expect(res.body).toMatchObject({
        title: 'Erro de ambiente',
        detail: `Variável de ambiente "${varName}" não definida.`,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      })

      process.env = OLD_ENV
    }

    await clearVarAndTest('RECAPTCHA_ENABLED')
    await clearVarAndTest('RECAPTCHA_SCORE_THRESHOLD')
    await clearVarAndTest('EMAIL_SOURCE')
    await clearVarAndTest('EMAIL_DEST')
    await clearVarAndTest('EMAIL_SUBJECT')
  })

  it('should return error when no body is passed', async () => {
    const event = {
      body: '',
    }

    const res = await lambdaHandler(event)
    expect(res.body).toMatchObject({
      title: 'Corpo inválido',
      detail: 'Nenhum corpo foi especificado na requisição.',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  })

  it('should return error when email has no content', async () => {
    const event = {
      body: JSON.stringify({
        email: {
          content: '',
        },
      }),
    }

    const res = await lambdaHandler(event)
    expect(res.body).toMatchObject({
      title: 'Email vazio',
      detail: 'Não é possível enviar um email sem conteúdo.',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  })

  describe('Email content validation', () => {
    it('should return customerInfo error', async () => {
      const emailContent = deepCopy(validEmailContent)
      emailContent.customerInfo = null

      const event = {
        body: JSON.stringify({
          email: {
            content: emailContent,
          },
        }),
      }

      const res = await lambdaHandler(event)
      expect(res.body).toMatchObject({
        title: 'Conteúdo do e-mail é inválido',
        detail: 'Propriedade "customerInfo" é inválida.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    })

    it('should return customerInfo.name error', async () => {
      const emailContent = deepCopy(validEmailContent)
      emailContent.customerInfo.name = null

      const event = {
        body: JSON.stringify({
          email: {
            content: emailContent,
          },
        }),
      }

      const res = await lambdaHandler(event)
      expect(res.body).toMatchObject({
        title: 'Conteúdo do e-mail é inválido',
        detail: 'Propriedade "customerInfo.name" é inválida.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    })

    it('should return customerInfo.emailAddress error', async () => {
      const emailContent = deepCopy(validEmailContent)
      emailContent.customerInfo.emailAddress = null

      const event = {
        body: JSON.stringify({
          email: {
            content: emailContent,
          },
        }),
      }

      const res = await lambdaHandler(event)
      expect(res.body).toMatchObject({
        title: 'Conteúdo do e-mail é inválido',
        detail: 'Propriedade "customerInfo.emailAddress" é inválida.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    })

    it('should return invalid customerInfo.cartItems error', async () => {
      const emailContent = deepCopy(validEmailContent)
      emailContent.cartItems = null

      const event = {
        body: JSON.stringify({
          email: {
            content: emailContent,
          },
        }),
      }

      const res = await lambdaHandler(event)
      expect(res.body).toMatchObject({
        title: 'Conteúdo do e-mail é inválido',
        detail: 'Propriedade "cartItems" é inválida.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    })

    it('should return empty customerInfo.cartItems error', async () => {
      const emailContent = deepCopy(validEmailContent)
      emailContent.cartItems = []

      const event = {
        body: JSON.stringify({
          email: {
            content: emailContent,
          },
        }),
      }

      const res = await lambdaHandler(event)
      expect(res.body).toMatchObject({
        title: 'Conteúdo do e-mail é inválido',
        detail: 'Propriedade "cartItems" está vazia.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    })

    it('should return invalid customerInfo.cartItems items error', async () => {
      const emailContent = deepCopy(validEmailContent)
      const invalidItem = {
        product: {
          reference: '102',
        },
        quantity: 100,
      }
      const invalidItems = [...emailContent.cartItems].concat(invalidItem)
      emailContent.cartItems = invalidItems

      const event = {
        body: JSON.stringify({
          email: {
            content: emailContent,
          },
        }),
      }

      const res = await lambdaHandler(event)
      expect(res.body).toMatchObject({
        title: 'Conteúdo do e-mail é inválido',
        detail: 'Itens da propriedade "cartItems" são inválidos.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    })
  })

  describe('reCAPTCHA validation', () => {
    it('should return error when reCAPTCHA secret is not set', async () => {
      const event = {
        body: JSON.stringify({
          email: {
            content: validEmailContent,
          },
        }),
      }

      ssm.getParameter.mockResolvedValueOnce('')
      const res = await lambdaHandler(event)
      expect(res.body).toMatchObject({
        title: 'Ocorreu um erro ao verificar o reCAPTCHA',
        detail: 'Parâmetro com segredo não foi atribuído no SSM.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    })

    it('should return error when reCAPTCHA is invalid ', async () => {
      const body = JSON.stringify({
        recaptchaToken: 'token',
        email: {
          content: validEmailContent,
        },
      })

      const event = {
        body,
      }

      ssm.getParameter.mockResolvedValueOnce('secret')
      recaptcha.isValidToken.mockResolvedValueOnce(false)
      const res = await lambdaHandler(event)
      expect(res.body).toMatchObject({
        title: 'reCAPTCHA inválido',
        detail: 'Token do reCAPTCHA não é válido.',
        statusCode: StatusCodes.BAD_REQUEST,
      })
    })
  })

  it('should successfully send email', async () => {
    const body = JSON.stringify({
      recaptchaToken: 'token',
      email: {
        content: validEmailContent,
      },
    })

    const event = {
      body,
    }

    ssm.getParameter.mockResolvedValueOnce('secret')
    recaptcha.isValidToken.mockResolvedValueOnce(true)

    const sendEmailOutputMock = {
      MessageId: '1',
    }
    ses.sendEmail.mockResolvedValueOnce(sendEmailOutputMock)

    const res = await lambdaHandler(event)
    expect(res).toMatchObject({
      headers: { 'Content-Type': 'application/json' },
      body: {
        message: 'Solicitação de orçamento enviada com sucesso.',
        statusCode: StatusCodes.OK,
      },
    })
  })
})
