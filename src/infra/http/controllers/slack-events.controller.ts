import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { Public } from '@/infra/auth/public'
import { SlackService, BotMentionEvent } from '@/infra/services/slack/slack.service'
import { UserRepository } from '@/domain/cloud-gatekeeper/application/repositories/user-repository'

interface SlackEventPayload {
  type: string
  event: BotMentionEvent
  team_id: string
  event_id: string
  event_time: number
}

interface SlackUrlVerification {
  type: 'url_verification'
  challenge: string
}

@Controller('slack-events')
export class SlackEventsController {
  private readonly logger = new Logger(SlackEventsController.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly slackService: SlackService,
    private readonly userRepository: UserRepository
  ) { }

  @Public()
  @Post('events')
  @HttpCode(HttpStatus.OK)
  async handleSlackEvents(@Body() body: SlackEventPayload | SlackUrlVerification) {
    try {
      // Handle URL verification challenge
      if (body.type === 'url_verification') {
        const challenge = (body as SlackUrlVerification).challenge
        this.logger.log('🔗 Slack URL verification challenge received')
        return { challenge }
      }

      // Handle actual events
      if (body.type === 'event_callback') {
        const eventPayload = body as SlackEventPayload
        const event = eventPayload.event

        this.logger.log('📨 Received Slack event:', {
          type: event.type,
          userId: event.user,
          channel: event.channel,
          text: `${event.text?.substring(0, 100)}...`
        })

        // Handle bot mentions
        if (event.type === 'app_mention') {
          return await this.handleBotMention(event)
        }

        // Handle direct messages to the bot
        if (event.type === 'message' && event.channel.startsWith('D')) {
          return await this.handleDirectMessage(event)
        }
      }

      // Return 200 for unhandled events to acknowledge receipt
      return { ok: true }
    } catch (error) {
      this.logger.error('❌ Error handling Slack event:', error)
      return { ok: false, error: 'Internal server error' }
    }
  }

  @Public()
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testBot() {
    try {
      // Test bot user ID
      const botUserId = await this.slackService.getBotUserId()

      // Test sending a message to default channel
      await this.slackService.sendMessage({
        channel: '#general', // You can change this to your default channel
        message: '🤖 Bot is online and ready to receive mentions!'
      })

      return {
        ok: true,
        message: 'Bot test successful',
        botUserId: botUserId || 'Not found'
      }
    } catch (error) {
      this.logger.error('❌ Bot test failed:', error)
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async handleBotMention(event: BotMentionEvent) {
    try {
      // Extract bot mention data
      const mentionData = await this.slackService.extractBotMentionData(event)

      if (!mentionData) {
        this.logger.log('📝 No valid bot mention data extracted')
        return { ok: true }
      }

      this.logger.log('🤖 Bot mention detected:', {
        slackId: mentionData.slackId,
        message: mentionData.message,
        channel: mentionData.channel
      })

      // Get user information
      const userInfo = await this.slackService.getUserInfo(mentionData.slackId)
      if (!userInfo) {
        this.logger.error(`❌ Failed to get user info for ${mentionData.slackId}`)
        return { ok: false, error: 'Failed to get user information' }
      }

      // Create access request
      await this.createAccessRequestFromSlack(mentionData, userInfo)

      // Send confirmation message
      await this.slackService.sendMessage({
        channel: mentionData.channel,
        message: `✅ I've received your access request: "${mentionData.message}". I'll process it and get back to you soon!`,
        threadTs: mentionData.timestamp
      })

      return { ok: true }
    } catch (error) {
      this.logger.error('❌ Error handling bot mention:', error)

      // Send appropriate error message to user
      let errorMessage = '❌ Sorry, I encountered an error processing your request. Please try again or contact support.'

      if (error instanceof Error && error.message === 'User not found') {
        errorMessage = '❌ Sorry, I couldn\'t find your user account. Please contact an administrator to set up your account first.'
      }

      try {
        await this.slackService.sendMessage({
          channel: event.channel,
          message: errorMessage,
          threadTs: event.ts
        })
      } catch (sendError) {
        this.logger.error('❌ Failed to send error message:', sendError)
      }

      return { ok: false, error: 'Failed to process bot mention' }
    }
  }

  private async handleDirectMessage(event: BotMentionEvent) {
    try {
      this.logger.log('💬 Direct message received:', {
        slackId: event.user,
        message: event.text
      })

      // Get user information
      const userInfo = await this.slackService.getUserInfo(event.user)
      if (!userInfo) {
        this.logger.error(`❌ Failed to get user info for ${event.user}`)
        return { ok: false, error: 'Failed to get user information' }
      }

      // Create access request from direct message
      const mentionData = {
        slackId: event.user,
        message: event.text,
        channel: event.channel,
        timestamp: event.ts
      }

      await this.createAccessRequestFromSlack(mentionData, userInfo)

      // Send confirmation message
      await this.slackService.sendMessage({
        channel: event.channel,
        message: `✅ I've received your access request: "${event.text}". I'll process it and get back to you soon!`
      })

      return { ok: true }
    } catch (error) {
      this.logger.error('❌ Error handling direct message:', error)

      // Send appropriate error message to user
      let errorMessage = '❌ Sorry, I encountered an error processing your request. Please try again or contact support.'

      if (error instanceof Error && error.message === 'User not found') {
        errorMessage = '❌ Sorry, I couldn\'t find your user account. Please contact an administrator to set up your account first.'
      }

      try {
        await this.slackService.sendMessage({
          channel: event.channel,
          message: errorMessage
        })
      } catch (sendError) {
        this.logger.error('❌ Failed to send error message:', sendError)
      }

      return { ok: false, error: 'Failed to process direct message' }
    }
  }

  private async createAccessRequestFromSlack(mentionData: any, userInfo: any) {
    try {
      const requesterId = await this.findUserBySlackId(mentionData.slackId)

      if (requesterId) {
        // Create access request
        await firstValueFrom(
          this.httpService.post('http://localhost:3333/access-requests', {
            requesterId,
            message: mentionData.message
          }, {
            headers: { 'Content-Type': 'application/json' }
          })
        )

        this.logger.log(`✅ Access request created for Slack user ${mentionData.slackId}`)
      } else {
        this.logger.error(`❌ User not found for Slack ID: ${mentionData.slackId}`)
        throw new Error('User not found')
      }
    } catch (error) {
      this.logger.error('❌ Error creating access request from Slack:', error)
      throw error
    }
  }

  private async findUserBySlackId(slackId: string): Promise<string | null> {
    try {
      // Try to find existing user by Slack ID
      const user = await this.userRepository.findBySlackId(slackId)

      if (user) {
        return user.id
      }

      this.logger.log(`👤 User not found for Slack ID: ${slackId}`)
      return null
    } catch (error) {
      this.logger.error(`❌ Error finding user for Slack ID ${slackId}:`, error)
      return null
    }
  }

} 