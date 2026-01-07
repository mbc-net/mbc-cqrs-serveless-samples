import { TaskModule } from '@mbc-cqrs-serverless/task'
import { Module } from '@nestjs/common'

import { TaskQueueEventFactory } from './task-queue-event-factory'

/**
 * MyTaskModule configures the async task processing infrastructure.
 *
 * Key concepts:
 * - TaskModule: Provides TaskService for creating tasks and SQS queue processing
 * - TaskQueueEventFactory: Transforms queue events into domain-specific events
 *
 * Architecture:
 * 1. Application calls TaskService.createTask() to queue async work
 * 2. Task is stored in DynamoDB tasks table
 * 3. DynamoDB Stream triggers the task processor Lambda
 * 4. Task is sent to SQS queue for processing
 * 5. SQS consumer invokes TaskQueueEventFactory to transform the event
 * 6. Event handler (TodoTaskEventHandler) processes the task
 *
 * Use cases:
 * - Long-running operations (report generation, batch processing)
 * - Operations that shouldn't block the API response
 * - Retry-able operations with SQS dead-letter queue support
 */
@Module({
  imports: [
    TaskModule.register({
      taskQueueEventFactory: TaskQueueEventFactory,
    }),
  ],
  exports: [TaskModule],
})
export class MyTaskModule {}
