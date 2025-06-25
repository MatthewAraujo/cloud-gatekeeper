import { Module } from '@nestjs/common'
import { OpenAiService } from './openai/openai.service'
import { SlackService } from './slack/slack.service'
import { PrismaLogRepository } from '../database/prisma/repository/prisma-log.repository'
import { LogService } from './log/log.service'
import { DatabaseModule } from '../database/database.module'
import { AwsModule } from './aws/aws.module'
import { EnvModule } from '../env/env.module'

@Module({
  imports: [DatabaseModule, AwsModule, EnvModule],
  providers: [OpenAiService, SlackService, PrismaLogRepository, LogService],
  exports: [OpenAiService, SlackService, PrismaLogRepository, LogService, AwsModule, DatabaseModule],
})
export class ServicesModule { }
