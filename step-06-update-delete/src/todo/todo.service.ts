import {
  CommandPartialInputModel,
  CommandService,
  DataService,
  generateId,
  getUserContext,
  IInvoke,
  VERSION_FIRST,
} from '@mbc-cqrs-serverless/core'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { generateTodoPk, generateTodoSk, TODO_PK_PREFIX } from 'src/helpers'

import { CreateTodoDto } from './dto/create-todo.dto'
import { SearchTodoDto, SearchTodoResultDto } from './dto/search-todo.dto'
import { TodoCommandDto } from './dto/todo-command.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'
import { TodoDataEntity } from './entity/todo-data.entity'

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name)

  constructor(
    private readonly commandService: CommandService,
    private readonly dataService: DataService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Create a new Todo item
   * This publishes a command to DynamoDB which will be processed by Step Functions
   */
  async create(
    createDto: CreateTodoDto,
    opts: { invokeContext: IInvoke },
  ): Promise<TodoDataEntity> {
    // Get tenant code from user context (JWT token)
    const { tenantCode } = getUserContext(opts.invokeContext)

    // Generate partition key and sort key
    const pk = generateTodoPk(tenantCode)
    const sk = generateTodoSk()

    // Create command DTO
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

    this.logger.debug('Creating todo:', todo)

    // Publish command to DynamoDB
    // This triggers Step Functions workflow which will:
    // 1. Save command to command table
    // 2. Copy data to data table
    // 3. Trigger data sync handlers (added in step-03)
    const item = await this.commandService.publish(todo, opts)

    return new TodoDataEntity(item as TodoDataEntity)
  }

  /**
   * Get a single Todo item by pk and sk
   * This retrieves data from the DynamoDB data table
   */
  async findOne(pk: string, sk: string): Promise<TodoDataEntity> {
    this.logger.debug(`Finding todo: pk=${pk}, sk=${sk}`)

    // Get item from data table using DataService
    // DataService reads from the "data" table which contains the current state
    const item = await this.dataService.getItem({
      pk,
      sk,
    })

    if (!item) {
      throw new NotFoundException(`Todo not found: pk=${pk}, sk=${sk}`)
    }

    return new TodoDataEntity(item as TodoDataEntity)
  }

  /**
   * Search and list Todo items with filtering and pagination
   * This queries the RDS (MySQL) database via Prisma for complex queries
   *
   * Why RDS instead of DynamoDB?
   * - DynamoDB is optimized for single-item access and simple queries
   * - RDS (MySQL) supports complex queries like:
   *   - Partial string matching (LIKE)
   *   - Multiple sort conditions
   *   - Aggregations (COUNT, SUM, etc.)
   *   - JOINs (if needed in the future)
   */
  async findAll(
    tenantCode: string,
    searchDto: SearchTodoDto,
  ): Promise<SearchTodoResultDto<TodoDataEntity>> {
    this.logger.debug(`Searching todos for tenant: ${tenantCode}`, searchDto)

    const { name, status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = searchDto

    // Build where clause dynamically
    const where: Prisma.TodoWhereInput = {
      tenantCode,
      isDeleted: false,
    }

    // Add name filter (partial match)
    if (name) {
      where.name = {
        contains: name,
      }
    }

    // Add status filter (exact match)
    if (status) {
      where.status = status
    }

    // Build orderBy clause
    const orderBy: Prisma.TodoOrderByWithRelationInput = {
      [sortBy]: sortOrder.toLowerCase(),
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.prismaService.todo.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prismaService.todo.count({ where }),
    ])

    // Map Prisma results to TodoDataEntity
    const todos = data.map((item) => new TodoDataEntity({
      ...item,
      type: TODO_PK_PREFIX,
      attributes: {
        description: item.description,
        status: item.status,
        dueDate: item.dueDate?.toISOString(),
      },
    } as unknown as TodoDataEntity))

    return new SearchTodoResultDto(todos, total, page, limit)
  }

  /**
   * Update a Todo item
   * Uses publishPartialUpdate for partial updates with optimistic locking
   *
   * Key concepts:
   * - publishPartialUpdate: Only updates specified fields
   * - version: Required for optimistic locking (prevents concurrent update conflicts)
   * - attributes: Merged with existing attributes
   */
  async update(
    pk: string,
    sk: string,
    updateDto: UpdateTodoDto,
    opts: { invokeContext: IInvoke },
  ): Promise<TodoDataEntity> {
    this.logger.debug(`Updating todo: pk=${pk}, sk=${sk}`, updateDto)

    // First, get the current item to verify it exists
    const currentItem = await this.dataService.getItem({ pk, sk })
    if (!currentItem) {
      throw new NotFoundException(`Todo not found: pk=${pk}, sk=${sk}`)
    }

    // Build the partial update object
    // Only include fields that are provided in the DTO
    const partialUpdate: CommandPartialInputModel = {
      pk,
      sk,
      version: updateDto.version, // Required for optimistic locking
      ...(updateDto.name !== undefined && { name: updateDto.name }),
      ...(updateDto.attributes !== undefined && { attributes: updateDto.attributes }),
    }

    // Publish partial update command
    // This will:
    // 1. Verify version matches (optimistic locking)
    // 2. Merge with existing data
    // 3. Create new version in command table
    // 4. Update data table
    // 5. Trigger data sync handlers
    const item = await this.commandService.publishPartialUpdate(partialUpdate, opts)

    return new TodoDataEntity(item as TodoDataEntity)
  }

  /**
   * Delete a Todo item (soft delete)
   * Sets isDeleted flag to true instead of actually deleting
   *
   * Why soft delete?
   * - Preserves audit trail
   * - Allows recovery if needed
   * - Maintains referential integrity
   * - CQRS/Event Sourcing pattern: keep all events
   */
  async remove(
    pk: string,
    sk: string,
    version: number,
    opts: { invokeContext: IInvoke },
  ): Promise<TodoDataEntity> {
    this.logger.debug(`Removing todo: pk=${pk}, sk=${sk}, version=${version}`)

    // First, get the current item to verify it exists
    const currentItem = await this.dataService.getItem({ pk, sk })
    if (!currentItem) {
      throw new NotFoundException(`Todo not found: pk=${pk}, sk=${sk}`)
    }

    // Publish partial update with isDeleted = true
    // This is a soft delete - the record still exists but is marked as deleted
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
}
