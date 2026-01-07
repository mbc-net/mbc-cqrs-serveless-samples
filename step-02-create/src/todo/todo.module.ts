import { CommandModule } from '@mbc-cqrs-serverless/core'
import { Module } from '@nestjs/common'

import { TodoController } from './todo.controller'
import { TodoService } from './todo.service'

@Module({
  imports: [
    CommandModule.register({
      tableName: 'todo',
      // Data sync handlers will be added in step-03-rds-sync
      // dataSyncHandlers: [TodoDataSyncRdsHandler],
    }),
  ],
  controllers: [TodoController],
  providers: [TodoService],
})
export class TodoModule {}
