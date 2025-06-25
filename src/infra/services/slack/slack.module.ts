import { Module } from '@nestjs/common'
import { SlackService } from './slack.service'
import { EnvModule } from '../../env/env.module'

@Module({
  imports: [EnvModule],
  providers: [SlackService],
  exports: [SlackService],
})
export class SlackModule { } 