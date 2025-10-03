import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthenticatedRequest } from 'src/auth/interfaces/authenticated-request.interface';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: randomUUID(),
          email: 'user1@example.com',
          createdAt: new Date(),
          articles: [],
        },
        {
          id: randomUUID(),
          email: 'user2@example.com',
          createdAt: new Date(),
          articles: [],
        },
      ];

      mockUserService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(mockUserService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
      expect(
        result.every(
          (user) => !Object.prototype.hasOwnProperty.call(user, 'password'),
        ),
      ).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = randomUUID();
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        createdAt: new Date(),
        articles: [
          {
            id: randomUUID(),
            title: 'Test Article',
            description: 'Test Description',
            publishedAt: new Date(),
          },
        ],
      };

      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(userId);

      expect(mockUserService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('updateEmail', () => {
    it('should update a user email', async () => {
      const updateDto = {
        email: 'updated@example.com',
      };
      const userId = randomUUID();
      const mockUpdatedUser = {
        id: userId,
        email: updateDto.email,
        createdAt: new Date(),
        articles: [],
      };
      const req = { user: { userId, email: 'test@example.com' } };

      mockUserService.update.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateEmail(
        updateDto,
        req as AuthenticatedRequest,
      );

      expect(mockUserService.update).toHaveBeenCalledWith(userId, updateDto);
      expect(result).toEqual(mockUpdatedUser);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const updateDto = {
        password: 'newpassword123',
      };
      const userId = randomUUID();
      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        createdAt: new Date(),
        articles: [],
      };
      const req = { user: { userId, email: 'test@example.com' } };

      mockUserService.update.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updatePassword(
        updateDto,
        req as AuthenticatedRequest,
      );

      expect(mockUserService.update).toHaveBeenCalledWith(userId, updateDto);
      expect(result).toEqual(mockUpdatedUser);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = randomUUID();
      const req = { user: { userId, email: 'test@example.com' } };

      mockUserService.remove.mockResolvedValue(undefined);

      await controller.remove(req as AuthenticatedRequest);

      expect(mockUserService.remove).toHaveBeenCalledWith(userId);
    });
  });
});
