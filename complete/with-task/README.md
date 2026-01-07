# Todo Application with Async Task Processing

A complete Todo application built with MBC CQRS Serverless Framework, featuring async task processing capabilities.

This extends the [basic complete example](../basic/) with asynchronous task processing using SQS queues.

## Features

All features from the basic version, plus:

- **Async Tasks** - Background processing via SQS queues
- **Task Service** - Queue async operations that don't need immediate response
- **Event Handlers** - Process tasks with retry and dead-letter queue support
- **Long-running Operations** - Handle operations that would timeout in API requests

### Core Features (from basic)

- **Create** - Create new todo items with auto-generated sequence numbers
- **Read** - Get single todo item by PK/SK
- **Search** - List and search todos with filtering and pagination (via RDS)
- **Update** - Partial updates with optimistic locking
- **Delete** - Soft delete with version control
- **RDS Sync** - Automatic synchronization from DynamoDB to MySQL
- **Sequence** - Auto-generated human-readable sequence numbers

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Architecture with Task Processing                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐                                                            │
│  │   Client     │                                                            │
│  └──────────────┘                                                            │
│         │                                                                     │
│         ▼                                                                     │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐               │
│  │  Controller  │ ──▶  │   Service    │ ──▶  │   Command    │               │
│  │  (REST API)  │      │   Layer      │      │   Service    │               │
│  └──────────────┘      └──────────────┘      └──────────────┘               │
│                               │                     │                        │
│                               │                     ▼                        │
│                               │              ┌──────────────┐                │
│                               │              │  DynamoDB    │                │
│                               │              │  (Command)   │                │
│                               │              └──────────────┘                │
│                               │                     │                        │
│                               │                     ▼ Stream                 │
│                               ▼              ┌──────────────┐                │
│                        ┌──────────────┐      │ Step         │                │
│                        │  DataService │      │ Functions    │                │
│                        │  (Read)      │      └──────────────┘                │
│                        └──────────────┘             │                        │
│                               │                     ▼                        │
│                               │              ┌──────────────┐                │
│                               ▼              │  DynamoDB    │                │
│                        ┌──────────────┐      │  (Data)      │                │
│                        │  DynamoDB    │ ◀────└──────────────┘                │
│                        │  (Data)      │             │                        │
│                        └──────────────┘             │                        │
│                               │                     ▼                        │
│                               │              ┌──────────────┐                │
│                               ▼              │ DataSync     │                │
│                        ┌──────────────┐ ◀─── │ Handler      │                │
│                        │  RDS/MySQL   │      └──────────────┘                │
│                        │  (Query)     │                                      │
│                        └──────────────┘                                      │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                      ASYNC TASK PROCESSING                              │  │
│  ├────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                         │  │
│  │  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐          │  │
│  │  │   Service    │ ──▶  │  TaskService │ ──▶  │  DynamoDB    │          │  │
│  │  │  (create     │      │  (queue)     │      │  (Tasks)     │          │  │
│  │  │   task)      │      └──────────────┘      └──────────────┘          │  │
│  │  └──────────────┘                                   │                   │  │
│  │                                                     ▼ Stream            │  │
│  │                                              ┌──────────────┐          │  │
│  │                                              │    SQS       │          │  │
│  │                                              │   Queue      │          │  │
│  │                                              └──────────────┘          │  │
│  │                                                     │                   │  │
│  │                                                     ▼                   │  │
│  │                                              ┌──────────────┐          │  │
│  │                                              │ Task Event   │          │  │
│  │                                              │ Handler      │          │  │
│  │                                              └──────────────┘          │  │
│  │                                                                         │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Task Processing Flow

