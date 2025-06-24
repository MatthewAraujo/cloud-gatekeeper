import { Injectable } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { AccessRequestApprovedEvent } from '../../enterprise/events/access-request-approved-event'
import { SlackService } from '@/infra/services/slack/slack.service'
import { AwsService } from '@/infra/services/aws/aws.service'

@Injectable()
export class OnAccessRequestApproved implements EventHandler {
  constructor(
    private readonly slackService: SlackService,
    private readonly awsService: AwsService,
  ) { }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.handle.bind(this),
      AccessRequestApprovedEvent.name,
    )
  }

  private async handle(event: AccessRequestApprovedEvent) {
    try {
      const { accessRequest, approverId } = event

      console.log('✅ Access request approved event received:', {
        accessRequestId: accessRequest.id.toString(),
        requesterEmail: accessRequest.requesterEmail,
        project: accessRequest.project,
        permissions: accessRequest.permissions,
        approverId,
      })

      const message = this.buildApprovalNotification(accessRequest, approverId)

      try {
        await this.slackService.sendMessage({ channel: accessRequest.requesterId, message })
        console.log(`✅ Slack notification sent to user ${accessRequest.requesterId}`)
      } catch (slackError) {
        console.error(`❌ Failed to send Slack notification to user ${accessRequest.requesterId}:`, slackError)
        // Continue with AWS operations even if Slack fails
      }

      try {
        await this.awsService.grantProjectAccess({
          username: accessRequest.username,
          project: accessRequest.project,
          permissions: accessRequest.permissions,
        })
        console.log(`✅ AWS access granted for user ${accessRequest.username} to project ${accessRequest.project} with permissions: ${accessRequest.permissions.join(', ')}`)
      } catch (awsError) {
        console.error(`❌ Failed to grant AWS access for user ${accessRequest.username}:`, awsError)
        // Note: We don't throw here to avoid breaking the event flow
        // The access request is still approved even if AWS operations fail
      }
    } catch (error) {
      console.error('❌ Critical error in OnAccessRequestApproved handler:', error)
      // Don't throw to prevent event system crashes
    }
  }

  private buildApprovalNotification(accessRequest: any, approverId: string): string {
    return `🎉 *Access Request Approved*
		
Your access request for project *${accessRequest.project}* has been approved!

*Project:* ${accessRequest.project}
*Permissions:* ${accessRequest.permissions.join(', ')}
*Approved by:* ${approverId}
*Approved at:* ${accessRequest.updatedAt.toISOString()}

Your AWS access has been granted with the requested permissions. You should be able to access the resources now. If you have any questions, please contact the cloud admin team.`
  }
} 