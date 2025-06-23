import { DomainEvents } from './domain-events'
import { vi } from 'vitest'
import { AggregateRoot } from '../entities/aggregate-root'
import { UniqueEntityID } from '../entities/unique-entity-id'
import { DomainEvent } from './domain-event'

class CustomAggregateCreated implements DomainEvent {
  public ocurredAt: Date
  private aggregate: CustomAggregate

  constructor(aggregate: CustomAggregate) {
    this.aggregate = aggregate
    this.ocurredAt = new Date()
  }

  public getAggregateId(): UniqueEntityID {
    return this.aggregate.id
  }
}

class CustomAggregate extends AggregateRoot<null> {
  static create() {
    const aggregate = new CustomAggregate(null)

    aggregate.addDomainEvent(new CustomAggregateCreated(aggregate))

    return aggregate
  }
}

describe('domain events', () => {
  it('should be able to dispatch and listen to events', async () => {
    const callbackSpy = vi.fn()

    // Register subscriber (listening to the "aggregate created" event)
    DomainEvents.register(callbackSpy, CustomAggregateCreated.name)

    // Creating an aggregate but WITHOUT saving to database
    const aggregate = CustomAggregate.create()

    // Ensuring the event was created but NOT dispatched
    expect(aggregate.domainEvents).toHaveLength(1)

    // Saving the aggregate to database and thus dispatching the event
    DomainEvents.dispatchEventsForAggregate(aggregate.id)

    // The subscriber hears the event and does what needs to be done with the data
    expect(callbackSpy).toHaveBeenCalled()

    expect(aggregate.domainEvents).toHaveLength(0)
  })
}) 