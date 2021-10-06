/* eslint-disable @typescript-eslint/no-explicit-any */

import { StatusCodes } from 'http-status-codes'
import { mocked } from 'ts-jest/utils'
import { lambdaHandler } from '../src/app'
import recaptcha from '../src/recaptcha'
import ses from '../src/ses'

jest.mock('../src/recaptcha')
jest.mock('../src/ses')

const mockedRecaptcha = mocked(recaptcha, true)
const mockedSes = mocked(ses, true)

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

    await clearVarAndTest('RECAPTCHA_SECRET')
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
      title: 'Conteúdo inválido',
      detail: 'Não é possível enviar um email sem conteúdo',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  })

  it('should throw error when recaptcha is invalid ', async () => {
    const body = JSON.stringify({
      recaptchaToken: 'token',
      email: {
        subject: 'To Doe',
        body: 'Hello world',
      },
    })

    const event = {
      body,
    } as any

    mockedRecaptcha.isValidToken.mockResolvedValueOnce(false)
    const res = (await lambdaHandler(event)) as any
    expect(res.body).toMatchObject({
      title: 'reCAPTCHA inválido',
      detail: 'Resulado de reCAPTCHA não ultrapossou limite mínimo.',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  })

  it('should successfully send email', async () => {
    const body = JSON.stringify({
      recaptchaToken: 'token',
      email: {
        subject: 'To Doe',
        body: 'Hello world',
      },
    })

    const event = {
      body,
    } as any

    mockedRecaptcha.isValidToken.mockResolvedValueOnce(true)

    const sendEmailOutputMock = {
      MessageId: '1',
    } as any
    mockedSes.sendEmail.mockResolvedValueOnce(sendEmailOutputMock)

    const res = (await lambdaHandler(event)) as any
    expect(res).toMatchObject({
      message: 'Solicitação de orçamento enviada com sucesso.',
    })
  })
})
