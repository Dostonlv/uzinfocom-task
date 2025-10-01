import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account and returns JWT token',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
    example: {
      access_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAAXhhbXBsZS5jb20iLCJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJpYXQiOjE3MDQwNzM4MDAsImV4cCI6MTcwNDE2MDIwMH0.example_signature',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
    example: {
      statusCode: 400,
      message: [
        'Email must be a valid email address',
        'Password must be at least 6 characters long',
      ],
      error: 'Bad Request',
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticates user and returns JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
    example: {
      access_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAAXhhbXBsZS5jb20iLCJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJpYXQiOjE3MDQwNzM4MDAsImV4cCI6MTcwNDE2MDIwMH0.example_signature',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    example: {
      statusCode: 401,
      message: 'Invalid credentials',
      error: 'Unauthorized',
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
