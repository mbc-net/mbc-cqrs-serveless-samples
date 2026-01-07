# Step 05: Search

MBC CQRS Serverless Framework Tutorial - Step 5: Search and List Functionality

## What You'll Learn

- Search queries using RDS (MySQL)
- Filtering and pagination with Prisma
- Implementing the Query side in CQRS
- Why use RDS instead of DynamoDB

## Prerequisites

- [Step 04: Read](../step-04-read/) completed

## Search Architecture Overview

In the CQRS pattern, you can use a data store optimized for reads (Query).
While DynamoDB excels at single-item retrieval, RDS is better suited for complex searches.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Search Architecture                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │   Client     │      │   Prisma     │      │    RDS       │   │
│  │  (Browser)   │ ──▶  │  (ORM)       │ ──▶  │  (MySQL)     │   │
│  └──────────────┘      └──────────────┘      └──────────────┘   │
│         │                     │                     │           │
│         │                     │                     │           │
│         ▼                     ▼                     ▼           │
│   GET /api/todo?...     Build SQL Query     Complex Queries     │
│                                              - LIKE             │
│                                              - ORDER BY         │
│                                              - LIMIT/OFFSET     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Changed Files

Files added/modified in this step:

```
src/todo/
├── dto/
│   └── search-todo.dto.ts   # Search parameters DTO (new)
├── todo.controller.ts       # Added GET / endpoint
└── todo.service.ts          # Added findAll method
```

## Code Explanation

### 1. Search Parameters DTO (search-todo.dto.ts)

```typescript
export class SearchTodoDto {
  @IsOptional()
  @IsString()
  name?: string  // Partial match search by name

  @IsOptional()
  @IsEnum(TodoStatus)
  status?: TodoStatus  // Filter by status

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1  // Page number (1-based)

  @Type(() => Number)
  @IsInt()
  @Max(100)
  limit?: number = 10  // Items per page

  sortBy?: string = 'createdAt'  // Sort field
  sortOrder?: 'ASC' | 'DESC' = 'DESC'  // Sort order
}

export class SearchTodoResultDto<T> {
  data: T[]       // Search results
  total: number   // Total count
  page: number    // Current page
  limit: number   // Page size
  totalPages: number  // Total pages
}
```

### 2. Service Layer (todo.service.ts)

```typescript
async findAll(
  tenantCode: string,
  searchDto: SearchTodoDto,
): Promise<SearchTodoResultDto<TodoDataEntity>> {
  const { name, status, page, limit, sortBy, sortOrder } = searchDto

  // Build where clause dynamically
  const where: Prisma.TodoWhereInput = {
    tenantCode,
    isDeleted: false,
  }

  // Add name filter (partial match)
  if (name) {
    where.name = { contains: name }
  }

  // Add status filter
  if (status) {
    where.status = status
  }

  // Execute query with pagination
  const [data, total] = await Promise.all([
    this.prismaService.todo.findMany({
      where,
      orderBy: { [sortBy]: sortOrder.toLowerCase() },
      skip: (page - 1) * limit,
      take: limit,
    }),
    this.prismaService.todo.count({ where }),
  ])

  return new SearchTodoResultDto(data, total, page, limit)
}
```

### 3. Controller Layer (todo.controller.ts)

```typescript
@Get('/')
async findAll(
  @INVOKE_CONTEXT() invokeContext: IInvoke,
  @Query() searchDto: SearchTodoDto,
): Promise<SearchTodoResultDto<TodoDataEntity>> {
  const { tenantCode } = getUserContext(invokeContext)
  return this.todoService.findAll(tenantCode, searchDto)
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

### 1. Create Test Data

First, create several todos:

```bash
# Todo 1
curl -X POST http://localhost:3000/api/todo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Buy groceries", "attributes": {"status": "PENDING"}}'

# Todo 2
curl -X POST http://localhost:3000/api/todo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Write documentation", "attributes": {"status": "IN_PROGRESS"}}'

# Todo 3
curl -X POST http://localhost:3000/api/todo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Buy new laptop", "attributes": {"status": "COMPLETED"}}'
```

### 2. Get All Items

```bash
curl "http://localhost:3000/api/todo" \
  -H "Authorization: Bearer <token>"
```

Response example:
```json
{
  "data": [
    { "name": "Buy new laptop", "status": "COMPLETED", ... },
    { "name": "Write documentation", "status": "IN_PROGRESS", ... },
    { "name": "Buy groceries", "status": "PENDING", ... }
  ],
  "total": 3,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### 3. Filter by Status

```bash
curl "http://localhost:3000/api/todo?status=PENDING" \
  -H "Authorization: Bearer <token>"
```

### 4. Search by Name (Partial Match)

```bash
curl "http://localhost:3000/api/todo?name=Buy" \
  -H "Authorization: Bearer <token>"
```

### 5. Pagination

```bash
curl "http://localhost:3000/api/todo?page=1&limit=2" \
  -H "Authorization: Bearer <token>"
```

### 6. Sorting

```bash
# Sort by name ascending
curl "http://localhost:3000/api/todo?sortBy=name&sortOrder=ASC" \
  -H "Authorization: Bearer <token>"
```

## Key Concepts

### Why Use RDS?

DynamoDB limitations:
- Cannot do partial match search (LIKE)
- Cannot specify multiple sort conditions
- Inefficient for aggregations (COUNT, SUM, AVG)

RDS advantages:
- Flexible search queries
- Complex sort conditions
- Easy pagination
- Future JOIN support

### Prisma Benefits

- Type-safe query builder
- Automatic SQL escaping
- Migration management
- Intuitive API

### Tenant Isolation

Adding a `tenantCode` condition to all queries ensures data isolation in multi-tenant environments:

```typescript
const where: Prisma.TodoWhereInput = {
  tenantCode,  // Required condition
  isDeleted: false,
}
```

## Troubleshooting

### Search Returns 0 Results

1. Verify data is synced to RDS
2. Connect to MySQL directly and check:
   ```bash
   mysql -h localhost -u root -pRootCqrs cqrs
   SELECT * FROM todos;
   ```
3. Confirm there is data with `isDeleted = false`

### Sorting Not Working

1. Verify `sortBy` parameter is a valid field name
2. Valid fields: `name`, `status`, `createdAt`, `updatedAt`

## Navigation

| Previous | Next |
|----------|------|
| [Step 04: Read](../step-04-read/) | [Step 06: Update/Delete](../step-06-update-delete/) |

## Related Resources

- **Documentation**: [Build a Todo App - Part 4](https://mbc-cqrs-serverless.mbc-net.com/docs/build-todo-app#part-4-search-operations-step-05-search)
- **Blog (Japanese)**: [Part 5: データの検索](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-5/)
