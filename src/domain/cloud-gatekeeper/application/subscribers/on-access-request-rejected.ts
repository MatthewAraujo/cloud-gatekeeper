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
    const { accessRequest, approverId, reason } = event

    console.log('❌ Access request rejected event received:', {
      accessRequestId: accessRequest.id.toString(),
      requesterEmail: accessRequest.requesterEmail,
      project: accessRequest.project,
      approverId,
      reason,
    })

    // Send notification to requester about rejection
    const message = this.buildRejectionNotification(accessRequest, approverId, reason)

    // Send to the requester's Slack channel
    await this.slackService.sendMessage({ channel: accessRequest.requesterId, message })

    // You could also trigger other side effects here:
    // - Update audit logs
    // - Send email notification
    // - Trigger follow-up workflows
  }

  private buildRejectionNotification(accessRequest: any, approverId: string, reason?: string): string {
    let message = `❌ *Access Request Rejected*
		
Your access request for project *${accessRequest.project}* has been rejected.

*Project:* ${accessRequest.project}
*Rejected by:* ${approverId}
*Rejected at:* ${accessRequest.updatedAt.toISOString()}`

    if (reason) {
      message += `\n*Reason:* ${reason}`
    }

    message += '\n\nIf you believe this was an error or need to provide additional information, please contact the cloud admin team.'



    return message
  }
} 