1. **Create Task**: Service calls `TaskService.createTask()` with input data
2. **Store Task**: Task is stored in DynamoDB tasks table
3. **Stream Trigger**: DynamoDB Stream triggers the task processor
4. **Queue Task**: Task is sent to SQS queue for processing
5. **Transform Event**: `TaskQueueEventFactory` transforms the SQS message
6. **Process Task**: `TodoTaskEventHandler` processes the task
7. **Handle Result**: Success/failure is logged; failures go to dead-letter queue

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/todo | Create a new todo |
| GET | /api/todo | List/search todos |
| GET | /api/todo/:pk/:sk | Get a single todo |
| PATCH | /api/todo/:pk/:sk | Update a todo |
| DELETE | /api/todo/:pk/:sk | Delete a todo (soft delete) |

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.local .env
```

### 3. Start Docker Environment

```bash
npm run offline:docker
```

### 4. Run Database Migrations

```bash
npm run migrate
```

### 5. Start Development Server

```bash
npm run offline:sls
```

## Project Structure

```
├── src/
│   ├── helpers/                # Helper functions
│   │   ├── id.ts              # PK/SK generation
│   │   └── sleep.ts           # Sleep utility for async tasks
│   ├── my-task/               # Task processing module (NEW)
│   │   ├── my-task.module.ts  # Task module configuration
│   │   └── task-queue-event-factory.ts  # SQS event transformer
│   ├── todo/
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── entity/            # Entity definitions
│   │   ├── handler/
│   │   │   ├── todo-rds.handler.ts      # RDS sync handler
│   │   │   ├── todo-task.event.ts       # Task event definition (NEW)
│   │   │   └── todo-task.event.handler.ts  # Task event handler (NEW)
│   │   ├── todo.controller.ts
│   │   ├── todo.service.ts
│   │   └── todo.module.ts
│   ├── event-factory.ts       # Extended for task events
│   ├── main.module.ts         # Includes MyTaskModule
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── infra-local/
└── package.json
```

## Key Concepts

### TaskService

```typescript
import { TaskService } from '@mbc-cqrs-serverless/task'

@Injectable()
export class TodoService {
  constructor(private readonly taskService: TaskService) {}

  async createWithAsyncProcessing(dto: CreateTodoDto, opts: { invokeContext: IInvoke }) {
    // Create the todo synchronously
    const todo = await this.commandService.publish(todoCommand, opts)

    // Queue async task for background processing
    await this.taskService.createTask({
      pk: `TASK#${tenantCode}`,
      sk: generateId(),
      input: todo, // Data to process
    })

    return todo
  }
}
```

### TaskQueueEventFactory

Transforms SQS events into domain-specific events:

```typescript
export class TaskQueueEventFactory implements ITaskQueueEventFactory {
  async transformTask(event: TaskQueueEvent): Promise<any[]> {
    return [new TodoTaskEvent().fromSqsRecord(event)]
  }
}
```

### Event Handler

Processes tasks asynchronously:

```typescript
@EventHandler(TodoTaskEvent)
export class TodoTaskEventHandler implements IEventHandler<TodoTaskEvent> {
  async execute(event: TodoTaskEvent): Promise<any> {
    // Access todo data from the event
    const todo = event.todo

    // Perform long-running operation
    await this.sendNotification(todo)
    await this.generateReport(todo)

    return { status: 'completed' }
  }
}
```

### EventFactoryAddedTask

Custom event factory that includes task event processing:

```typescript
@EventFactory()
export class CustomEventFactory extends EventFactoryAddedTask {
  async transformDynamodbStream(event: DynamoDBStreamEvent): Promise<IEvent[]> {
    const curEvents = await super.transformDynamodbStream(event)

    // Add TaskEvent for 'tasks' table INSERT events
    const taskEvents = event.Records
      .filter(r => r.eventSourceARN.includes('tasks') && r.eventName === 'INSERT')
      .map(r => new TaskEvent().fromDynamoDBRecord(r))

    return [...curEvents, ...taskEvents]
  }
}
```

## Use Cases for Async Tasks

- **Email Notifications** - Send emails when todos are completed
- **Report Generation** - Generate PDF reports for todo statistics
- **External Sync** - Sync todo data to external systems
- **Batch Processing** - Process multiple related items
- **Webhook Calls** - Notify external services of changes

## Error Handling

- Tasks that throw errors are retried according to SQS retry policy
- After max retries, tasks go to the dead-letter queue
- Dead-letter queue can be monitored for failed tasks

## Related Documentation

- [Basic Complete Example](../basic/) - Version without task processing
- [Tutorial Steps](../../) - Step-by-step guide
- [MBC CQRS Serverless Docs](https://mbc-cqrs-serverless.mbc-net.com)

## Navigation

| Previous | Next |
|----------|------|
| [Complete: Basic](../basic/) | - |

## Related Resources

- **Documentation**: [Build a Todo App - Part 7](https://mbc-cqrs-serverless.mbc-net.com/docs/build-todo-app#part-7-async-task-processing-completewith-task)
- **All Tutorial Steps**: [Samples Overview](../../)
