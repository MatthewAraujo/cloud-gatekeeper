import { Injectable } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { AccessRequestCreatedEvent } from '../../enterprise/events/access-request-created-event'
import { SlackService } from '@/infra/services/slack/slack.service'

@Injectable()
export class OnAccessRequestCreated implements EventHandler {
  constructor(private readonly slackService: SlackService) { }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.handle.bind(this),
      AccessRequestCreatedEvent.name,
    )
  }

  private async handle(event: AccessRequestCreatedEvent) {
    try {
      const { accessRequest } = event

      console.log('📧 Access request created event received:', {
        accessRequestId: accessRequest.id.toString(),
        requesterEmail: accessRequest.requesterEmail,
        project: accessRequest.project,
      })

      // Send notification to cloud admins about new access request
      const message = this.buildAccessRequestNotification(accessRequest)
      const adminChannel = 'C0700000000' // Cloud admins channel

      try {
        await this.slackService.sendMessage({ channel: adminChannel, message })
        console.log('✅ Slack notification sent to admin channel for new access request')
      } catch (slackError) {
        console.error('❌ Failed to send Slack notification to admin channel:', slackError)
        // Don't throw to prevent event system crashes
      }
    } catch (error) {
      console.error('❌ Critical error in OnAccessRequestCreated handler:', error)
      // Don't throw to prevent event system crashes
    }
  }

  private buildAccessRequestNotification(accessRequest: any): string {
    return `🔐 *New Access Request*
		
*Requester:* ${accessRequest.requesterEmail}
*Project:* ${accessRequest.project}
*Status:* ${accessRequest.status}
*Requested at:* ${accessRequest.createdAt.toISOString()}

Please review and approve/reject this request.`
  }
} 