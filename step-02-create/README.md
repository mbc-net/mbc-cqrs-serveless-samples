# Step 02: Create Command

MBC CQRS Serverless Framework Tutorial - Step 2: Implementing Write Operations

## What You'll Learn

- Implementing the write side (Command) of the CQRS pattern
- How to use CommandService
- Creating Entities and DTOs
- PK/SK (Partition Key/Sort Key) design

## Prerequisites

- [Step 01: Environment Setup](../step-01-setup/) completed

## CQRS Pattern Overview

MBC CQRS Serverless adopts the CQRS (Command Query Responsibility Segregation) pattern.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CQRS Pattern                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Client]                                                        │
│      │                                                           │
│      ├── POST /api/todo ──────────┐                              │
│      │                            ▼                              │
│      │                    ┌──────────────┐                       │
│      │                    │   Command    │                       │
│      │                    │   Service    │                       │
│      │                    └──────┬───────┘                       │
│      │                           │                               │
│      │                           ▼                               │
│      │                    ┌──────────────┐                       │
│      │                    │  DynamoDB    │                       │
│      │                    │  (Command)   │                       │
│      │                    └──────┬───────┘                       │
│      │                           │                               │
│      │                           ▼                               │
│      │                    ┌──────────────┐                       │
│      │                    │    Step      │                       │
│      │                    │  Functions   │                       │
│      │                    └──────┬───────┘                       │
│      │                           │                               │
│      │                           ▼                               │
│      │                    ┌──────────────┐                       │
│      │                    │  DynamoDB    │                       │
│      │                    │   (Data)     │                       │
│      │                    └──────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## New Files

Files added in this step:

```
src/
├── helpers/
│   ├── id.ts              # ID generation utilities
│   └── index.ts
└── todo/
    ├── dto/
    │   ├── create-todo.dto.ts      # Create request DTO
    │   ├── todo-attributes.dto.ts  # Todo attributes DTO
    │   ├── todo-command.dto.ts     # Command DTO
    │   └── index.ts
    ├── entity/
    │   ├── todo-command.entity.ts  # Command entity
    │   ├── todo-data.entity.ts     # Data entity
    │   └── index.ts
    ├── todo.controller.ts  # Controller
    ├── todo.service.ts     # Service
    ├── todo.module.ts      # Module
    └── index.ts
```

## Code Explanation

### 1. PK/SK Design (helpers/id.ts)

```typescript
export const TODO_PK_PREFIX = 'TODO'

export function generateTodoPk(tenantCode: string): string {
  return `${TODO_PK_PREFIX}${KEY_SEPARATOR}${tenantCode}`
}

export function generateTodoSk(): string {
  return ulid()
}
```

- **PK (Partition Key)**: `TODO#tenantCode` format isolates data per tenant
- **SK (Sort Key)**: ULID (Universally Unique Lexicographically Sortable Identifier) ensures uniqueness and time-based sorting

### 2. DTO (Data Transfer Object)

```typescript
// create-todo.dto.ts
export class CreateTodoDto {
  @IsString()
  name: string

  @Type(() => TodoAttributes)
  @ValidateNested()
  @IsOptional()
  attributes?: TodoAttributes
}
```

- `class-validator` for validation
- `class-transformer` for nested object transformation

### 3. Command Service (todo.service.ts)

```typescript
async create(createDto: CreateTodoDto, opts: { invokeContext: IInvoke }) {
  const { tenantCode } = getUserContext(opts.invokeContext)
  const pk = generateTodoPk(tenantCode)
  const sk = generateTodoSk()

  const todo = new TodoCommandDto({
    pk,
    sk,
    id: generateId(pk, sk),
    tenantCode,
    code: sk,
    type: TODO_PK_PREFIX,
    version: VERSION_FIRST,
    name: createDto.name,
    attributes: createDto.attributes,
  })

  const item = await this.commandService.publish(todo, opts)
  return new TodoDataEntity(item as TodoDataEntity)
}
```

- `getUserContext()`: Gets tenant information from JWT token
- `VERSION_FIRST`: Initial version for optimistic locking
- `commandService.publish()`: Issues command to DynamoDB

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

### 5. Start Development Server

```bash
npm run offline:sls
```

## Testing

### Create a Todo

```bash
curl -X POST http://localhost:3000/api/todo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiY29nbml0bzp1c2VybmFtZSI6InRlc3R1c2VyIiwiY3VzdG9tOnRlbmFudF9jb2RlIjoiVEVTVCIsImlhdCI6MTUxNjIzOTAyMn0.mock" \
  -d '{
    "name": "My First Todo",
    "attributes": {
      "description": "This is a test todo",
      "status": "PENDING"
    }
  }'
```

### Response Example

```json
{
  "pk": "TODO#TEST",
  "sk": "01HXYZ...",
  "id": "TODO#TEST#01HXYZ...",
  "tenantCode": "TEST",
  "name": "My First Todo",
  "version": 1,
  "attributes": {
    "description": "This is a test todo",
    "status": "PENDING"
  }
}
```

## View in DynamoDB Admin

Access http://localhost:8001 in your browser to view table contents in the DynamoDB Admin panel.

- **local-todo-todo-command**: Command table (version history)
- **local-todo-todo-data**: Data table (current state)

## Key Concepts

### VERSION_FIRST

Initial version number for new records. Used as the baseline for optimistic locking.

### CommandService vs DataService

- **CommandService**: Write operations (Create, Update, Delete)
- **DataService**: Read operations (Read) - used in the next step

### Tenant Isolation

Including tenantCode in the PK enables data isolation in multi-tenant environments.

## Navigation

| Previous | Next |
|----------|------|
| [Step 01: Setup](../step-01-setup/) | [Step 03: RDS Sync](../step-03-rds-sync/) |

## Related Resources

- **Documentation**: [Build a Todo App - Part 1](https://mbc-cqrs-serverless.mbc-net.com/docs/build-todo-app#part-1-basic-cqrs-implementation-step-02-create)
- **Blog (Japanese)**: [Part 2: 書き込み処理追加](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-2/)
