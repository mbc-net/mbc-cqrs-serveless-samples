import { ApiPropertyOptional } from '@nestjs/swagger'
import { TodoStatus } from '@prisma/client'
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class SearchTodoDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search by name (partial match)' })
  name?: string

  @IsOptional()
  @IsEnum(TodoStatus)
  @ApiPropertyOptional({ enum: TodoStatus, description: 'Filter by status' })
  status?: TodoStatus

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  limit?: number = 10

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Sort field',
    default: 'createdAt',
    enum: ['name', 'status', 'createdAt', 'updatedAt'],
  })
  sortBy?: string = 'createdAt'

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @ApiPropertyOptional({
    description: 'Sort order',
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  sortOrder?: 'ASC' | 'DESC' = 'DESC'
}

export class SearchTodoResultDto<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data
    this.total = total
    this.page = page
    this.limit = limit
    this.totalPages = Math.ceil(total / limit)
  }
}
