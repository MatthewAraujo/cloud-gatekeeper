import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common'
import { AccessRequestRepository } from '../repositories/access-repository'
import { UserRepository } from '../repositories/user-repository'
import { SlackService } from '@/infra/services/slack/slack.service'
interface ApproveAccessRequestUseCaseRequest {
  accessRequestId: string
  approverId: string
  action: 'APPROVE' | 'REJECT'
  reason?: string
}

@Injectable()
export class ApproveAccessRequestUseCase {
  constructor(
    private readonly accessRequestRepository: AccessRequestRepository,
    private readonly userRepository: UserRepository,
    private readonly slackService: SlackService,
  ) { }

  async execute(request: ApproveAccessRequestUseCaseRequest): Promise<void> {
    console.log('🔐 ApproveAccessRequestUseCase.execute() started', { request })

    const { accessRequestId, approverId, action, reason } = request

    const approver = await this.userRepository.findById(approverId)
    if (!approver) {
      console.error('❌ Approver not found:', approverId)
      throw new BadRequestException('Approver not found')
    }

    if (!approver.isCloudAdmin) {
      console.error('❌ Approver is not a cloud admin:', approverId)
      throw new ForbiddenException('Only cloud admins can approve access requests')
    }

    const accessRequest = await this.accessRequestRepository.findById(accessRequestId)
    if (!accessRequest) {
      console.error('❌ Access request not found:', accessRequestId)
      throw new BadRequestException('Access request not found')
    }

    if (accessRequest.status !== 'PENDING') {
      console.error('❌ Access request is not pending:', accessRequestId, accessRequest.status)
      throw new BadRequestException('Access request is not in pending status')
    }

    if (accessRequest.requesterId === approverId) {
      console.error('❌ User cannot approve their own request:', approverId)
      throw new ForbiddenException('Users cannot approve their own access requests')
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
    const updateData: any = {
      status: newStatus,
      approvedById: approverId,
    }

    if (action === 'REJECT' && reason) {
      updateData.reason = reason
    }

    await this.accessRequestRepository.save(accessRequestId, updateData)

    const message = this.slackService.buildAccessRequestMessage(accessRequest, approver, action, reason)
    await this.slackService.sendMessage(accessRequest.requesterId, message)

    console.log('✅ Access request processed successfully', {
      accessRequestId,
      action,
      approverId,
      newStatus
    })
  }
} 