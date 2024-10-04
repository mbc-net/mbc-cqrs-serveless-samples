import { DataEntity } from '@mbc-cqrs-severless/core'

import { TaskAttributes } from '../dto/task-attributes.dto'

export class TaskDataEntity extends DataEntity {
  attributes: TaskAttributes

  constructor(partial: Partial<TaskDataEntity>) {
    super(partial)
    Object.assign(this, partial)
  }
}
