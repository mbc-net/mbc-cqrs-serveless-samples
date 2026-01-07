import { Module } from '@nestjs/common'

import { CustomEventFactory } from './event-factory'
import { MyTaskModule } from './my-task/my-task.module'
import { prismaLoggingMiddleware, PrismaModule } from './prisma'
import { TodoModule } from './todo/todo.module'

/**
 * MainModule is the root module of the application.
 *
 * This module includes:
 * - PrismaModule: Database ORM for MySQL/RDS
 * - TodoModule: Todo CRUD operations
 * - MyTaskModule: Async task processing (NEW in with-task)
 * - CustomEventFactory: Event transformation for DynamoDB Streams
 *
 * The with-task version adds async task processing capabilities:
 * - TaskModule for creating and processing background tasks
 * - SQS queue integration for reliable task delivery
 * - Event handlers for processing tasks asynchronously
 */
@Module({
  imports: [
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [prismaLoggingMiddleware()],
        prismaOptions: {
          log:
            process.env.NODE_ENV !== 'local'
              ? ['error']
              : ['info', 'error', 'warn', 'query'],
        },
        explicitConnect: false,
      },
    }),
    TodoModule,
    MyTaskModule, // Async task processing module
  ],
  providers: [CustomEventFactory],
})
export class MainModule {}
