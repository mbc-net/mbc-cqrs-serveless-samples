import { EventHandler, IEventHandler } from '@mbc-cqrs-serverless/core'
import { Logger } from '@nestjs/common'
import { sleep } from 'src/helpers'

import { TodoTaskEvent } from './todo-task.event'

@EventHandler(TodoTaskEvent)
export class TodoTaskEventHandler implements IEventHandler<TodoTaskEvent> {
  private readonly logger = new Logger(TodoTaskEventHandler.name)

  async execute(event: TodoTaskEvent): Promise<any> {
    this.logger.debug(
      `Begin processing the task: ${event.taskEvent.eventID}`,
      event.todo,
    )
    await sleep(3000) // Long running task

    this.logger.debug(`Process task completed: ${event.taskEvent.eventID}`)
    return 'Result after process'
  }
}
