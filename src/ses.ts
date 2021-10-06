import { SendEmailInput } from './types'

import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandOutput,
} from '@aws-sdk/client-ses'

const sesClient = new SESClient({ region: 'sa-east-1' })

export default {
  sendEmail: async function (
    input: SendEmailInput
  ): Promise<SendEmailCommandOutput> {
    const { source, dest, email } = input
    const params = {
      Destination: {
        ToAddresses: dest,
      },
      Message: {
        Subject: { Data: email.subject },
        Body: {
          Text: { Data: email.content },
        },
      },
      Source: source,
    }

    const command = new SendEmailCommand(params)
    const res = await sesClient.send(command)
    return res
  },
}
