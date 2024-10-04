import { PartialType } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

import { TaskAttributes } from './task-attributes.dto'

export class UpdateTaskAttributes extends PartialType(TaskAttributes) {}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsOptional()
  isDeleted?: boolean

  @Type(() => UpdateTaskAttributes)
  @ValidateNested()
  @IsOptional()
  attributes?: UpdateTaskAttributes

  constructor(partial: Partial<UpdateTaskDto>) {
    Object.assign(this, partial)
  }
}
