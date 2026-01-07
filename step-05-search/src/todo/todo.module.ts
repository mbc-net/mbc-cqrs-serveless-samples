import { CommandModule } from '@mbc-cqrs-serverless/core'
import { Module } from '@nestjs/common'

import { TodoDataSyncRdsHandler } from './handler/todo-rds.handler'
import { TodoController } from './todo.controller'
import { TodoService } from './todo.service'

@Module({
  imports: [
    CommandModule.register({
      tableName: 'todo',
      // Register RDS sync handler to synchronize DynamoDB data to MySQL
      dataSyncHandlers: [TodoDataSyncRdsHandler],
    }),
  ],
  controllers: [TodoController],
  providers: [TodoService],
})
export class TodoModule {}
