import { CommandModule } from '@mbc-cqrs-serverless/core'
import { SequencesModule } from '@mbc-cqrs-serverless/sequence'
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
    // Import SequencesModule for sequence number generation
    SequencesModule,
  ],
  controllers: [TodoController],
  providers: [TodoService],
})
export class TodoModule {}
