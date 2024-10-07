import {
  CommandModel,
  IDataSyncHandler,
  removeSortKeyVersion,
} from '@mbc-cqrs-serverless/core'
import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from 'src/prisma'

import { TaskAttributes } from '../dto/task-attributes.dto'

@Injectable()
export class TaskDataSyncRdsHandler implements IDataSyncHandler {
  private readonly logger = new Logger(TaskDataSyncRdsHandler.name)

  constructor(private readonly prismaService: PrismaService) {}

  async up(cmd: CommandModel): Promise<any> {
    this.logger.debug(cmd)
    const sk = removeSortKeyVersion(cmd.sk)
    const attrs = cmd.attributes as TaskAttributes
    await this.prismaService.task.upsert({
      where: {
        id: cmd.id,
      },
      update: {
        csk: cmd.sk,
        name: cmd.name,
        version: cmd.version,
        seq: cmd.seq,
        isDeleted: cmd.isDeleted || false,
        updatedAt: cmd.updatedAt,
        updatedBy: cmd.updatedBy,
        updatedIp: cmd.updatedIp,
        description: attrs?.description,
        status: attrs?.status,
        dueDate: attrs?.dueDate,
      },
      create: {
        id: cmd.id,
        cpk: cmd.pk,
        csk: cmd.sk,
        pk: cmd.pk,
        sk,
        code: sk,
        name: cmd.name,
        version: cmd.version,
        tenantCode: cmd.tenantCode,
        seq: cmd.seq,
        createdAt: cmd.createdAt,
        createdBy: cmd.createdBy,
        createdIp: cmd.createdIp,
        updatedAt: cmd.updatedAt,
        updatedBy: cmd.updatedBy,
        updatedIp: cmd.updatedIp,
        description: attrs?.description,
        status: attrs?.status,
        dueDate: attrs?.dueDate,
      },
    })
  }
  async down(cmd: CommandModel): Promise<any> {
    this.logger.debug(cmd)
  }
}
