import { ListPendingAccessRequestsUseCase } from '@/domain/cloud-gatekeeper/application/use-cases/list-pending-access-requests'
import { Public } from '@/infra/auth/public'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { Query, Controller, Get } from '@nestjs/common'
import { z } from 'zod'

const listPendingAccessRequestsQuerySchema = z.object({
  viewerId: z.string(),
})

const queryValidationPipe = new ZodValidationPipe(listPendingAccessRequestsQuerySchema)

type ListPendingAccessRequestsQuerySchema = z.infer<typeof listPendingAccessRequestsQuerySchema>

@Public()
@Controller('/access-requests')
export class ListPendingAccessRequestsController {
  constructor(private listPendingAccessRequests: ListPendingAccessRequestsUseCase) { }

  @Get('/pending')
  async handle(@Query(queryValidationPipe) query: ListPendingAccessRequestsQuerySchema) {
    const { viewerId } = query

    const result = await this.listPendingAccessRequests.execute({
      viewerId,
    })


    return result
  }
} 