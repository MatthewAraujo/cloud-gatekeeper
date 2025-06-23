import { Injectable, ForbiddenException } from '@nestjs/common'
import { AccessRequestRepository } from '../repositories/access-repository'
import { UserRepository } from '../repositories/user-repository'

interface ListPendingAccessRequestsUseCaseRequest {
  viewerId: string
}

@Injectable()
export class ListPendingAccessRequestsUseCase {
  constructor(
    private readonly accessRequestRepository: AccessRequestRepository,
    private readonly userRepository: UserRepository
  ) { }

  async execute(request: ListPendingAccessRequestsUseCaseRequest) {

    const { viewerId } = request

    // Validate viewer exists and is a cloud admin
    const viewer = await this.userRepository.findById(viewerId)
    if (!viewer) {
      console.error('❌ Viewer not found:', viewerId)
      throw new ForbiddenException('Viewer not found')
    }

    if (!viewer.isCloudAdmin) {
      console.error('❌ Viewer is not a cloud admin:', viewerId)
      throw new ForbiddenException('Only cloud admins can view pending access requests')
    }

    // Get all access requests and filter for pending ones
    const allRequests = await this.accessRequestRepository.findAll()
    const pendingRequests = allRequests.filter(request => request.status === 'PENDING')


    return {
      pendingRequests: pendingRequests.map(request => ({
        id: request.id,
        requesterId: request.requesterId,
        requesterEmail: request.requesterEmail,
        project: request.project,
        status: request.status,
        createdAt: request.createdAt,
      }))
    }
  }
} 