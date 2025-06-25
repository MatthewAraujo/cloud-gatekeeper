import { Injectable } from '@nestjs/common'
import { WebClient } from '@slack/web-api'
import { EnvService } from '../../env/env.service'

export interface SendMessageParams {
  channel: string
  message: string
  threadTs?: string
  blocks?: any[]
}

export interface SendInteractiveMessageParams {
  channel: string
  text: string
  blocks?: any[]
  threadTs?: string
}

export interface SendAccessRequestWithButtonsParams {
  channel: string
  accessRequest: any
  threadTs?: string
}

export interface BuildAccessRequestMessageParams {
  accessRequest: any
  approver: any
  action: 'APPROVE' | 'REJECT'
  reason?: string
}

export interface SendAccessRequestNotificationParams {
  accessRequest: any
  approver: any
  action: 'APPROVE' | 'REJECT'
  reason?: string
  channel?: string
}

@Injectable()
export class SlackService {
  private slackClient: WebClient

  constructor(private readonly envService: EnvService) {
    this.slackClient = new WebClient(this.envService.get('SLACK_BOT_TOKEN'))
  }

  async sendMessage({ channel, message, threadTs, blocks }: SendMessageParams): Promise<void> {
    try {
      const result = await this.slackClient.chat.postMessage({
        channel,
        text: message,
        thread_ts: threadTs,
        blocks: blocks,
      })

      if (!result.ok) {
        console.error(`❌ Slack API returned error: ${result.error}`)
        throw new Error(`Failed to send Slack message: ${result.error}`)
      }

      console.log(`✅ Message sent to Slack channel ${channel}`)
    } catch (error) {
      console.error('❌ Failed to send Slack message:', error)
      throw new Error(`Slack API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sendAccessRequestNotification({
    accessRequest,
    approver,
    action,
    reason,
    channel
  }: SendAccessRequestNotificationParams): Promise<void> {
    const message = this.buildAccessRequestMessage({
      accessRequest,
      approver,
      action,
      reason
    })

    const targetChannel = channel || this.envService.get('SLACK_DEFAULT_CHANNEL')

    await this.sendMessage({
      channel: targetChannel,
      message
    })
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

  async sendAccessRequestCreatedNotification(accessRequest: any, channel?: string): Promise<void> {
    const message = `🆕 New access request created!

*Project:* ${accessRequest.project}
*Requested by:* ${accessRequest.username || accessRequest.userId}
*Requested at:* ${new Date(accessRequest.createdAt).toLocaleString()}
*Status:* Pending approval`

    const targetChannel = channel || this.envService.get('SLACK_DEFAULT_CHANNEL')

    await this.sendMessage({
      channel: targetChannel,
      message
    })
  }

  async sendAccessRequestApprovedNotification(accessRequest: any, approver: any, channel?: string): Promise<void> {
    await this.sendAccessRequestNotification({
      accessRequest,
      approver,
      action: 'APPROVE',
      channel
    })
  }

  async sendAccessRequestRejectedNotification(accessRequest: any, approver: any, reason: string, channel?: string): Promise<void> {
    await this.sendAccessRequestNotification({
      accessRequest,
      approver,
      action: 'REJECT',
      reason,
      channel
    })
  }

  async sendInteractiveMessage({ channel, text, blocks, threadTs }: SendInteractiveMessageParams): Promise<void> {
    try {
      const result = await this.slackClient.chat.postMessage({
        channel,
        text: text,
        thread_ts: threadTs,
        blocks: blocks,
      })

      if (!result.ok) {
        console.error(`❌ Slack API returned error: ${result.error}`)
        throw new Error(`Failed to send interactive Slack message: ${result.error}`)
      }

      console.log(`✅ Interactive message sent to Slack channel ${channel}`)
    } catch (error) {
      console.error('❌ Failed to send interactive Slack message:', error)
      throw new Error(`Slack API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sendAccessRequestWithButtons({ channel, accessRequest, threadTs }: SendAccessRequestWithButtonsParams): Promise<void> {
    const blocks = this.buildAccessRequestBlocks(accessRequest)

    await this.sendInteractiveMessage({
      channel,
      text: `New access request from ${accessRequest.username || accessRequest.requesterEmail}`,
      blocks,
      threadTs,
    })
  }

  private buildAccessRequestBlocks(accessRequest: any): any[] {
    const requesterName = accessRequest.username || accessRequest.requesterEmail
    const projectName = accessRequest.project
    const permissions = Array.isArray(accessRequest.permissions)
      ? accessRequest.permissions.join(', ')
      : JSON.stringify(accessRequest.permissions)
    const createdAt = new Date(accessRequest.createdAt).toLocaleString()
    const accessRequestId = accessRequest.id?.toString() || 'unknown'

    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔐 New Access Request',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Requester:*\n${requesterName}`
          },
          {
            type: 'mrkdwn',
            text: `*Project:*\n${projectName}`
          },
          {
            type: 'mrkdwn',
            text: `*Permissions:*\n${permissions}`
          },
          {
            type: 'mrkdwn',
            text: `*Requested:*\n${createdAt}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Please review this access request and take action:'
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Approve',
              emoji: true
            },
            style: 'primary',
            action_id: 'approve_access_request',
            value: accessRequestId
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '❌ Deny',
              emoji: true
            },
            style: 'danger',
            action_id: 'deny_access_request',
            value: accessRequestId
          }
        ]
      }
    ]
  }
} 