# Event System Implementation

This document describes the event system implementation in the cloud-gatekeeper project, which is based on the domain events pattern from the forum project.

## Overview

The event system allows for loose coupling between domain logic and side effects (like notifications, logging, etc.). When domain events occur, they are dispatched to registered handlers that can perform various actions.

## Core Components

### 1. Domain Events Infrastructure

- **`DomainEvent`** - Interface that all domain events must implement
- **`DomainEvents`** - Static class that manages event registration and dispatching
- **`AggregateRoot`** - Base class for entities that can emit domain events
- **`EventHandler`** - Interface for event handlers

### 2. Domain Entities

- **`AccessRequest`** - Aggregate root that emits events when created, approved, or rejected

### 3. Domain Events

- **`AccessRequestCreatedEvent`** - Emitted when a new access request is created
- **`AccessRequestApprovedEvent`** - Emitted when an access request is approved
- **`AccessRequestRejectedEvent`** - Emitted when an access request is rejected

### 4. Event Handlers

- **`OnAccessRequestCreated`** - Handles notifications when access requests are created
- **`OnAccessRequestApproved`** - Handles notifications when access requests are approved
- **`OnAccessRequestRejected`** - Handles notifications when access requests are rejected

## How It Works

1. **Event Creation**: When domain logic occurs (e.g., creating an access request), the entity adds a domain event to its internal list
2. **Event Registration**: Event handlers register themselves to listen for specific event types
3. **Event Dispatching**: When the aggregate is saved to the database, all pending events are dispatched to their registered handlers
4. **Event Handling**: Handlers receive the events and perform side effects (notifications, logging, etc.)

## Usage Example

### Creating an Access Request

```typescript
// Create the access request (this automatically adds a creation event)
const accessRequest = AccessRequest.create({
  requesterId: 'user123',
  requesterEmail: 'user@example.com',
  project: 'my-project'
})

// Save to database (this triggers event dispatching)
await accessRequestRepository.save(accessRequest)

// Dispatch events (this should be called after successful save)
DomainEvents.dispatchEventsForAggregate(accessRequest.id)
```

### Approving an Access Request

```typescript
// Load the access request
const accessRequest = await accessRequestRepository.findById(id)

// Approve it (this automatically adds an approval event)
accessRequest.approve('admin123')

// Save to database
await accessRequestRepository.save(accessRequest)

// Dispatch events
DomainEvents.dispatchEventsForAggregate(accessRequest.id)
```

## Event Handler Implementation

Event handlers implement the `EventHandler` interface and register themselves in the `setupSubscriptions()` method:

```typescript
@Injectable()
export class OnAccessRequestCreated implements EventHandler {
  constructor(private readonly slackService: SlackService) {}

  setupSubscriptions(): void {
    DomainEvents.register(
      this.handle.bind(this),
      AccessRequestCreatedEvent.name,
    )
  }

  private async handle(event: AccessRequestCreatedEvent) {
    // Handle the event (send notifications, etc.)
    const message = this.buildNotification(event.accessRequest)
    await this.slackService.sendMessage(channel, message)
  }
}
```

## Testing

The event system includes comprehensive tests:

- **Unit tests** for the core domain events infrastructure
- **E2E tests** demonstrating how events work with the AccessRequest entity

Run the tests with:

```bash
npm test
```

## Benefits

1. **Loose Coupling**: Domain logic is separated from side effects
2. **Testability**: Events can be tested independently
3. **Extensibility**: New handlers can be added without modifying domain logic
4. **Auditability**: All domain events are captured and can be logged
5. **Scalability**: Events can be processed asynchronously

## Future Enhancements

- Event persistence for audit trails
- Event replay capabilities
- Event versioning
- Event sourcing integration
- Message queue integration for distributed event processing 