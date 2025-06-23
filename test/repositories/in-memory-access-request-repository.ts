import { AccessRequestRepository } from '@/domain/cloud-gatekeeper/application/repositories/access-repository'
import { AccessRequest } from '@/domain/cloud-gatekeeper/enterprise/entities/access-request'

export class InMemoryAccessRequestRepository extends AccessRequestRepository {
  public items: AccessRequest[] = []

  async create(accessRequest: AccessRequest): Promise<void> {
    this.items.push(accessRequest)
  }

  async findById(id: string): Promise<AccessRequest | null> {
    return this.items.find(item => item.id.toString() === id) || null
  }

  async save(accessRequest: AccessRequest): Promise<void> {
    const idx = this.items.findIndex(item => item.id.toString() === accessRequest.id.toString())
    if (idx !== -1) {
      this.items[idx] = accessRequest
    } else {
      this.items.push(accessRequest)
    }
  }

  async findAll(): Promise<AccessRequest[]> {
    return [...this.items]
  }
} 