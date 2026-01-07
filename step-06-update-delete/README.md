# Step 06: Update & Delete

MBC CQRS Serverless Framework Tutorial - Step 6: Update and Delete Functionality

## What You'll Learn

- Partial updates with publishPartialUpdate
- Optimistic Locking
- Soft Delete
- Importance of version management

## Prerequisites

- [Step 05: Search](../step-05-search/) completed

## Update/Delete Architecture Overview

In the CQRS pattern, updates and deletes are also issued as "commands."
Optimistic locking ensures data consistency during concurrent updates.

```
┌─────────────────────────────────────────────────────────────────┐
│                 Update/Delete Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │   Client     │      │ CommandService│     │  DynamoDB    │   │
│  │  (Browser)   │ ──▶  │ (partial     │ ──▶  │  (Command)   │   │
│  └──────────────┘      │  Update)     │      └──────────────┘   │
│         │              └──────────────┘             │           │
│         │                     │                     │           │
│         ▼                     ▼                     ▼           │
│   PATCH /api/todo      Check Version         New Version        │
│   DELETE /api/todo     Merge Changes         Event Stored       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Changed Files

Files added/modified in this step:

```
src/todo/
├── dto/
│   └── update-todo.dto.ts   # Update parameters DTO (new)
├── todo.controller.ts       # Added PATCH, DELETE endpoints
└── todo.service.ts          # Added update, remove methods
```

## Code Explanation

### 1. Update Parameters DTO (update-todo.dto.ts)

```typescript
export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  name?: string  // Name to update (optional)

  @IsOptional()
  attributes?: TodoAttributes  // Attributes to update (optional)

  @Type(() => Number)
  @IsInt()
  @Min(1)
  version: number  // For optimistic locking (required)
}
```

### 2. Service Layer - Update (todo.service.ts)

```typescript
async update(
  pk: string,
  sk: string,
  updateDto: UpdateTodoDto,
  opts: { invokeContext: IInvoke },
): Promise<TodoDataEntity> {
  // Check if item exists
  const currentItem = await this.dataService.getItem({ pk, sk })
  if (!currentItem) {
    throw new NotFoundException(`Todo not found`)
  }

  // Build partial update object
  const partialUpdate: Record<string, any> = {
    pk,
    sk,
    version: updateDto.version,  // Required for optimistic locking
  }

  if (updateDto.name !== undefined) {
    partialUpdate.name = updateDto.name
  }

  if (updateDto.attributes !== undefined) {
    partialUpdate.attributes = updateDto.attributes
  }

  // Publish partial update command
  const item = await this.commandService.publishPartialUpdate(partialUpdate, opts)

  return new TodoDataEntity(item as TodoDataEntity)
}
```

### 3. Service Layer - Delete (todo.service.ts)

```typescript
async remove(
  pk: string,
  sk: string,
  version: number,
  opts: { invokeContext: IInvoke },
): Promise<TodoDataEntity> {
  // Check if item exists
  const currentItem = await this.dataService.getItem({ pk, sk })
  if (!currentItem) {
    throw new NotFoundException(`Todo not found`)
  }

  // Soft delete: set isDeleted = true
  const item = await this.commandService.publishPartialUpdate(
    {
      pk,
      sk,
      version,
      isDeleted: true,
    },
    opts,
  )

  return new TodoDataEntity(item as TodoDataEntity)
}
```

### 4. Controller Layer (todo.controller.ts)

```typescript
@Patch(':pk/:sk')
async update(
  @INVOKE_CONTEXT() invokeContext: IInvoke,
  @Param('pk') pk: string,
  @Param('sk') sk: string,
  @Body() updateDto: UpdateTodoDto,
): Promise<TodoDataEntity> {
  return this.todoService.update(pk, sk, updateDto, { invokeContext })
}

@Delete(':pk/:sk')
async remove(
  @INVOKE_CONTEXT() invokeContext: IInvoke,
  @Param('pk') pk: string,
  @Param('sk') sk: string,
  @Query('version') version: number,
): Promise<TodoDataEntity> {
  return this.todoService.remove(pk, sk, version, { invokeContext })
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

### 1. Create a Todo

```bash
curl -X POST http://localhost:3000/api/todo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Original Todo",
    "attributes": {
      "description": "This is the original",
      "status": "PENDING"
    }
  }'
```

Response (note pk, sk, version):
```json
{
  "pk": "TODO#MBC",
  "sk": "01HXY...",
  "version": 1,
  "name": "Original Todo",
  ...
}
```

### 2. Update the Todo

```bash
# '#' in pk must be URL-encoded as %23
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

Response (version incremented to 2):
```json
{
  "pk": "TODO#MBC",
  "sk": "01HXY...",
  "version": 2,
  "name": "Updated Todo",
  ...
}
```

### 3. Verify Optimistic Lock Error

Attempting to update with an old version causes an error:

```bash
curl -X PATCH "http://localhost:3000/api/todo/TODO%23MBC/01HXY..." \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "This will fail",
    "version": 1
  }'
```

Response (error):
```json
{
  "statusCode": 409,
  "message": "Version mismatch. Expected 2, got 1"
}
```

### 4. Delete the Todo

```bash
curl -X DELETE "http://localhost:3000/api/todo/TODO%23MBC/01HXY...?version=2" \
  -H "Authorization: Bearer <token>"
```

Response (isDeleted set to true):
```json
{
  "pk": "TODO#MBC",
  "sk": "01HXY...",
  "version": 3,
  "isDeleted": true,
  ...
}
```

### 5. Verify After Deletion

Confirm the item is excluded from search results:

```bash
curl "http://localhost:3000/api/todo" \
  -H "Authorization: Bearer <token>"
```

## Key Concepts

### Optimistic Locking

A mechanism to ensure data consistency during concurrent updates:

1. Client retrieves data (version: 1)
2. Client A updates with version: 1 → Success (version: 2)
3. Client B updates with version: 1 → Failure (version mismatch)

This prevents unintended data overwrites from "last write wins" scenarios.

### Soft Delete

Managing deletion state with a flag instead of actually deleting data:

Benefits:
- Preserves audit trail
- Enables recovery from accidental deletion
- Maintains referential integrity
- Compatible with event sourcing

### publishPartialUpdate

Updates only specified fields instead of complete overwrite:

```typescript
// This only updates the name field
await this.commandService.publishPartialUpdate({
  pk,
  sk,
  version,
  name: 'New Name',  // Only name is updated
  // attributes retain existing values
}, opts)
```

### PATCH vs PUT

| Method | Purpose | Behavior |
|--------|---------|----------|
| PATCH | Partial update | Updates only specified fields |
| PUT | Full replacement | Replaces all fields |

This tutorial uses PATCH.

## Troubleshooting

### Version Mismatch Error

1. Get the latest data to check the version
2. Retry the update with the correct version

### Deleted Todo Still Appears

1. Verify data is synced to RDS
2. Confirm `isDeleted = true` is reflected:
   ```sql
   SELECT id, name, is_deleted FROM todos WHERE id = '...';
   ```

### Update Not Reflected

1. Check Step Functions logs
2. Verify command table in DynamoDB Admin
3. Check data sync handler logs

## Navigation

| Previous | Next |
|----------|------|
| [Step 05: Search](../step-05-search/) | [Step 07: Sequence](../step-07-sequence/) |

## Related Resources

- **Documentation**: [Build a Todo App - Part 5](https://mbc-cqrs-serverless.mbc-net.com/docs/build-todo-app#part-5-update-and-delete-step-06-update-delete)
- **Blog (Japanese)**: [Part 6: データの更新・削除](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-6/)
