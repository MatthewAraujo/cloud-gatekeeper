import { Injectable } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { AccessRequestApprovedEvent } from '../../enterprise/events/access-request-approved-event'
import { SlackService } from '@/infra/services/slack/slack.service'
import { AwsService } from '@/infra/services/aws/aws.service'
import { UserRepository } from '../repositories/user-repository'

@Injectable()
export class OnAccessRequestApproved implements EventHandler {
  constructor(
    private readonly slackService: SlackService,
    private readonly userRepository: UserRepository,
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

      const user = await this.userRepository.findById(approverId)
      if (!user) {
        return
      }

      try {
        await this.slackService.sendAccessRequestApprovedNotification(accessRequest, { id: approverId, email: user.username })
        console.log(`✅ Slack notification sent to user ${accessRequest.requesterId}`)
      } catch (slackError) {
        console.error(`❌ Failed to send Slack notification to user ${accessRequest.requesterId}:`, slackError)
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

        if (awsError instanceof Error && awsError.message?.includes('does not exist')) {
          try {
            const existingUsers = await this.awsService.listUsers()
            console.error(`💡 Available IAM users: ${existingUsers.join(', ')}`)
            console.error(`💡 Requested user '${accessRequest.username}' is not in the list above.`)
          } catch (listError) {
            console.error('💡 Could not list existing IAM users for debugging:', listError)
          }
        }

        console.error(`⚠️ Access request approved in database but AWS access was NOT granted. User ${accessRequest.username} may not exist in AWS IAM.`)
      }
    } catch (error) {
      console.error('❌ Critical error in OnAccessRequestApproved handler:', error)
    }
  }
} 