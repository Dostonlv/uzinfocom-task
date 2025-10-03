import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUserService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return access token', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockUser = {
        id: randomUUID(),
        email: registerDto.email,
        password: 'hashed-password',
        createdAt: new Date(),
      };
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      mockUserService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.register(registerDto);

      expect(mockUserService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      });
    });

    it('should handle user creation errors during registration', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.create.mockRejectedValue(
        new Error('User creation failed'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        'User creation failed',
      );
    });

    it('should handle JWT signing errors during registration', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockUser = {
        id: randomUUID(),
        email: registerDto.email,
        password: 'hashed-password',
        createdAt: new Date(),
      };

      mockUserService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        'JWT signing failed',
      );
    });

    it('should not expose password in registration response', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockUser = {
        id: randomUUID(),
        email: registerDto.email,
        password: 'hashed-password',
        createdAt: new Date(),
      };
      const mockToken = 'mock-jwt-token';

      mockUserService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.register(registerDto);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
      });
    });
  });

  describe('login', () => {
    it('should login user and return access token', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockUser = {
        id: randomUUID(),
        email: loginDto.email,
        createdAt: new Date(),
      };
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      expect(jest.spyOn(service, 'validateUser')).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with specific message for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should handle JWT signing errors', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockUser = {
        id: randomUUID(),
        email: loginDto.email,
        createdAt: new Date(),
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      mockJwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        'JWT signing failed',
      );
    });

    it('should handle validation service errors during login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest
        .spyOn(service, 'validateUser')
        .mockRejectedValue(new Error('Validation error'));

      await expect(service.login(loginDto)).rejects.toThrow('Validation error');
    });
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = {
        id: randomUUID(),
        email,
        password: 'hashed-password',
        createdAt: new Date(),
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null if user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const mockUser = {
        id: randomUUID(),
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrong-password',
      );

      expect(result).toBeNull();
    });

    it('should handle bcrypt comparison errors gracefully', async () => {
      const mockUser = {
        id: randomUUID(),
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error('Bcrypt error'),
      );

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow('Bcrypt error');
    });

    it('should validate user with empty password and return null', async () => {
      const mockUser = {
        id: randomUUID(),
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', '');

      expect(bcrypt.compare).toHaveBeenCalledWith('', mockUser.password);
      expect(result).toBeNull();
    });

    it('should validate user with null/undefined password and return null', async () => {
      const mockUser = {
        id: randomUUID(),
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        null as unknown as string,
      );

      expect(result).toBeNull();
    });

    it('should handle case-sensitive email validation', async () => {
      const mockUser = {
        id: randomUUID(),
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'TEST@EXAMPLE.COM',
        'password123',
      );

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        'TEST@EXAMPLE.COM',
      );
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
      });
    });

    it('should return null when user service throws error', async () => {
      mockUserService.findByEmail.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow('Database error');
    });
  });
});
