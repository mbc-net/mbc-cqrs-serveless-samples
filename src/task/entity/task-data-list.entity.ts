import { DataListEntity } from '@mbc-cqrs-severless/core'

import { TaskDataEntity } from './task-data.entity'

export class TaskDataListEntity extends DataListEntity {
  items: TaskDataEntity[]

  constructor(partial: Partial<TaskDataListEntity>) {
    super(partial)
    Object.assign(this, partial)
  }
}
