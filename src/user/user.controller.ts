import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user account',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: UserResponseDto,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      createdAt: '2024-01-15T10:30:00.000Z',
      articles: [],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
    example: {
      statusCode: 400,
      message: [
        'Email is not valid',
        'Password must be at least 6 characters long',
      ],
      error: 'Bad Request',
    },
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves all users with their articles',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user1@example.com',
        createdAt: '2024-01-15T10:30:00.000Z',
        articles: [
          {
            id: '456e7890-e89b-12d3-a456-426614174001',
            title: 'User Article',
            description: 'Article description',
            publishedAt: '2024-01-15T10:30:00.000Z',
            authorId: '123e4567-e89b-12d3-a456-426614174000',
            author: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'user1@example.com',
            },
          },
        ],
      },
    ],
  })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by UUID with their articles',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      createdAt: '2024-01-15T10:30:00.000Z',
      articles: [
        {
          id: '456e7890-e89b-12d3-a456-426614174001',
          title: 'User Article',
          description: 'Article description',
          publishedAt: '2024-01-15T10:30:00.000Z',
          authorId: '123e4567-e89b-12d3-a456-426614174000',
          author: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'user@example.com',
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    example: {
      statusCode: 404,
      message: 'User with id 123e4567-e89b-12d3-a456-426614174000 not found',
      error: 'Not Found',
    },
  })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Update user by ID',
    description:
      'Updates a user profile. Users can only update their own profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully updated',
    type: UserResponseDto,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'updated@example.com',
      createdAt: '2024-01-15T10:30:00.000Z',
      articles: [],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
    example: {
      statusCode: 400,
      message: ['Email is not valid'],
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
    description: 'Forbidden - can only update own profile',
    example: {
      statusCode: 403,
      message: 'You can only update your own profile',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    example: {
      statusCode: 404,
      message: 'User with id 123e4567-e89b-12d3-a456-426614174000 not found',
      error: 'Not Found',
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.userId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete current user',
    description: 'Deletes the current authenticated user account.',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully deleted',
    example: {
      message: 'User deleted successfully',
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
  remove(@Request() req: AuthenticatedRequest) {
    return this.userService.remove(req.user.userId);
  }
}
