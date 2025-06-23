import { AccessRequestUseCase } from '@/domain/cloud-gatekeeper/application/use-cases/access-request'
import { InMemoryAccessRequestRepository } from 'test/repositories/in-memory-access-request-repository'
import { InMemoryUserRepository } from 'test/repositories/in-memory-user-repository'

describe('AccessRequestUseCase', () => {
  let accessRequestRepository: InMemoryAccessRequestRepository
  let userRepository: InMemoryUserRepository
  let sut: AccessRequestUseCase

  beforeEach(() => {
    accessRequestRepository = new InMemoryAccessRequestRepository()
    userRepository = new InMemoryUserRepository()
    sut = new AccessRequestUseCase(accessRequestRepository, userRepository, {} as any, {} as any)
  })

  it('should create an access request for a valid user', async () => {
    await userRepository.create({ id: 'user-1', email: 'user1@example.com', isCloudAdmin: false })
    await sut.execute({ message: 'project analytics', requesterId: 'user-1' })
    expect(accessRequestRepository.items).toHaveLength(1)
    expect(accessRequestRepository.items[0].requesterId).toBe('user-1')
  })

  it('should throw if user does not exist', async () => {
    await expect(
      sut.execute({ message: 'project analytics', requesterId: 'not-exist' })
    ).rejects.toThrow('User not found')
  })
}) 