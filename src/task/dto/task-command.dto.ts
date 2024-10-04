import { CommandDto } from '@mbc-cqrs-severless/core'
import { Type } from 'class-transformer'
import { IsOptional, ValidateNested } from 'class-validator'

import { TaskAttributes } from './task-attributes.dto'

export class TaskCommandDto extends CommandDto {
  @Type(() => TaskAttributes)
  @ValidateNested()
  @IsOptional()
  attributes?: TaskAttributes

  constructor(partial: Partial<TaskCommandDto>) {
    super()
    Object.assign(this, partial)
  }
}
