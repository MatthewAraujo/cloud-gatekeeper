import { ApproveAccessRequestUseCase } from '@/domain/cloud-gatekeeper/application/use-cases/approve-access-request'
import { AccessRequest } from '@/domain/cloud-gatekeeper/enterprise/entities/access-request'
import { InMemoryAccessRequestRepository } from 'test/repositories/in-memory-access-request-repository'
import { InMemoryUserRepository } from 'test/repositories/in-memory-user-repository'

describe('ApproveAccessRequestUseCase', () => {
  let accessRequestRepository: InMemoryAccessRequestRepository
  let userRepository: InMemoryUserRepository
  let sut: ApproveAccessRequestUseCase

  beforeEach(() => {
    accessRequestRepository = new InMemoryAccessRequestRepository()
    userRepository = new InMemoryUserRepository()
    sut = new ApproveAccessRequestUseCase(accessRequestRepository, userRepository)
  })

  it('should approve a pending access request by a cloud admin', async () => {
    await userRepository.create({ id: 'admin-1', email: 'admin@example.com', isCloudAdmin: true })
    const accessRequest = AccessRequest.create({
      requesterId: 'user-1',
      requesterEmail: 'user1@example.com',
      project: 'analytics',
    })
    await accessRequestRepository.create(accessRequest)
    await sut.execute({
      accessRequestId: accessRequest.id.toString(),
      approverId: 'admin-1',
      action: 'APPROVE',
    })
    expect(accessRequestRepository.items[0].status).toBe('APPROVED')
    expect(accessRequestRepository.items[0].approvedById).toBe('admin-1')
  })

  it('should throw if approver is not a cloud admin', async () => {
    await userRepository.create({ id: 'user-2', email: 'user2@example.com', isCloudAdmin: false })
    const accessRequest = AccessRequest.create({
      requesterId: 'user-1',
      requesterEmail: 'user1@example.com',
      project: 'analytics',
    })
    await accessRequestRepository.create(accessRequest)
    await expect(
      sut.execute({
        accessRequestId: accessRequest.id.toString(),
        approverId: 'user-2',
        action: 'APPROVE',
      })
    ).rejects.toThrow('Only cloud admins can approve access requests')
  })
}) 