import { Type } from 'class-transformer'
import { IsOptional, IsString, ValidateNested } from 'class-validator'

import { TaskAttributes } from './task-attributes.dto'

export class CreateTaskDto {
  @IsString()
  name: string

  @Type(() => TaskAttributes)
  @ValidateNested()
  @IsOptional()
  attributes?: TaskAttributes

  constructor(partial: Partial<CreateTaskDto>) {
    Object.assign(this, partial)
  }
}
