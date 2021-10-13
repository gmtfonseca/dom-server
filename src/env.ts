import { EnvVars } from './types'
import logger from './logger'

export default {
  loadVars(): EnvVars {
    logger.info('Loading env vars')

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
  },
}
