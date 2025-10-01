import { ApiProperty } from '@nestjs/swagger';

export class ArticleWithoutAuthorDto {
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
}
