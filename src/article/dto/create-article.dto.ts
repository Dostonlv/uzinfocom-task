import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Article title',
    example: 'My First Article',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title: string;

  @ApiProperty({
    description: 'Article description/content',
    example: 'This is a detailed description of the article content.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  description: string;

  @ApiProperty({
    description: 'Publication date (ISO string)',
    example: '2024-01-15T10:30:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Published date must be a valid date' })
  publishedAt?: string;
}
