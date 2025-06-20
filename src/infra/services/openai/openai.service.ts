import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

@Injectable()
export class OpenAiService {
  private openai: OpenAI

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')

    this.openai = new OpenAI({
      apiKey,
    })
  }

  async createCompletion(prompt: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    })
    return response.choices[0].message.content
  }
}
