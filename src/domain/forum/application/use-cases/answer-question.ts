
import { Injectable } from '@nestjs/common'
interface AccessRequestUseCaseRequest {
	message: string
}


@Injectable()
export class AccessRequestUseCase {
	async execute(request: AccessRequestUseCaseRequest): Promise<void> {
		const { message } = request

		console.log('Send message to openAI')

		console.log('Returned message sayind what credentials are needed',)

		console.log('send message to chief user for confirmation')

	}
}
