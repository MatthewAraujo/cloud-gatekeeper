import { Injectable } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { AccessRequestApprovedEvent } from '../../enterprise/events/access-request-approved-event'
import { SlackService } from '@/infra/services/slack/slack.service'

@Injectable()
export class OnAccessRequestApproved implements EventHandler {
  constructor(private readonly slackService: SlackService) { }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.handle.bind(this),
      AccessRequestApprovedEvent.name,
    )
  }

  private async handle(event: AccessRequestApprovedEvent) {
    const { accessRequest, approverId } = event

    console.log('✅ Access request approved event received:', {
      accessRequestId: accessRequest.id.toString(),
      requesterEmail: accessRequest.requesterEmail,
      project: accessRequest.project,
      approverId,
    })

    // Send notification to requester about approval
    const message = this.buildApprovalNotification(accessRequest, approverId)

    // Send to the requester's Slack channel
    await this.slackService.sendMessage({ channel: accessRequest.requesterId, message })

    // You could also trigger other side effects here:
    // - Grant actual cloud access
    // - Send email notification
    // - Update audit logs
    // - Trigger provisioning workflows
  }

  private buildApprovalNotification(accessRequest: any, approverId: string): string {
    return `🎉 *Access Request Approved*
		
Your access request for project *${accessRequest.project}* has been approved!

*Project:* ${accessRequest.project}
*Approved by:* ${approverId}
*Approved at:* ${accessRequest.updatedAt.toISOString()}

You should receive access credentials shortly. If you have any questions, please contact the cloud admin team.`
  }
} 