import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  description: string;

  @IsOptional()
  @IsDateString({}, { message: 'Published date must be a valid date' })
  publishedAt?: string;

  @IsUUID(4, { message: 'Author ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Author ID is required' })
  authorId: string;
}
