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
} from '@mbc-cqrs-severless/core'
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import {
  generateTaskPk,
  generateTaskSk,
  getOrderBys,
  parsePk,
  TASK_PK_PREFIX,
} from 'src/helpers'
import { PrismaService } from 'src/prisma'

import { CreateTaskDto } from './dto/create-task.dto'
import { TaskSearchDto } from './dto/search-task.dto'
import { TaskCommandDto } from './dto/task-command.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { TaskDataEntity } from './entity/task-data.entity'
import { TaskDataListEntity } from './entity/task-data-list.entity'

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name)

  constructor(
    private readonly commandService: CommandService,
    private readonly dataService: DataService,
    private readonly prismaService: PrismaService,
  ) {}

  async create(
    createDto: CreateTaskDto,
    opts: { invokeContext: IInvoke },
  ): Promise<TaskDataEntity> {
    const { tenantCode } = getUserContext(opts.invokeContext)
    const pk = generateTaskPk(tenantCode)
    const sk = generateTaskSk()
    const task = new TaskCommandDto({
      pk,
      sk,
      id: generateId(pk, sk),
      tenantCode,
      code: sk,
      type: TASK_PK_PREFIX,
      version: VERSION_FIRST,
      name: createDto.name,
      attributes: createDto.attributes,
    })
    const item = await this.commandService.publish(task, opts)
    return new TaskDataEntity(item as TaskDataEntity)
  }

  async findOne(detailDto: DetailDto): Promise<TaskDataEntity> {
    const item = await this.dataService.getItem(detailDto)
    if (!item) {
      throw new NotFoundException('Task not found!')
    }
    this.logger.debug('item:', item)
    return new TaskDataEntity(item as TaskDataEntity)
  }

  async findAll(
    tenantCode: string,
    searchDto: TaskSearchDto,
  ): Promise<TaskDataListEntity> {
    const where: Prisma.TaskWhereInput = {
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
      this.prismaService.task.count({ where }),
      this.prismaService.task.findMany({
        where,
        take: pageSize,
        skip: pageSize * (page - 1),
        orderBy: getOrderBys<Prisma.TaskOrderByWithRelationInput>(orderBys),
      }),
    ])

    return new TaskDataListEntity({
      total,
      items: items.map(
        (item) =>
          new TaskDataEntity({
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
    updateDto: UpdateTaskDto,
    opts: { invokeContext: IInvoke },
  ): Promise<TaskDataEntity> {
    const userContext = getUserContext(opts.invokeContext)
    const { tenantCode } = parsePk(detailDto.pk)
    if (userContext.tenantCode !== tenantCode) {
      throw new BadRequestException('Invalid tenant code')
    }
    const data = (await this.dataService.getItem(detailDto)) as TaskDataEntity
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
    return new TaskDataEntity(item as TaskDataEntity)
  }

  async remove(key: DetailDto, opts: { invokeContext: IInvoke }) {
    const userContext = getUserContext(opts.invokeContext)
    const { tenantCode } = parsePk(key.pk)

    if (userContext.tenantCode !== tenantCode) {
      throw new BadRequestException('Invalid tenant code')
    }

    const data = (await this.dataService.getItem(key)) as TaskDataEntity
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

    return new TaskDataEntity(item as any)
  }
}
