import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DomainEvent } from '@/core/events/domain-event'
import { AccessRequest } from '../entities/access-request'

export class AccessRequestCreatedEvent implements DomainEvent {
  public ocurredAt: Date
  public accessRequest: AccessRequest

  constructor(accessRequest: AccessRequest) {
    this.accessRequest = accessRequest
    this.ocurredAt = new Date()
  }

  getAggregateId(): UniqueEntityID {
    return this.accessRequest.id
  }
} 