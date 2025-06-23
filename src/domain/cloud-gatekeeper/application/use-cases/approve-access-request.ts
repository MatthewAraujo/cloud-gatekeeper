import { Injectable, ForbiddenException, BadRequestException, Logger } from '@nestjs/common'
import { AccessRequestRepository } from '../repositories/access-repository'
import { UserRepository } from '../repositories/user-repository'
import { AccessRequest } from '@/domain/cloud-gatekeeper/enterprise/entities/access-request'

interface ApproveAccessRequestUseCaseRequest {
  accessRequestId: string
  approverId: string
  action: 'APPROVE' | 'REJECT'
  reason?: string
}

@Injectable()
export class ApproveAccessRequestUseCase {
  private readonly logger = new Logger(ApproveAccessRequestUseCase.name)

  constructor(
    private readonly accessRequestRepository: AccessRequestRepository,
    private readonly userRepository: UserRepository,
  ) { }

  async execute(request: ApproveAccessRequestUseCaseRequest): Promise<void> {
    const { accessRequestId, approverId, action, reason } = request

    const approver = await this.userRepository.findById(approverId)
    if (!approver) {
      this.logger.warn(`Approver not found: ${approverId}`)
      throw new BadRequestException('Approver not found')
    }

    if (!approver.isCloudAdmin) {
      this.logger.warn(`Approver is not a cloud admin: ${approverId}`)
      throw new ForbiddenException('Only cloud admins can approve access requests')
    }

    const accessRequest = await this.accessRequestRepository.findById(accessRequestId)
    if (!accessRequest) {
      this.logger.warn(`Access request not found: ${accessRequestId}`)
      throw new BadRequestException('Access request not found')
    }

    if (accessRequest.status !== 'PENDING') {
      this.logger.warn(`Access request is not pending: ${accessRequestId}, status: ${accessRequest.status}`)
      throw new BadRequestException('Access request is not in pending status')
    }

    if (accessRequest.requesterId === approverId) {
      this.logger.warn(`User cannot approve their own request: ${approverId}`)
      throw new ForbiddenException('Users cannot approve their own access requests')
    }

    if (action === 'APPROVE') {
      accessRequest.approve(approverId)
    } else {
      accessRequest.reject(approverId, reason)
    }

    await this.accessRequestRepository.save(accessRequest)

    this.logger.log(`Access request processed successfully: { accessRequestId: ${accessRequestId}, action: ${action}, approverId: ${approverId}, newStatus: ${accessRequest.status} }`)
  }
} 