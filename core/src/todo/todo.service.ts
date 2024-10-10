import {
  CommandPartialInputModel,
  CommandService,
  DataService,
  DetailDto,
  generateId,
  getUserContext,
  IInvoke,
  toISOStringWithTimezone,
  VERSION_FIRST,
} from '@mbc-cqrs-serverless/core'
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import {
  generateTodoPk,
  generateTodoSk,
  getOrderBys,
  parsePk,
  TODO_PK_PREFIX,
} from 'src/helpers'
import { PrismaService } from 'src/prisma'

import { CreateTodoDto } from './dto/create-todo.dto'
import { TodoSearchDto } from './dto/search-todo.dto'
import { TodoCommandDto } from './dto/todo-command.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'
import { TodoDataEntity } from './entity/todo-data.entity'
import { TodoDataListEntity } from './entity/todo-data-list.entity'

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name)

  constructor(
    private readonly commandService: CommandService,
    private readonly dataService: DataService,
    private readonly prismaService: PrismaService,
  ) {}

  async create(
    createDto: CreateTodoDto,
    opts: { invokeContext: IInvoke },
  ): Promise<TodoDataEntity> {
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

  async findOne(detailDto: DetailDto): Promise<TodoDataEntity> {
    const item = await this.dataService.getItem(detailDto)
    if (!item) {
      throw new NotFoundException('Task not found!')
    }
    this.logger.debug('item:', item)
    return new TodoDataEntity(item as TodoDataEntity)
  }

  async findAll(
    tenantCode: string,
    searchDto: TodoSearchDto,
  ): Promise<TodoDataListEntity> {
    const where: Prisma.TodoWhereInput = {
      isDeleted: searchDto.isDeleted ?? false,
      tenantCode,
    }
    if (searchDto.keyword?.trim()) {
      where.OR = [
        { name: { contains: searchDto.keyword.trim() } },
        { description: { contains: searchDto.keyword.trim() } },
      ]
    }

    if (searchDto.status) {
      where.status = searchDto.status
    }

    if (searchDto.dueDate_gte && searchDto.dueDate_lte) {
      where.dueDate = {
        gte: searchDto.dueDate_gte,
        lte: searchDto.dueDate_lte,
      }
    } else if (searchDto.dueDate_lte) {
      where.dueDate = {
        lte: searchDto.dueDate_lte,
      }
    } else if (searchDto.dueDate_gte) {
      where.dueDate = {
        gte: searchDto.dueDate_gte,
      }
    }

    const { pageSize = 10, page = 1, orderBys = ['-createdAt'] } = searchDto

    const [total, items] = await Promise.all([
      this.prismaService.todo.count({ where }),
      this.prismaService.todo.findMany({
        where,
        take: pageSize,
        skip: pageSize * (page - 1),
        orderBy: getOrderBys<Prisma.TodoOrderByWithRelationInput>(orderBys),
      }),
    ])

    return new TodoDataListEntity({
      total,
      items: items.map(
        (item) =>
          new TodoDataEntity({
            ...item,
            attributes: {
              description: item.description,
              dueDate: toISOStringWithTimezone(item.dueDate),
              status: item.status,
            },
          }),
      ),
    })
  }

  async update(
    detailDto: DetailDto,
    updateDto: UpdateTodoDto,
    opts: { invokeContext: IInvoke },
  ): Promise<TodoDataEntity> {
    const userContext = getUserContext(opts.invokeContext)
    const { tenantCode } = parsePk(detailDto.pk)
    if (userContext.tenantCode !== tenantCode) {
      throw new BadRequestException('Invalid tenant code')
    }
    const data = (await this.dataService.getItem(detailDto)) as TodoDataEntity
    if (!data) {
      throw new NotFoundException('Task not found!')
    }
    const commandDto: CommandPartialInputModel = {
      pk: data.pk,
      sk: data.sk,
      version: data.version,
      name: updateDto.name ?? data.name,
      isDeleted: updateDto.isDeleted ?? data.isDeleted,
      attributes: {
        ...data.attributes,
        ...updateDto.attributes,
      },
    }
    const item = await this.commandService.publishPartialUpdate(
      commandDto,
      opts,
    )
    return new TodoDataEntity(item as TodoDataEntity)
  }

  async remove(key: DetailDto, opts: { invokeContext: IInvoke }) {
    const userContext = getUserContext(opts.invokeContext)
    const { tenantCode } = parsePk(key.pk)

    if (userContext.tenantCode !== tenantCode) {
      throw new BadRequestException('Invalid tenant code')
    }

    const data = (await this.dataService.getItem(key)) as TodoDataEntity
    if (!data) {
      throw new NotFoundException()
    }
    const commandDto: CommandPartialInputModel = {
      pk: data.pk,
      sk: data.sk,
      version: data.version,
      isDeleted: true,
    }
    const item = await this.commandService.publishPartialUpdate(
      commandDto,
      opts,
    )

    return new TodoDataEntity(item as any)
  }
}
