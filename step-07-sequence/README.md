# Step 07: Sequence

MBC CQRS Serverless Framework Tutorial - Step 7: Sequence Number Generation

## What You'll Learn

- Automatic sequence number generation
- SequencesService from @mbc-cqrs-serverless/sequence
- Rotation patterns (none, yearly, monthly, daily)
- Human-readable ID generation

## Prerequisites

- [Step 06: Update & Delete](../step-06-update-delete/) completed

## Sequence Architecture Overview

The sequence service provides atomic, tenant-isolated sequence number generation.
This is essential for creating human-readable IDs like invoice numbers or order IDs.

```
┌─────────────────────────────────────────────────────────────────┐
│                 Sequence Architecture                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │   Client     │      │ Sequences    │      │  DynamoDB    │   │
│  │  (Browser)   │ ──▶  │  Service     │ ──▶  │  (Atomic)    │   │
│  └──────────────┘      └──────────────┘      └──────────────┘   │
│         │                     │                     │           │
│         │                     │                     │           │
│         ▼                     ▼                     ▼           │
│   POST /api/todo      genNewSequence()       Atomic Counter     │
│   seq: 1, 2, 3...     Tenant Isolated        No Collisions      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Changed Files

Files added/modified in this step:

```
package.json                 # Added @mbc-cqrs-serverless/sequence
src/todo/
├── todo.module.ts           # Import SeqModule
└── todo.service.ts          # Use SequencesService
```

## Code Explanation

### 1. Package Dependencies (package.json)

```json
{
  "dependencies": {
    "@mbc-cqrs-serverless/core": "^1.0.16",
    "@mbc-cqrs-serverless/sequence": "^1.0.16",
    "@prisma/client": "^5.22.0"
  }
}
```

### 2. Module Configuration (todo.module.ts)

```typescript
import { SeqModule } from '@mbc-cqrs-serverless/sequence'

@Module({
  imports: [
    CommandModule.register({
      tableName: 'todo',
      dataSyncHandlers: [TodoDataSyncRdsHandler],
    }),
    SeqModule, // Import sequence module
  ],
  // ...
})
export class TodoModule {}
```

### 3. Service Layer (todo.service.ts)

```typescript
import { SequencesService } from '@mbc-cqrs-serverless/sequence'

@Injectable()
export class TodoService {
  constructor(
    // ... other services
    private readonly sequencesService: SequencesService,
  ) {}

  async create(createDto: CreateTodoDto, opts: { invokeContext: IInvoke }) {
    const { tenantCode } = getUserContext(opts.invokeContext)

    // Generate a new sequence number
    const seq = await this.sequencesService.genNewSequence({
      tenantCode,
      typeCode: TODO_PK_PREFIX,
      rotate: 'none', // No rotation - continuous sequence
    })

    // Create command with sequence number
    const todo = new TodoCommandDto({
      // ... other fields
      seq, // Include sequence number
    })

    return this.commandService.publish(todo, opts)
  }
}
```

## Setup Instructions

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

## Testing

### 1. Create First Todo

```bash
curl -X POST http://localhost:3000/api/todo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "First Todo",
    "attributes": {
      "status": "PENDING"
    }
  }'
```

Response (note seq: 1):
```json
{
  "pk": "TODO#MBC",
  "sk": "01HXY...",
  "seq": 1,
  "name": "First Todo",
  ...
}
```

### 2. Create Second Todo

```bash
curl -X POST http://localhost:3000/api/todo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Second Todo",
    "attributes": {
      "status": "PENDING"
    }
  }'
```

Response (note seq: 2):
```json
{
  "pk": "TODO#MBC",
  "sk": "01HXZ...",
  "seq": 2,
  "name": "Second Todo",
  ...
}
```

### 3. Verify in Database

```sql
SELECT id, seq, name FROM todos ORDER BY seq;
```

## Key Concepts

### Sequence Service Features

- **Atomic Operations**: Uses DynamoDB atomic counters to prevent duplicates
- **Tenant Isolation**: Each tenant has its own sequence namespace
- **Type Isolation**: Different entity types have separate sequences
- **Rotation Support**: Can reset sequences on time boundaries

### Rotation Options

| Rotation | Description | Example Use Case |
|----------|-------------|------------------|
| `none` | Never resets | Product IDs, User IDs |
| `yearly` | Resets each year | Annual report numbers |
| `fiscal_yearly` | Resets each fiscal year | Fiscal documents |
| `monthly` | Resets each month | Monthly invoices |
| `daily` | Resets each day | Daily order numbers |

### Example: Monthly Invoice Numbers

```typescript
const invoiceSeq = await this.sequencesService.genNewSequence({
  tenantCode,
  typeCode: 'INVOICE',
  rotate: 'monthly',
})
// Result: 1 on Jan 1, resets to 1 on Feb 1
```

### Sequence Number vs ULID

| Field | Purpose | Format |
|-------|---------|--------|
| `sk` (ULID) | Unique identifier | 01HXY3Z... (26 chars) |
| `seq` | Human-readable number | 1, 2, 3, ... |

Use ULID for system references, sequence for display to users.

Congratulations! You've completed the core tutorial.
- [Complete: Basic](../complete/basic/) - Full application with all features
- [Complete: With Task](../complete/with-task/) - Application with async task processing
## Troubleshooting

### Sequence not incrementing

1. Check that SeqModule is imported in your module
2. Verify SequencesService is injected in the constructor
3. Check DynamoDB sequence table exists

### Duplicate sequence numbers

This should not happen with atomic operations. If it does:
1. Check for multiple process instances
2. Verify DynamoDB table configuration

### Sequence starts at unexpected number

1. Sequences are tenant-isolated; different tenants have separate counters
2. Check the tenantCode in your request

## Navigation

| Previous | Next |
|----------|------|
| [Step 06: Update/Delete](../step-06-update-delete/) | [Complete: Basic](../complete/basic/) |

## Related Resources

- **Documentation**: [Build a Todo App - Part 6](https://mbc-cqrs-serverless.mbc-net.com/docs/build-todo-app#part-6-sequence-numbers-step-07-sequence)
- **Blog (Japanese)**: [Part 7: シーケンス(採番)の実装](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-7/)
