import { IsValidTokenInput, RecaptchaResponse } from './types'
import fetch from 'node-fetch'

export default {
  isValidToken: async function (input: IsValidTokenInput): Promise<boolean> {
    /* const { secret, scoreThreshold, token } = input
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`
    const res = await fetch(url, {
      method: 'post',
    })
    const { score } = (await res.json()) as RecaptchaResponse
    return score >= scoreThreshold */
    return false
  },
}
