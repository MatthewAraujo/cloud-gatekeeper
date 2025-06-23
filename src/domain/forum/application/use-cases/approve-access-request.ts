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
    private readonly slackService: SlackService
  ) { }

  async execute(request: ApproveAccessRequestUseCaseRequest): Promise<void> {

    const { accessRequestId, approverId, action, reason } = request

    // 1. Validate approver exists and is a cloud admin
    const approver = await this.userRepository.findById(approverId)
    if (!approver) {
      console.error('❌ Approver not found:', approverId)
      throw new BadRequestException('Approver not found')
    }

    if (!approver.isCloudAdmin) {
      console.error('❌ Approver is not a cloud admin:', approverId)
      throw new ForbiddenException('Only cloud admins can approve access requests')
    }

    // 2. Get the access request
    const accessRequest = await this.accessRequestRepository.findById(accessRequestId)
    if (!accessRequest) {
      console.error('❌ Access request not found:', accessRequestId)
      throw new BadRequestException('Access request not found')
    }

    // 3. Check if request is in pending status
    if (accessRequest.status !== 'PENDING') {
      console.error('❌ Access request is not pending:', accessRequestId, accessRequest.status)
      throw new BadRequestException('Access request is not in pending status')
    }

    // 4. Prevent self-approval
    if (accessRequest.requesterId === approverId) {
      console.error('❌ User cannot approve their own request:', approverId)
      throw new ForbiddenException('Users cannot approve their own access requests')
    }

    // 5. Update the access request
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
    const updateData: any = {
      status: newStatus,
      approvedById: approverId,
    }

    if (action === 'REJECT' && reason) {
      updateData.reason = reason
    }

    await this.accessRequestRepository.save(accessRequestId, updateData)

    // 6. Send notification to Slack
    const message = this.slackService.buildAccessRequestMessage(accessRequest, approver, action, reason)
    await this.slackService.sendMessage(accessRequest.requesterId, message)

  }
} 