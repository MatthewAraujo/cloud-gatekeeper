import { AccessRequestUseCase } from '@/domain/forum/application/use-cases/access-request'
import { Public } from '@/infra/auth/public'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { Body, Controller, Post } from '@nestjs/common'
import { z } from 'zod'

const accessRequestBodySchema = z.object({
	message: z.string(),
	requesterId: z.string(),
	// reason: z.string().optional()
})

const bodyValidationPipe = new ZodValidationPipe(accessRequestBodySchema)

type AccessRequestBodySchema = z.infer<typeof accessRequestBodySchema>

@Public()
@Controller('/access-requests')
export class AccessRequestController {
	constructor(
		private accessRequest: AccessRequestUseCase
	) { }

	@Post()
	async handle(
		@Body(bodyValidationPipe) body: AccessRequestBodySchema,
	) {
		console.log('📨 POST /access-requests received', { body })
		const { message, requesterId } = body

		await this.accessRequest.execute({
			message,
			requesterId,
		})
		console.log('✅ POST /access-requests completed successfully')
	}
}
