import { ListPendingAccessRequestsUseCase } from '@/domain/cloud-gatekeeper/application/use-cases/list-pending-access-requests'
import { AccessRequest } from '@/domain/cloud-gatekeeper/enterprise/entities/access-request'
import { InMemoryAccessRequestRepository } from 'test/repositories/in-memory-access-request-repository'
import { InMemoryUserRepository } from 'test/repositories/in-memory-user-repository'

describe('ListPendingAccessRequestsUseCase', () => {
  let accessRequestRepository: InMemoryAccessRequestRepository
  let userRepository: InMemoryUserRepository
  let sut: ListPendingAccessRequestsUseCase

  beforeEach(() => {
    accessRequestRepository = new InMemoryAccessRequestRepository()
    userRepository = new InMemoryUserRepository()
    sut = new ListPendingAccessRequestsUseCase(accessRequestRepository, userRepository)
  })

  it('should list only pending access requests for a cloud admin', async () => {
    await userRepository.create({ id: 'admin-1', email: 'admin@example.com', isCloudAdmin: true })
    const pending = AccessRequest.create({
      requesterId: 'user-1',
      requesterEmail: 'user1@example.com',
      project: 'analytics',
    })
    const approved = AccessRequest.create({
      requesterId: 'user-2',
      requesterEmail: 'user2@example.com',
      project: 'analytics',
    })
    approved.approve('admin-1')
    await accessRequestRepository.create(pending)
    await accessRequestRepository.create(approved)
    const result = await sut.execute({ viewerId: 'admin-1' })
    expect(result.pendingRequests).toHaveLength(1)
    expect(result.pendingRequests[0].id).toBe(pending.id)
  })

  it('should throw if viewer is not a cloud admin', async () => {
    await userRepository.create({ id: 'user-2', email: 'user2@example.com', isCloudAdmin: false })
    await expect(
      sut.execute({ viewerId: 'user-2' })
    ).rejects.toThrow('Only cloud admins can view pending access requests')
  })
}) 