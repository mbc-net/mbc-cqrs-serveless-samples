import { DataEntity } from '@mbc-cqrs-serverless/core'

import { TaskAttributes } from '../dto/task-attributes.dto'

export class TaskDataEntity extends DataEntity {
  attributes: TaskAttributes

  constructor(partial: Partial<TaskDataEntity>) {
    super(partial)
    Object.assign(this, partial)
  }
}
