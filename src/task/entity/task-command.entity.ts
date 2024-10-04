import { CommandEntity } from '@mbc-cqrs-severless/core'

import { TaskAttributes } from '../dto/task-attributes.dto'

export class TaskCommandEntity extends CommandEntity {
  attributes: TaskAttributes

  constructor(partial: Partial<TaskCommandEntity>) {
    super()
    Object.assign(this, partial)
  }
}
