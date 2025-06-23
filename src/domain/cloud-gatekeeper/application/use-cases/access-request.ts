import { Injectable } from '@nestjs/common'
import { OpenAiService } from '@/infra/services/openai/openai.service'
import { SlackService } from '@/infra/services/slack/slack.service'
import { AccessRequestRepository } from '../repositories/access-repository'
import { UserRepository } from '../repositories/user-repository'

interface AccessRequestUseCaseRequest {
	message: string
	requesterId: string
}

const slackChannel = 'C0700000000'

@Injectable()
export class AccessRequestUseCase {
	constructor(
		private readonly accessRequestRepository: AccessRequestRepository,
		private readonly userRepository: UserRepository,
		private readonly openaiService: OpenAiService,
		private readonly slackService: SlackService
	) { }
	async execute(request: AccessRequestUseCaseRequest): Promise<void> {
		const { message, requesterId } = request

		const user = await this.userRepository.findById(requesterId)

		if (!user) {
			throw new Error('User not found')
		}
		//const response = await this.openaiService.createCompletion(message)
		const response = 'ok'

		if (!response) {
			throw new Error('No response from openai')
		}

		await this.slackService.sendMessage(slackChannel, response)

		// A simple way to get the project from the message for now
		const projectMatch = message.match(/project\s+([\w-]+)/)
		const project = projectMatch ? projectMatch[1] : 'unknown-project'

		await this.accessRequestRepository.create({
			requesterId: user.id,
			requesterEmail: user.email,
			project,
		})
	}
}
