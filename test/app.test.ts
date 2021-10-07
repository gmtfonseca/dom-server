/* eslint-disable @typescript-eslint/no-explicit-any */

import { StatusCodes } from 'http-status-codes'
import { mocked } from 'ts-jest/utils'
import { lambdaHandler } from '../src/app'
import recaptcha from '../src/recaptcha'
import ses from '../src/ses'
import ssm from '../src/ssm'

jest.mock('../src/recaptcha')
jest.mock('../src/ses')
jest.mock('../src/ssm')

const mockedRecaptcha = mocked(recaptcha, true)
const mockedSes = mocked(ses, true)
const mockedSsm = mocked(ssm, true)

describe('App', () => {
  it('should return error when env vars are not set', async () => {
    const OLD_ENV = process.env
    const event = {
      body: JSON.stringify({
        email: {
          content: 'Test',
        },
      }),
    } as any

    const clearVarAndTest = async (varName: string) => {
      jest.resetModules()
      process.env = { ...OLD_ENV }
      process.env[varName] = ''

      const res = (await lambdaHandler(event)) as any
      expect(res.body).toMatchObject({
        title: 'Erro de ambiente',
        detail: `Variável de ambiente "${varName}" não definida.`,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      })

      process.env = OLD_ENV
    }

    await clearVarAndTest('RECAPTCHA_SCORE_THRESHOLD')
    await clearVarAndTest('EMAIL_SOURCE')
    await clearVarAndTest('EMAIL_DEST')
    await clearVarAndTest('EMAIL_SUBJECT')
  })

  it('should return error when no body is passed', async () => {
    const event = {
      body: '',
    } as any

    const res = (await lambdaHandler(event)) as any
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
    } as any

    const res = (await lambdaHandler(event)) as any
    expect(res.body).toMatchObject({
      title: 'Email vazio',
      detail: 'Não é possível enviar um email sem conteúdo.',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  })

  it('should return error when reCAPTCHA secret is not set', async () => {
    const event = {
      body: JSON.stringify({
        email: {
          content: 'Test',
        },
      }),
    } as any

    mockedSsm.getParameter.mockResolvedValueOnce('')
    const res = (await lambdaHandler(event)) as any
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
        subject: 'To Doe',
        content: 'Hello world',
      },
    })

    const event = {
      body,
    } as any

    mockedSsm.getParameter.mockResolvedValueOnce('secret')
    mockedRecaptcha.isValidToken.mockResolvedValueOnce(false)
    const res = (await lambdaHandler(event)) as any
    expect(res.body).toMatchObject({
      title: 'reCAPTCHA inválido',
      detail: 'Token do reCAPTCHA não é válido.',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  })

  it('should successfully send email', async () => {
    const body = JSON.stringify({
      recaptchaToken: 'token',
      email: {
        subject: 'To Doe',
        content: 'Hello world',
      },
    })

    const event = {
      body,
    } as any

    mockedSsm.getParameter.mockResolvedValueOnce('secret')
    mockedRecaptcha.isValidToken.mockResolvedValueOnce(true)

    const sendEmailOutputMock = {
      MessageId: '1',
    } as any
    mockedSes.sendEmail.mockResolvedValueOnce(sendEmailOutputMock)

    const res = (await lambdaHandler(event)) as any
    expect(res).toMatchObject({
      headers: { 'Content-Type': 'application/json' },
      body: {
        message: 'Solicitação de orçamento enviada com sucesso.',
        statusCode: StatusCodes.OK,
      },
    })
  })
})
