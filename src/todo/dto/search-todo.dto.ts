import { SearchDto } from '@mbc-cqrs-serverless/core'
import { TodoStatus } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsBoolean, IsDateString, IsEnum, IsOptional } from 'class-validator'

export class TodoSearchDto extends SearchDto {
  @IsOptional()
  @IsEnum(TodoStatus)
  status?: TodoStatus

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
