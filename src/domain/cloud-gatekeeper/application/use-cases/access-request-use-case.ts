import { Injectable, Logger } from '@nestjs/common'
import { OpenAiService } from '@/infra/services/openai/openai.service'
import { AccessRequestRepository } from '../repositories/access-repository'
import { UserRepository } from '../repositories/user-repository'
import { AccessRequest } from '@/domain/cloud-gatekeeper/enterprise/entities/access-request'

interface AccessRequestUseCaseRequest {
	message: string
	requesterId: string
}

@Injectable()
export class AccessRequestUseCase {
	private readonly logger = new Logger(AccessRequestUseCase.name)

	constructor(
		private readonly accessRequestRepository: AccessRequestRepository,
		private readonly userRepository: UserRepository,
		private readonly openaiService: OpenAiService,
	) { }
	async execute(request: AccessRequestUseCaseRequest): Promise<void> {
		const { message, requesterId } = request

		const user = await this.userRepository.findById(requesterId)

		if (!user) {
			this.logger.warn(`User not found: ${requesterId}`)
			throw new Error('User not found')
		}

		this.logger.debug(`User found: ${user.id}, email: ${user.email}, username: ${user.username}`)

		const openAiResponse = await this.openaiService.createCompletion(
			`Analyze this access request message and extract the project name and required AWS permissions. 
			Return a JSON object with "project" and "permissions" fields.
			Message: "${message}"

			Return only the json

			Example response format:
			{
				"project": "analytics-prod",
				"permissions": ["s3:GetObject", "s3:ListBucket"]
			}`
		)

		if (!openAiResponse) {
			this.logger.warn('No response from openai')
			throw new Error('No response from openai')
		}

		this.logger.debug('OpenAi Responde', openAiResponse)

		// Parse OpenAI response to extract project and permissions
		let project = 'unknown-project'
		let permissions: string[] = []

		try {
			const parsedResponse = JSON.parse(openAiResponse)
			project = parsedResponse.project || project
			permissions = parsedResponse.permissions || permissions
		} catch (error) {
			this.logger.warn('Failed to parse OpenAI response, using fallback values')
			// Fallback to regex extraction if JSON parsing fails
			const projectMatch = message.match(/project\s+([\w-]+)/)
			project = projectMatch ? projectMatch[1] : project
			permissions = ['s3:GetObject', 's3:ListBucket'] // Default read-only access
		}

		const finalUsername = user.username
		this.logger.debug(`Using username for access request: ${finalUsername}`)

		const accessRequest = AccessRequest.create({
			requesterId: user.id,
			requesterEmail: user.email,
			username: finalUsername,
			project,
			permissions,
		})
		await this.accessRequestRepository.create(accessRequest)
	}
}
