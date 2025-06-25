import { Injectable } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { AccessRequestCreatedEvent } from '../../enterprise/events/access-request-created-event'
import { SlackService } from '@/infra/services/slack/slack.service'
import { EnvService } from '@/infra/env/env.service'

@Injectable()
export class OnAccessRequestCreated implements EventHandler {
  constructor(
    private readonly slackService: SlackService,
    private readonly envService: EnvService
  ) { }

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

      try {
        await this.slackService.sendAccessRequestWithButtons({
          channel: this.envService.get('SLACK_DEFAULT_CHANNEL'),
          accessRequest,
        })
        console.log('✅ Interactive Slack notification sent to admin channel for new access request')
      } catch (slackError) {
        console.error('❌ Failed to send interactive Slack notification to admin channel:', slackError)
      }
    } catch (error) {
      console.error('❌ Critical error in OnAccessRequestCreated handler:', error)
    }
  }
} 