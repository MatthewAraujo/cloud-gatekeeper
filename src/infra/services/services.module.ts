import { Module } from '@nestjs/common'
import { OpenAiService } from './openai/openai.service'

@Module({
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class ServicesModule { }
