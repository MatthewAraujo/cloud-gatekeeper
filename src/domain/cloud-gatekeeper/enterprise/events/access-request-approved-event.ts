import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DomainEvent } from '@/core/events/domain-event'
import { AccessRequest } from '../entities/access-request'

export class AccessRequestApprovedEvent implements DomainEvent {
  public ocurredAt: Date
  public accessRequest: AccessRequest
  public approverId: string

  constructor(accessRequest: AccessRequest, approverId: string) {
    this.accessRequest = accessRequest
    this.approverId = approverId
    this.ocurredAt = new Date()
  }

  getAggregateId(): UniqueEntityID {
    return this.accessRequest.id
  }
} 