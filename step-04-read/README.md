# Step 04: Read

MBC CQRS Serverless Framework Tutorial - Step 4: Reading Single Data Items

## What You'll Learn

- Data retrieval using DataService
- PK/SK-based single item retrieval
- Error handling (NotFound)

## Prerequisites

- [Step 03: RDS Sync](../step-03-rds-sync/) completed

## Data Retrieval Overview

In the CQRS pattern, read (Query) and write (Command) operations are separated.
In this step, we use DataService to retrieve a single item from the data table.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Read Architecture                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │   Client     │      │  DataService │      │  DynamoDB    │   │
│  │  (Browser)   │ ──▶  │  (getItem)   │ ──▶  │  (Data)      │   │
│  └──────────────┘      └──────────────┘      └──────────────┘   │
│         │                     │                     │           │
│         │                     │                     │           │
│         ▼                     ▼                     ▼           │
│   GET /api/todo/:pk/:sk   Find by PK+SK       Current State     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Changed Files

Files modified in this step:

```
src/todo/
├── todo.controller.ts   # Added GET /:pk/:sk endpoint
└── todo.service.ts      # Added findOne method
```

## Code Explanation

### 1. Service Layer (todo.service.ts)

```typescript
import { DataService } from '@mbc-cqrs-serverless/core'

@Injectable()
export class TodoService {
  constructor(
    private readonly commandService: CommandService,
    private readonly dataService: DataService,  // Added
  ) {}

  /**
   * Get a single Todo item by pk and sk
   */
  async findOne(pk: string, sk: string): Promise<TodoDataEntity> {
    // Get item from data table using DataService
    const item = await this.dataService.getItem({
      pk,
      sk,
    })

    if (!item) {
      throw new NotFoundException(`Todo not found: pk=${pk}, sk=${sk}`)
    }

    return new TodoDataEntity(item as TodoDataEntity)
  }
}
```

### 2. Controller Layer (todo.controller.ts)

```typescript
@Controller('api/todo')
@ApiTags('todo')
export class TodoController {
  /**
   * Get a single Todo item by pk and sk
   * GET /api/todo/:pk/:sk
   */
  @Get(':pk/:sk')
  async findOne(
    @Param('pk') pk: string,
    @Param('sk') sk: string,
  ): Promise<TodoDataEntity> {
    return this.todoService.findOne(pk, sk)
  }
}
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

### 5. Start Development Server

```bash
npm run offline:sls
```

## Testing

### 1. First, Create a Todo

```bash
curl -X POST http://localhost:3000/api/todo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Test Todo",
    "attributes": {
      "description": "Testing read",
      "status": "PENDING"
    }
  }'
```

Response example:
```json
{
  "pk": "TODO#MBC",
  "sk": "01HXY...",
  "name": "Test Todo",
  ...
}
```

### 2. Retrieve the Created Todo

Use the `pk` and `sk` from the response:

```bash
# '#' in pk must be URL-encoded as %23
curl http://localhost:3000/api/todo/TODO%23MBC/01HXY... \
  -H "Authorization: Bearer <token>"
```

### 3. Retrieve Non-existent Todo (404 Error)

```bash
curl http://localhost:3000/api/todo/TODO%23MBC/NOTFOUND \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "statusCode": 404,
  "message": "Todo not found: pk=TODO#MBC, sk=NOTFOUND"
}
```

## Key Concepts

### DataService vs CommandService

| Service | Purpose | Table |
|---------|---------|-------|
| CommandService | Write operations (Create/Update/Delete) | Command table |
| DataService | Read operations (Read) | Data table |

### getItem Method

`DataService.getItem()` wraps DynamoDB's `GetItem` operation:
- Retrieves a single item by specifying PK and SK
- Returns `null` if the item doesn't exist
- Includes version field for optimistic locking

### URL Encoding

Since PK contains `#`, it must be encoded as `%23` in URLs:
- `TODO#MBC` → `TODO%23MBC`

## Troubleshooting

### 404 Error Returned

1. Verify PK and SK are correct
2. Check URL encoding is correct (`#` → `%23`)
3. Verify data exists in DynamoDB Admin (http://localhost:8001)

### Data Cannot Be Retrieved

1. Check if data exists in the data table (todo-data)
2. If data exists in command table but not in data table, check Step Functions logs

## Navigation

| Previous | Next |
|----------|------|
| [Step 03: RDS Sync](../step-03-rds-sync/) | [Step 05: Search](../step-05-search/) |

## Related Resources

- **Documentation**: [Build a Todo App - Part 3](https://mbc-cqrs-serverless.mbc-net.com/docs/build-todo-app#part-3-read-operations-step-04-read)
- **Blog (Japanese)**: [Part 4: 特定のデータの読込](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-4/)
