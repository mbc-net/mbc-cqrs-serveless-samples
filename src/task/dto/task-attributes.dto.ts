import { ApiProperty } from '@nestjs/swagger'
import { TaskStatus } from '@prisma/client'
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator'

export class TaskAttributes {
  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status?: TaskStatus

  @IsOptional()
  @IsDateString()
  dueDate?: string
}
