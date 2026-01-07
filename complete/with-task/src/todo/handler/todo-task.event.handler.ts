import { EventHandler, IEventHandler } from '@mbc-cqrs-serverless/core'
import { Logger } from '@nestjs/common'
import { sleep } from 'src/helpers'

import { TodoTaskEvent } from './todo-task.event'

/**
 * TodoTaskEventHandler processes async tasks for todo items.
 *
 * This handler is invoked when a TodoTaskEvent is dispatched from the SQS queue.
 * It demonstrates how to implement long-running operations that shouldn't block
 * the main API request/response cycle.
 *
 * Use cases:
 * - Sending notification emails when a todo is completed
 * - Generating reports for todo statistics
 * - Syncing todo data to external systems
 * - Batch processing of related todo items
 *
 * Flow:
 * 1. API creates a task via TaskService.createTask()
 * 2. Task is queued and processed asynchronously
 * 3. This handler receives the TodoTaskEvent
 * 4. Handler performs the long-running operation
 * 5. Result is returned (can be used for logging/monitoring)
 *
 * Error handling:
 * - If this handler throws an error, the task will be retried (SQS retry policy)
 * - After max retries, the task goes to the dead-letter queue
 */
@EventHandler(TodoTaskEvent)
export class TodoTaskEventHandler implements IEventHandler<TodoTaskEvent> {
  private readonly logger = new Logger(TodoTaskEventHandler.name)

  async execute(event: TodoTaskEvent): Promise<any> {
    this.logger.debug(
      `Begin processing the task: ${event.taskEvent.eventID}`,
      event.todo,
    )

    // Simulate a long-running task (e.g., sending email, generating report)
    // In production, replace this with actual business logic
    await sleep(3000)

    this.logger.debug(`Process task completed: ${event.taskEvent.eventID}`)

    // Return result for logging/monitoring purposes
    return {
      taskId: event.taskEvent.eventID,
      todoId: event.todo.id,
      status: 'completed',
      processedAt: new Date().toISOString(),
    }
  }
}
