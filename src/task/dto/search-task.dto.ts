import { SearchDto } from '@mbc-cqrs-severless/core'
import { TaskStatus } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsBoolean, IsDateString, IsEnum, IsOptional } from 'class-validator'

export class TaskSearchDto extends SearchDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus

  @IsDateString()
  @IsOptional()
  dueDate_gte?: string

  @IsDateString()
  @IsOptional()
  dueDate_lte?: string

  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsOptional()
  isDeleted?: boolean
}
