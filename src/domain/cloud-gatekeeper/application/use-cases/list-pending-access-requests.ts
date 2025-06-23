import { Injectable, ForbiddenException, Logger } from '@nestjs/common'
import { AccessRequestRepository } from '../repositories/access-repository'
import { UserRepository } from '../repositories/user-repository'

interface ListPendingAccessRequestsUseCaseRequest {
  viewerId: string
}

@Injectable()
export class ListPendingAccessRequestsUseCase {
  private readonly logger = new Logger(ListPendingAccessRequestsUseCase.name)

  constructor(
    private readonly accessRequestRepository: AccessRequestRepository,
    private readonly userRepository: UserRepository
  ) { }

  async execute(request: ListPendingAccessRequestsUseCaseRequest) {
    const { viewerId } = request

    const viewer = await this.userRepository.findById(viewerId)
    if (!viewer) {
      this.logger.warn(`Viewer not found: ${viewerId}`)
      throw new ForbiddenException('Viewer not found')
    }

    if (!viewer.isCloudAdmin) {
      this.logger.warn(`Viewer is not a cloud admin: ${viewerId}`)
      throw new ForbiddenException('Only cloud admins can view pending access requests')
    }

    const allRequests = await this.accessRequestRepository.findAll()
    const pendingRequests = allRequests.filter(request => request.status === 'PENDING')

    return {
      pendingRequests
    }
  }
} 