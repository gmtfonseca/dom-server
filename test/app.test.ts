/* eslint-disable @typescript-eslint/no-explicit-any */
import { lambdaHandler } from '../src/app'
import { ErrorResponse } from '../src/util'

describe('App', () => {
  it('should throw error when env vars are not set', async () => {
    const OLD_ENV = process.env
    const event = {
      body: JSON.stringify({
        email: {
          body: 'Test',
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
        statusCode: 500,
      })

      process.env = OLD_ENV
    }

    await clearVarAndTest('RECAPTCHA_SECRET')
    await clearVarAndTest('RECAPTCHA_SCORE_THRESHOLD')
    await clearVarAndTest('EMAIL_SOURCE')
    await clearVarAndTest('EMAIL_DEST')
    await clearVarAndTest('EMAIL_SUBJECT')
  })

  it('should throw error when no body is passed', async () => {
    const event = {
      body: '',
    }
    try {
      await lambdaHandler(event as any)
      console.log('worked')
    } catch (e) {
      if (e instanceof ErrorResponse) {
        expect(e.body).toMatchObject({
          title: 'Invalid body',
          statusCode: 400,
        })
      }
    }
  })

  /* it('should throw error when recaptcha is invalid ', () => {}) */

  /* it('should send email with success', () => {}) */
})
