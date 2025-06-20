import { Module } from '@nestjs/common'
import { OpenAiService } from './openai/openai.service'
import { SlackService } from './slack/slack.service'

@Module({
  providers: [OpenAiService, SlackService],
  exports: [OpenAiService, SlackService],
})
export class ServicesModule { }
