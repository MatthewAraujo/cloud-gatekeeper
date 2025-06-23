import { Injectable } from '@nestjs/common'

export interface SendMessageParams {
  channel: string
  message: string
}

export interface BuildAccessRequestMessageParams {
  accessRequest: any
  approver: any
  action: 'APPROVE' | 'REJECT'
  reason?: string
}

@Injectable()
export class SlackService {
  async sendMessage({ channel, message }: SendMessageParams): Promise<void> {
    // TODO: Implement actual Slack API call here
    // Example: await slackClient.chat.postMessage({ channel, text: message })

    console.log(`[${channel}] - message : ${message}`)
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  buildAccessRequestMessage({
    accessRequest,
    approver,
    action,
    reason
  }: BuildAccessRequestMessageParams): string {
    const status = action === 'APPROVE' ? '✅ APPROVED' : '❌ REJECTED'
    const baseMessage = `Your access request for project "${accessRequest.project}" has been ${status} by ${approver.email}`

    if (action === 'REJECT' && reason) {
      return `${baseMessage}\nReason: ${reason}`
    }

    return baseMessage
  }
} 