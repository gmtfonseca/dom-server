import { IsValidTokenInput, RecaptchaResponse } from './types'
import axios from 'axios'

export default {
  isValidToken: async function (input: IsValidTokenInput): Promise<boolean> {
    const { secret, scoreThreshold, token } = input
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`
    const res = await axios.post(url)
    const { score } = res.data as RecaptchaResponse
    return score >= scoreThreshold
  },
}
