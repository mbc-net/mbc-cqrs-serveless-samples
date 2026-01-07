# Complete Todo Application

A complete Todo application built with MBC CQRS Serverless Framework.

This is the final result of following the step-by-step tutorial (steps 01-07).

## Features

- **Create** - Create new todo items with auto-generated sequence numbers
- **Read** - Get single todo item by PK/SK
- **Search** - List and search todos with filtering and pagination (via RDS)
- **Update** - Partial updates with optimistic locking
- **Delete** - Soft delete with version control
- **RDS Sync** - Automatic synchronization from DynamoDB to MySQL
- **Sequence** - Auto-generated human-readable sequence numbers

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Complete Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │   Client     │                                               │
│  └──────────────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │  Controller  │ ──▶  │   Service    │ ──▶  │   Command    │   │
│  │  (REST API)  │      │   Layer      │      │   Service    │   │
│  └──────────────┘      └──────────────┘      └──────────────┘   │
│                               │                     │           │
│                               │                     ▼           │
│                               │              ┌──────────────┐   │
│                               │              │  DynamoDB    │   │
│                               │              │  (Command)   │   │
│                               │              └──────────────┘   │
│                               │                     │           │
│                               │                     ▼ Stream    │
│                               ▼              ┌──────────────┐   │
│                        ┌──────────────┐      │ Step         │   │
│                        │  DataService │      │ Functions    │   │
│                        │  (Read)      │      └──────────────┘   │
│                        └──────────────┘             │           │
│                               │                     ▼           │
│                               ▼              ┌──────────────┐   │
│                        ┌──────────────┐      │  DynamoDB    │   │
│                        │  DynamoDB    │ ◀─── │  (Data)      │   │
│                        │  (Data)      │      └──────────────┘   │
│                        └──────────────┘             │           │
│                                                     ▼           │
│                                              ┌──────────────┐   │
│                        ┌──────────────┐ ◀─── │ DataSync     │   │
│                        │  RDS/MySQL   │      │ Handler      │   │
│                        │  (Query)     │      └──────────────┘   │
│                        └──────────────┘                         │
│                               ▲                                  │
│                               │                                  │
│                        ┌──────────────┐                         │
│                        │   Prisma     │                         │
│                        │   (ORM)      │                         │
│                        └──────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

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

## Running Tests

### Unit Tests

```bash
npm test
```

Runs all unit tests for the TodoService and TodoController.

### E2E Tests

```bash
npm run test:e2e
```

Runs end-to-end HTTP tests for all API endpoints.

## Testing the API

### Create Todo

```bash
curl -X POST http://localhost:3000/api/todo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "My Todo",
    "attributes": {
      "description": "This is a test todo",
      "status": "PENDING"
    }
  }'
```

### List Todos

```bash
curl "http://localhost:3000/api/todo?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Get Single Todo

```bash
# Note: '#' in pk must be URL-encoded as %23
curl "http://localhost:3000/api/todo/TODO%23MBC/01HXY..." \
  -H "Authorization: Bearer <token>"
```

### Update Todo

```bash
curl -X PATCH "http://localhost:3000/api/todo/TODO%23MBC/01HXY..." \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Updated Todo",
    "attributes": {
      "status": "IN_PROGRESS"
    },
    "version": 1
  }'
```

### Delete Todo

```bash
curl -X DELETE "http://localhost:3000/api/todo/TODO%23MBC/01HXY...?version=2" \
  -H "Authorization: Bearer <token>"
```

## Project Structure

```
├── src/
│   ├── helpers/                # Helper functions (PK/SK generation)
│   ├── todo/
│   │   ├── dto/               # Data Transfer Objects
│   │   │   ├── create-todo.dto.ts
│   │   │   ├── update-todo.dto.ts
│   │   │   ├── search-todo.dto.ts
│   │   │   └── todo-attributes.dto.ts
│   │   ├── entity/            # Entity definitions
│   │   │   └── todo-data.entity.ts
│   │   ├── handler/           # Data sync handlers
│   │   │   └── todo-rds.handler.ts
│   │   ├── todo.controller.ts       # REST API controller
│   │   ├── todo.controller.spec.ts  # Controller unit tests
│   │   ├── todo.service.ts          # Business logic
│   │   ├── todo.service.spec.ts     # Service unit tests
│   │   └── todo.module.ts           # Module configuration
│   ├── event-factory.ts       # Event factory configuration
│   ├── main.module.ts         # Main application module
│   └── main.ts                # Application entry point
├── test/
│   ├── jest-e2e.json          # E2E test configuration
│   └── todo.e2e-spec.ts       # E2E tests
├── prisma/
│   └── schema.prisma          # Database schema
├── infra-local/               # Local development infrastructure
└── package.json
```

## Key Concepts

### CQRS Pattern
- **Command**: Write operations go through CommandService
- **Query**: Read operations use DataService (single items) or Prisma (complex queries)

### Event Sourcing
- All changes are stored as events in the command table
- Data table contains current state
- Full audit trail maintained

### Multi-tenancy
- Tenant isolation via tenantCode
- Each tenant has separate sequences and data

### Optimistic Locking
- Version field prevents concurrent update conflicts
- Version must be provided for updates and deletes

## Next Steps

- [With Task](../with-task/) - Add async task processing capabilities

## Related Documentation

- [Tutorial Steps](../../) - Step-by-step guide
- [MBC CQRS Serverless Docs](https://mbc-cqrs-serverless.mbc-net.com)

## Navigation

| Previous | Next |
|----------|------|
| [Step 07: Sequence](../../step-07-sequence/) | [Complete: With Task](../with-task/) |

## Related Resources

- **Documentation**: [Build a Todo App](https://mbc-cqrs-serverless.mbc-net.com/docs/build-todo-app)
- **All Tutorial Steps**: [Samples Overview](../../)
