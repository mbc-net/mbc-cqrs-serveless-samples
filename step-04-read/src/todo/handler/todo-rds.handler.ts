import {
  CommandModel,
  IDataSyncHandler,
  removeSortKeyVersion,
} from '@mbc-cqrs-serverless/core'
import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from 'src/prisma'

import { TodoAttributes } from '../dto/todo-attributes.dto'

/**
 * Data sync handler for synchronizing DynamoDB data to RDS (MySQL)
 *
 * This handler is triggered when data is written to DynamoDB's data table.
 * It upserts the data to MySQL for complex queries and reporting.
 */
@Injectable()
export class TodoDataSyncRdsHandler implements IDataSyncHandler {
  private readonly logger = new Logger(TodoDataSyncRdsHandler.name)

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Called when data is created or updated in DynamoDB
   * Upserts the data to MySQL
   */
  async up(cmd: CommandModel): Promise<any> {
    this.logger.debug('Syncing to RDS:', cmd)

    // Remove version suffix from sort key for the data table
    const sk = removeSortKeyVersion(cmd.sk)
    const attrs = cmd.attributes as TodoAttributes

    await this.prismaService.todo.upsert({
      where: {
        id: cmd.id,
      },
      // Update existing record
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
      // Create new record
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

  /**
   * Called when data needs to be rolled back
   * Currently not implemented - override if rollback is needed
   */
  async down(cmd: CommandModel): Promise<any> {
    this.logger.debug('Rollback requested:', cmd)
    // Implement rollback logic if needed
  }
}
