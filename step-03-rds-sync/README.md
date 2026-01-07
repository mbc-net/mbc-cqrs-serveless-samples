# Step 03: RDS Data Sync

MBC CQRS Serverless Framework Tutorial - Step 3: Data Synchronization to RDS

## What You'll Learn

- Data synchronization from DynamoDB to RDS (MySQL)
- Implementing the IDataSyncHandler interface
- Prisma schema definition
- Event-driven architecture

## Prerequisites

- [Step 02: Create Command](../step-02-create/) completed

## Data Sync Overview

In the CQRS pattern, you can separate the write (Command) and read (Query) data stores.
In this step, we synchronize data stored in DynamoDB to RDS (MySQL) to enable complex queries.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Sync Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │  DynamoDB    │      │  DynamoDB    │      │    RDS       │   │
│  │  (Command)   │ ──▶  │   (Data)     │ ──▶  │  (MySQL)     │   │
│  └──────────────┘      └──────────────┘      └──────────────┘   │
│         │                     │                     │           │
│         │                     │                     │           │
│         ▼                     ▼                     ▼           │
│   Event History         Current State       Complex Queries     │
│   (All versions)        (Latest only)       (Search, Filter)    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## New Files

Files added in this step:

```
src/todo/handler/
├── todo-rds.handler.ts   # RDS sync handler
└── index.ts

prisma/
└── schema.prisma         # Todo model added
```

## Code Explanation

### 1. Prisma Schema (prisma/schema.prisma)

```prisma
enum TodoStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELED
}

model Todo {
  id         String   @id
  cpk        String                      // Command partition key
  csk        String                      // Command sort key (with version)
  pk         String                      // Data partition key
  sk         String                      // Data sort key
  tenantCode String   @map("tenant_code")
  seq        Int      @default(0)
  code       String
  name       String
  version    Int
  isDeleted  Boolean  @default(false) @map("is_deleted")
  // ... timestamps and audit fields

  // Todo-specific attributes
  description String?
  status      TodoStatus @default(PENDING)
  dueDate     DateTime?

  @@unique([cpk, csk])
  @@unique([pk, sk])
  @@unique([tenantCode, code])
  @@map("todos")
}
```

### 2. Data Sync Handler (todo-rds.handler.ts)

```typescript
@Injectable()
export class TodoDataSyncRdsHandler implements IDataSyncHandler {
  constructor(private readonly prismaService: PrismaService) {}

  async up(cmd: CommandModel): Promise<any> {
    const sk = removeSortKeyVersion(cmd.sk)
    const attrs = cmd.attributes as TodoAttributes

    await this.prismaService.todo.upsert({
      where: { id: cmd.id },
      update: {
        // Update fields
        name: cmd.name,
        version: cmd.version,
        isDeleted: cmd.isDeleted || false,
        description: attrs?.description,
        status: attrs?.status,
        dueDate: attrs?.dueDate,
      },
      create: {
        // Create fields
        id: cmd.id,
        pk: cmd.pk,
        sk,
        name: cmd.name,
        // ...
      },
    })
  }
}
```

### 3. Module Registration (todo.module.ts)

```typescript
@Module({
  imports: [
    CommandModule.register({
      tableName: 'todo',
      dataSyncHandlers: [TodoDataSyncRdsHandler],  // Added
    }),
  ],
  // ...
})
export class TodoModule {}
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

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

**Important**: This step's Prisma migration creates the `todos` table in MySQL.

### 5. Start Development Server

```bash
npm run offline:sls
```

## Testing

### 1. Create a Todo

```bash
curl -X POST http://localhost:3000/api/todo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Test Todo",
    "attributes": {
      "description": "Testing RDS sync",
      "status": "PENDING"
    }
  }'
```

### 2. Verify in MySQL

Connect to MySQL client and verify:

```bash
mysql -h localhost -u root -pRootCqrs cqrs
```

```sql
SELECT * FROM todos;
```

Alternatively, you can verify that data is synchronized in both DynamoDB Admin (http://localhost:8001) and MySQL.

## Key Concepts

### IDataSyncHandler

Interface for data sync handlers:

- `up(cmd)`: Called when data is created or updated
- `down(cmd)`: Called during rollback (optional)

### removeSortKeyVersion

The sort key in the command table includes version information (e.g., `01HXY...#1`).
When saving to the data table, this version portion is removed.

### Upsert Pattern

Using `upsert` allows you to update if the record exists, or create if it doesn't, in a single operation.
This enables handling both CREATE and UPDATE events with the same handler.

### Why Sync to RDS?

DynamoDB has limitations for the following operations:
- Complex search queries (LIKE, range searches)
- Aggregations (COUNT, SUM, AVG)
- Multiple sort conditions

Syncing to RDS enables these operations.

## Troubleshooting

### Migration Errors

Verify MySQL is running:

```bash
docker ps | grep mysql
```

### Data Not Syncing

1. Check the `npm run offline:sls` logs
2. Verify DynamoDB Streams is enabled
3. Confirm handlers are properly registered

## Navigation

| Previous | Next |
|----------|------|
| [Step 02: Create](../step-02-create/) | [Step 04: Read](../step-04-read/) |

## Related Resources

- **Documentation**: [Build a Todo App - Part 2](https://mbc-cqrs-serverless.mbc-net.com/docs/build-todo-app#part-2-rds-data-synchronization-step-03-rds-sync)
- **Blog (Japanese)**: [Part 3: RDSデータを反映](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-3/)
