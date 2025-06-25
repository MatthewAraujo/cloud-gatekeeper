import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { Public } from '@/infra/auth/public'

interface SlackInteractionPayload {
  type: string
  user: {
    id: string
    username: string
    name: string
  }
  actions: Array<{
    action_id: string
    value: string
  }>
}

@Controller('slack-interactions')
export class SlackInteractionController {
  private readonly logger = new Logger(SlackInteractionController.name)

  constructor(private readonly httpService: HttpService) { }

  @Public()
  @Post('interactive')
  @HttpCode(HttpStatus.OK)
  async handleInteractiveMessage(@Body() body: any) {
    let payload: SlackInteractionPayload | undefined
    try {
      // Slack sends the payload as a URL-encoded string
      if (!body || !body.payload) {
        this.logger.error('No payload found in request body')
        return { text: 'Error: No payload found in request.' }
      }

      try {
        payload = JSON.parse(body.payload) as SlackInteractionPayload
      } catch (parseError) {
        this.logger.error('Failed to parse payload:', parseError)
        return { text: 'Error: Invalid payload format.' }
      }

      if (!payload.actions || !payload.actions[0]) {
        this.logger.error('No action found in payload:', payload)
        return { text: 'Error: No action found in payload.' }
      }
      if (!payload.user || !payload.user.id) {
        this.logger.error('No user info found in payload:', payload)
        return { text: 'Error: No user info found in payload.' }
      }

      this.logger.log('📱 Received Slack interaction:', {
        type: payload.type,
        userId: payload.user.id,
        actionId: payload.actions[0]?.action_id,
        value: payload.actions[0]?.value
      })

      const action = payload.actions[0]
      const accessRequestId = action.value
      const approverId = "U092Q1M7SNP"
      // payload.user.id

      if (action.action_id === 'approve_access_request') {
        try {
          await firstValueFrom(
            this.httpService.post(`http://localhost:3333/access-requests/${accessRequestId}/approve`, {
              approverId,
              action: 'APPROVE'
            }, {
              headers: { 'Content-Type': 'application/json' }
            })
          )
          this.logger.log(`✅ Approved access request ${accessRequestId} by ${approverId}`)
          return { text: 'Access request approved!' }
        } catch (apiError) {
          this.logger.error(`Error approving access request ${accessRequestId}:`, apiError)
          return { text: 'Error: Failed to approve access request. Please try again or contact support.' }
        }
      }

      if (action.action_id === 'deny_access_request') {
        try {
          await firstValueFrom(
            this.httpService.post(`http://localhost:3333/access-requests/${accessRequestId}/approve`, {
              approverId,
              action: 'REJECT',
              reason: 'Denied via Slack button'
            }, {
              headers: { 'Content-Type': 'application/json' }
            })
          )
          this.logger.log(`❌ Denied access request ${accessRequestId} by ${approverId}`)
          return { text: 'Access request denied!' }
        } catch (apiError) {
          this.logger.error(`Error denying access request ${accessRequestId}:`, apiError)
          return { text: 'Error: Failed to deny access request. Please try again or contact support.' }
        }
      }

      this.logger.warn('Unknown action_id:', action.action_id)
      return { text: 'Error: Unknown action.' }
    } catch (error) {
      this.logger.error('❌ Error handling Slack interaction:', error)
      return { text: 'Error: Unexpected server error.' }
    }
  }
} 