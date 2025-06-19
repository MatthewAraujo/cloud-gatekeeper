
import { Injectable } from '@nestjs/common'
import { OpenAiService } from '@/infra/services/openai/openai.service'
interface AccessRequestUseCaseRequest {
	message: string
}


@Injectable()
export class AccessRequestUseCase {
	constructor(private readonly openaiService: OpenAiService) { }
	async execute(request: AccessRequestUseCaseRequest): Promise<void> {
		const { message } = request

		const response = await this.openaiService.createCompletion(message)

		console.log('response from openai', response)


		console.log('Send message to openAI')
		console.log('Returned message sayind what credentials are needed', response)

		console.log('send message to chief user for confirmation')

	}
}
