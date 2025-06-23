import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DomainEvent } from '@/core/events/domain-event'
import { AccessRequest } from '../entities/access-request'

export class AccessRequestRejectedEvent implements DomainEvent {
  public ocurredAt: Date
  public accessRequest: AccessRequest
  public approverId: string
  public reason?: string

  constructor(accessRequest: AccessRequest, approverId: string, reason?: string) {
    this.accessRequest = accessRequest
    this.approverId = approverId
    this.reason = reason
    this.ocurredAt = new Date()
  }

  getAggregateId(): UniqueEntityID {
    return this.accessRequest.id
  }
} 