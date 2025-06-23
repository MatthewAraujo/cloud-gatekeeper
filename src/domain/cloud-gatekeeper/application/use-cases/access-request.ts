import { Injectable, Logger } from '@nestjs/common'
import { OpenAiService } from '@/infra/services/openai/openai.service'
import { SlackService } from '@/infra/services/slack/slack.service'
import { AccessRequestRepository } from '../repositories/access-repository'
import { UserRepository } from '../repositories/user-repository'
import { AccessRequest } from '@/domain/cloud-gatekeeper/enterprise/entities/access-request'

interface AccessRequestUseCaseRequest {
	message: string
	requesterId: string
}

const slackChannel = 'C0700000000'

@Injectable()
export class AccessRequestUseCase {
	private readonly logger = new Logger(AccessRequestUseCase.name)

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
			this.logger.warn(`User not found: ${requesterId}`)
			throw new Error('User not found')
		}
		// const response = await this.openaiService.createCompletion(message)
		const response = 'ok'

		if (!response) {
			this.logger.warn('No response from openai')
			throw new Error('No response from openai')
		}

		await this.slackService.sendMessage({ channel: slackChannel, message: response })

		const projectMatch = message.match(/project\s+([\w-]+)/)
		const project = projectMatch ? projectMatch[1] : 'unknown-project'

		const accessRequest = AccessRequest.create({
			requesterId: user.id,
			requesterEmail: user.email,
			project,
		})
		await this.accessRequestRepository.create(accessRequest)
	}
}
