import { Test, TestingModule } from '@nestjs/testing'
import { vi } from 'vitest'
import { DomainEvents } from './domain-events'
import { AccessRequest } from '@/domain/cloud-gatekeeper/enterprise/entities/access-request'
import { AccessRequestCreatedEvent } from '@/domain/cloud-gatekeeper/enterprise/events/access-request-created-event'
import { AccessRequestApprovedEvent } from '@/domain/cloud-gatekeeper/enterprise/events/access-request-approved-event'
import { AccessRequestRejectedEvent } from '@/domain/cloud-gatekeeper/enterprise/events/access-request-rejected-event'

describe('Domain Events E2E', () => {
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [],
    }).compile()
  })

  afterEach(() => {
    DomainEvents.clearHandlers()
    DomainEvents.clearMarkedAggregates()
  })

  it('should dispatch AccessRequestCreatedEvent when creating an access request', () => {
    const callbackSpy = vi.fn()

    // Register event handler
    DomainEvents.register(callbackSpy, AccessRequestCreatedEvent.name)

    // Create access request (this should trigger the event)
    const accessRequest = AccessRequest.create({
      requesterId: 'user123',
      requesterEmail: 'user@example.com',
      project: 'test-project',
    })

    // Verify event was created but not dispatched yet
    expect(accessRequest.domainEvents).toHaveLength(1)
    expect(callbackSpy).not.toHaveBeenCalled()

    // Dispatch the event (simulating saving to database)
    DomainEvents.dispatchEventsForAggregate(accessRequest.id)

    // Verify event was dispatched
    expect(callbackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        accessRequest,
        ocurredAt: expect.any(Date),
      })
    )

    // Verify events were cleared
    expect(accessRequest.domainEvents).toHaveLength(0)
  })

  it('should dispatch AccessRequestApprovedEvent when approving an access request', () => {
    const callbackSpy = vi.fn()

    // Register event handler
    DomainEvents.register(callbackSpy, AccessRequestApprovedEvent.name)

    // Create and approve access request
    const accessRequest = AccessRequest.create({
      requesterId: 'user123',
      requesterEmail: 'user@example.com',
      project: 'test-project',
    })

    // Clear the creation event
    accessRequest.clearEvents()

    // Approve the request (this should trigger the approval event)
    accessRequest.approve('admin123')

    // Verify approval event was created
    expect(accessRequest.domainEvents).toHaveLength(1)
    expect(callbackSpy).not.toHaveBeenCalled()

    // Dispatch the event
    DomainEvents.dispatchEventsForAggregate(accessRequest.id)

    // Verify event was dispatched
    expect(callbackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        accessRequest,
        approverId: 'admin123',
        ocurredAt: expect.any(Date),
      })
    )

    // Verify events were cleared
    expect(accessRequest.domainEvents).toHaveLength(0)
  })

  it('should dispatch AccessRequestRejectedEvent when rejecting an access request', () => {
    const callbackSpy = vi.fn()

    // Register event handler
    DomainEvents.register(callbackSpy, AccessRequestRejectedEvent.name)

    // Create and reject access request
    const accessRequest = AccessRequest.create({
      requesterId: 'user123',
      requesterEmail: 'user@example.com',
      project: 'test-project',
    })

    // Clear the creation event
    accessRequest.clearEvents()

    // Reject the request (this should trigger the rejection event)
    accessRequest.reject('admin123', 'Insufficient justification')

    // Verify rejection event was created
    expect(accessRequest.domainEvents).toHaveLength(1)
    expect(callbackSpy).not.toHaveBeenCalled()

    // Dispatch the event
    DomainEvents.dispatchEventsForAggregate(accessRequest.id)

    // Verify event was dispatched
    expect(callbackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        accessRequest,
        approverId: 'admin123',
        reason: 'Insufficient justification',
        ocurredAt: expect.any(Date),
      })
    )

    // Verify events were cleared
    expect(accessRequest.domainEvents).toHaveLength(0)
  })
}) 