import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import {
  ArticleResponseDto,
  ArticleListResponseDto,
} from './dto/article-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

/*
  i am not following to the article body and added author field because
  i want to get author details from user api and get request for every article
  and fronted get author data from user api always and by defauld author data has for each article
*/

@ApiTags('Articles')
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}
  // jwt auth
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  // Swagger example
  @ApiOperation({
    summary: 'Create a new article',
    description: 'Creates a new article. Requires authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Article successfully created',
    type: ArticleResponseDto,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'My First Article',
      description: 'This is a detailed description of the article content.',
      publishedAt: '2024-01-15T10:30:00.000Z',
      authorId: '123e4567-e89b-12d3-a456-426614174000',
      author: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'author@example.com',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
    example: {
      statusCode: 400,
      message: [
        'Title must be at least 3 characters long',
        'Description must be at least 10 characters long',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  create(
    @Body() createArticleDto: CreateArticleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.articleService.create(createArticleDto, req.user.userId);
  }

  // get list articles
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Get all articles with pagination and filtering',
    description:
      'Retrieves articles with optional pagination and filtering by author, date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Articles retrieved successfully',
    type: ArticleListResponseDto,
    example: {
      articles: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'My First Article',
          description: 'This is a detailed description of the article content.',
          publishedAt: '2024-01-15T10:30:00.000Z',
          authorId: '123e4567-e89b-12d3-a456-426614174000',
          author: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'author@example.com',
          },
        },
      ],
      total: 25,
      page: 1,
      limit: 10,
    },
  })
  list(@Query() queryDto: QueryArticleDto) {
    return this.articleService.list(queryDto);
  }

  // get article by id
  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'Article ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Get article by ID',
    description: 'Retrieves a specific article by its UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Article retrieved successfully',
    type: ArticleResponseDto,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'My First Article',
      description: 'This is a detailed description of the article content.',
      publishedAt: '2024-01-15T10:30:00.000Z',
      authorId: '123e4567-e89b-12d3-a456-426614174000',
      author: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'author@example.com',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
    example: {
      statusCode: 404,
      message: 'Article not found',
      error: 'Not Found',
    },
  })
  read(@Param('id') id: string) {
    return this.articleService.read(id);
  }

  // update article
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Article ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Update article by ID',
    description:
      'Updates an article. Only the author can update their own articles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Article successfully updated',
    type: ArticleResponseDto,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Updated Article Title',
      description: 'Updated article description content.',
      publishedAt: '2024-01-15T10:30:00.000Z',
      authorId: '123e4567-e89b-12d3-a456-426614174000',
      author: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'author@example.com',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
    example: {
      statusCode: 400,
      message: ['Title must be at least 3 characters long'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own articles',
    example: {
      statusCode: 403,
      message: 'You can only update your own articles',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
    example: {
      statusCode: 404,
      message: 'Article not found',
      error: 'Not Found',
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.articleService.update(id, updateArticleDto, req.user.userId);
  }

  // delete article
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Article ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Delete article by ID',
    description:
      'Deletes an article. Only the author can delete their own articles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Article successfully deleted',
    example: {
      message: 'Article deleted successfully',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own articles',
    example: {
      statusCode: 403,
      message: 'You can only delete your own articles',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
    example: {
      statusCode: 404,
      message: 'Article not found',
      error: 'Not Found',
    },
  })
  delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.articleService.delete(id, req.user.userId);
  }
}
