import {
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryArticleDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by author ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'Author ID must be a valid UUID' })
  authorId?: string;

  @ApiProperty({
    description: 'Filter articles published after this date (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date' })
  startDate?: string;

  @ApiProperty({
    description: 'Filter articles published before this date (ISO string)',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date' })
  endDate?: string;
}
