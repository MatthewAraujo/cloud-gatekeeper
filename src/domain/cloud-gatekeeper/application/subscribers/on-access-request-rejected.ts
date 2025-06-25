import { Injectable } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { AccessRequestRejectedEvent } from '../../enterprise/events/access-request-rejected-event'
import { SlackService } from '@/infra/services/slack/slack.service'

@Injectable()
export class OnAccessRequestRejected implements EventHandler {
  constructor(private readonly slackService: SlackService) { }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.handle.bind(this),
      AccessRequestRejectedEvent.name,
    )
  }

  private async handle(event: AccessRequestRejectedEvent) {
    try {
      const { accessRequest, approverId, reason } = event

      console.log('❌ Access request rejected event received:', {
        accessRequestId: accessRequest.id.toString(),
        requesterEmail: accessRequest.requesterEmail,
        project: accessRequest.project,
        approverId,
        reason,
      })

      try {
        await this.slackService.sendAccessRequestRejectedNotification(accessRequest, { id: approverId, email: approverId }, reason || 'No reason provided')
        console.log(`✅ Rejection notification sent to user ${accessRequest.requesterId}`)
      } catch (slackError) {
        console.error(`❌ Failed to send rejection notification to user ${accessRequest.requesterId}:`, slackError)
        // Don't throw to prevent event system crashes
      }

      // You could also trigger other side effects here:
      // - Update audit logs
      // - Send email notification
      // - Trigger follow-up workflows
    } catch (error) {
      console.error('❌ Critical error in OnAccessRequestRejected handler:', error)
      // Don't throw to prevent event system crashes
    }
  }
} 