import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const client = new SSMClient({ region: 'sa-east-1' })

export default {
  getParameter: async function (name: string): Promise<string> {
    const command = new GetParameterCommand({
      Name: name,
      WithDecryption: true,
    })

    const res = await client.send(command)
    const value = res.Parameter?.Value || ''
    return value
  },
}
