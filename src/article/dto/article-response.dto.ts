import { ApiProperty } from '@nestjs/swagger';

export class AuthorDto {
  @ApiProperty({
    description: 'Author ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Author email',
    example: 'author@example.com',
  })
  email: string;
}

export class ArticleResponseDto {
  @ApiProperty({
    description: 'Article ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Article title',
    example: 'My First Article',
  })
  title: string;

  @ApiProperty({
    description: 'Article description/content',
    example: 'This is a detailed description of the article content.',
  })
  description: string;

  @ApiProperty({
    description: 'Publication date',
    example: '2024-01-15T10:30:00.000Z',
  })
  publishedAt: Date;

  @ApiProperty({
    description: 'Author ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  authorId: string;

  @ApiProperty({
    description: 'Author information',
    type: AuthorDto,
  })
  author: AuthorDto;
}

export class ArticleListResponseDto {
  @ApiProperty({
    description: 'Array of articles',
    type: [ArticleResponseDto],
  })
  articles: ArticleResponseDto[];

  @ApiProperty({
    description: 'Total number of articles',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;
}
