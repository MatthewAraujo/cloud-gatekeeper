import { ApproveAccessRequestUseCase } from '@/domain/forum/application/use-cases/approve-access-request'
import { Public } from '@/infra/auth/public'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { Body, Controller, Post, Param } from '@nestjs/common'
import { z } from 'zod'

const approveAccessRequestBodySchema = z.object({
  approverId: z.string(),
  action: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(approveAccessRequestBodySchema)

type ApproveAccessRequestBodySchema = z.infer<typeof approveAccessRequestBodySchema>

@Public()
@Controller('/access-requests')
export class ApproveAccessRequestController {
  constructor(private approveAccessRequest: ApproveAccessRequestUseCase) { }

  @Post(':id/approve')
  async handle(
    @Param('id') accessRequestId: string,
    @Body(bodyValidationPipe) body: ApproveAccessRequestBodySchema,
  ) {
    console.log('🔐 POST /access-requests/:id/approve received', { accessRequestId, body })

    const { approverId, action, reason } = body

    await this.approveAccessRequest.execute({
      accessRequestId,
      approverId,
      action,
      reason,
    })

    console.log('✅ POST /access-requests/:id/approve completed successfully')
  }
} 