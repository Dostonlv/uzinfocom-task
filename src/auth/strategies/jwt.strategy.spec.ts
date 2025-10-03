import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UserService } from '../../user/user.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockUserService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user data when user exists', async () => {
      const userId = randomUUID();
      const userEmail = 'test@example.com';
      const payload = { sub: userId, email: userEmail };
      const mockUser = {
        id: userId,
        email: userEmail,
        password: 'hashed-password',
        createdAt: new Date(),
      };

      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(mockUserService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const userId = randomUUID();
      const payload = { sub: userId, email: 'test@example.com' };

      mockUserService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found',
      );
    });

    it('should handle user service errors', async () => {
      const userId = randomUUID();
      const payload = { sub: userId, email: 'test@example.com' };

      mockUserService.findOne.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(payload)).rejects.toThrow(
        'Database error',
      );
    });

    it('should validate with different user IDs', async () => {
      const userId1 = randomUUID();
      const userId2 = randomUUID();
      const mockUser1 = {
        id: userId1,
        email: 'user1@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
      };
      const mockUser2 = {
        id: userId2,
        email: 'user2@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
      };

      mockUserService.findOne
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser2);

      const result1 = await strategy.validate({
        sub: userId1,
        email: mockUser1.email,
      });
      const result2 = await strategy.validate({
        sub: userId2,
        email: mockUser2.email,
      });

      expect(result1).toEqual({
        userId: mockUser1.id,
        email: mockUser1.email,
      });
      expect(result2).toEqual({
        userId: mockUser2.id,
        email: mockUser2.email,
      });
    });

    it('should handle payload with missing sub field', async () => {
      const payload = { email: 'test@example.com' } as {
        sub: string;
        email: string;
      };

      mockUserService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle payload with invalid sub field', async () => {
      const payload = { sub: 'invalid-uuid', email: 'test@example.com' };

      mockUserService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
