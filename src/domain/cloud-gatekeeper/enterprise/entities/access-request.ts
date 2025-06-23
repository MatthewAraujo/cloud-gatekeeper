import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AccessRequestCreatedEvent } from '../events/access-request-created-event'
import { AccessRequestApprovedEvent } from '../events/access-request-approved-event'
import { AccessRequestRejectedEvent } from '../events/access-request-rejected-event'

export interface AccessRequestProps {
  requesterId: string
  requesterEmail: string
  project: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedById?: string
  reason?: string
  createdAt: Date
  updatedAt: Date
}

export class AccessRequest extends AggregateRoot<AccessRequestProps> {
  get requesterId(): string {
    return this.props.requesterId
  }

  get requesterEmail(): string {
    return this.props.requesterEmail
  }

  get project(): string {
    return this.props.project
  }

  get status(): 'PENDING' | 'APPROVED' | 'REJECTED' {
    return this.props.status
  }

  get approvedById(): string | undefined {
    return this.props.approvedById
  }

  get reason(): string | undefined {
    return this.props.reason
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  static create(
    props: Omit<AccessRequestProps, 'status' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID
  ): AccessRequest {
    const accessRequest = new AccessRequest(
      {
        ...props,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id
    )

    accessRequest.addDomainEvent(new AccessRequestCreatedEvent(accessRequest))

    return accessRequest
  }

  approve(approverId: string): void {
    if (this.props.status !== 'PENDING') {
      throw new Error('Cannot approve a request that is not pending')
    }

    this.props.status = 'APPROVED'
    this.props.approvedById = approverId
    this.props.updatedAt = new Date()

    this.addDomainEvent(new AccessRequestApprovedEvent(this, approverId))
  }

  reject(approverId: string, reason?: string): void {
    if (this.props.status !== 'PENDING') {
      throw new Error('Cannot reject a request that is not pending')
    }

    this.props.status = 'REJECTED'
    this.props.approvedById = approverId
    this.props.reason = reason
    this.props.updatedAt = new Date()

    this.addDomainEvent(new AccessRequestRejectedEvent(this, approverId, reason))
  }
} 