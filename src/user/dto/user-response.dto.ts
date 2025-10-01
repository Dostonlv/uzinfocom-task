import { ApiProperty } from '@nestjs/swagger';
import { ArticleResponseDto } from '../../article/dto/article-response.dto';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User creation date',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User articles',
    type: [ArticleResponseDto],
    required: false,
  })
  articles?: ArticleResponseDto[];
}
