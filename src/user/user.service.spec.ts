import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const hashedPassword = 'hashed-password';
      const mockUser = {
        id: randomUUID(),
        email: createUserDto.email,
        password: hashedPassword,
        createdAt: new Date(),
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: randomUUID(),
        email,
        password: 'hashed',
        createdAt: new Date(),
      } as User;

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const mockUsers = [
        {
          id: randomUUID(),
          email: 'user1@example.com',
          password: 'hashed1',
          createdAt: new Date(),
          articles: [
            {
              id: randomUUID(),
              title: 'Article 1',
              description: 'Description',
              publishedAt: new Date(),
              authorId: randomUUID(),
              author: { id: randomUUID(), email: 'user1@example.com' },
            },
          ],
        },
      ] as User[];

      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['articles'],
      });
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0].articles?.[0]).not.toHaveProperty('author');
    });

    it('should handle users without articles', async () => {
      const mockUsers = [
        {
          id: randomUUID(),
          email: 'user1@example.com',
          password: 'hashed1',
          createdAt: new Date(),
          articles: null,
        },
        {
          id: randomUUID(),
          email: 'user2@example.com',
          password: 'hashed2',
          createdAt: new Date(),
          articles: [],
        },
      ] as User[];

      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result[0].articles).toBeUndefined();
      expect(result[1].articles).toEqual([]);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('should return user without password', async () => {
      const userId = randomUUID();
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        articles: [],
      } as User;

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['articles'],
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(randomUUID())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle user with null articles in findOne', async () => {
      const userId = randomUUID();
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        articles: undefined,
      } as unknown as User;

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(result.articles).toBeUndefined();
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('update', () => {
    it('should update user and hash new password', async () => {
      const userId = randomUUID();
      const originalPassword = 'newpassword';
      const updateDto = { password: originalPassword };
      const hashedPassword = 'new-hashed';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password: 'old-hashed',
        createdAt: new Date(),
        articles: [],
      } as User;

      mockRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.update(userId, updateDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(originalPassword, 10);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
    });

    it('should update user without changing password', async () => {
      const userId = randomUUID();
      const updateDto = { email: 'newemail@example.com' };
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        articles: [],
      } as User;

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      await service.update(userId, updateDto);

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(randomUUID(), {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      const userId = randomUUID();
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(userId);

      expect(mockRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(randomUUID())).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
