import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { Article } from './entities/article.entity';
import { RedisService } from '../common/cache/redis.service';

describe('ArticleService', () => {
  let service: ArticleService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delPattern: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: getRepositoryToken(Article),
          useValue: mockRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);

    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an article and invalidate list cache', async () => {
      const createDto = {
        title: 'Test Article',
        description: 'Test Description',
        publishedAt: '2025-10-01T00:00:00Z',
      };
      const userId = randomUUID();
      const mockArticle = {
        id: randomUUID(),
        ...createDto,
        authorId: userId,
        publishedAt: new Date(createDto.publishedAt),
      };

      mockRepository.create.mockReturnValue(mockArticle);
      mockRepository.save.mockResolvedValue(mockArticle);
      mockRedisService.delPattern.mockResolvedValue(undefined);

      const result = await service.create(createDto, userId);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        authorId: userId,
        publishedAt: new Date(createDto.publishedAt),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockArticle);
      expect(mockRedisService.delPattern).toHaveBeenCalledWith(
        'article:list:*',
      );
      expect(result).toEqual(mockArticle);
    });
  });

  describe('read', () => {
    it('should return cached article if exists', async () => {
      const articleId = randomUUID();
      const cachedArticle = {
        id: articleId,
        title: 'Cached Article',
      } as Article;

      mockRedisService.get.mockResolvedValue(cachedArticle);

      const result = await service.read(articleId);

      expect(mockRedisService.get).toHaveBeenCalledWith(`article:${articleId}`);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(cachedArticle);
    });

    it('should fetch from database and cache if not cached', async () => {
      const articleId = randomUUID();
      const dbArticle = {
        id: articleId,
        title: 'Test Article',
        description: 'Test Description',
        publishedAt: new Date(),
        authorId: randomUUID(),
        author: {
          id: randomUUID(),
          email: 'test@example.com',
          password: 'hashed',
          createdAt: new Date(),
          articles: [],
        },
      } as Article;

      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(dbArticle);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.read(articleId);

      expect(mockRedisService.get).toHaveBeenCalledWith(`article:${articleId}`);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: articleId },
        relations: ['author'],
      });
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(result.author).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if article not found', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.read(randomUUID())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update article and invalidate cache', async () => {
      const articleId = randomUUID();
      const userId = randomUUID();
      const updateDto = { title: 'Updated Title' };
      const existingArticle = {
        id: articleId,
        authorId: userId,
        title: 'Old Title',
      } as Article;
      const updatedArticle = {
        ...existingArticle,
        ...updateDto,
        author: {
          id: userId,
          email: 'test@example.com',
          password: 'hashed',
          createdAt: new Date(),
          articles: [],
        },
      } as Article;

      mockRepository.findOne.mockResolvedValueOnce(existingArticle);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRedisService.del.mockResolvedValue(undefined);
      mockRedisService.delPattern.mockResolvedValue(undefined);
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValueOnce(updatedArticle);
      mockRedisService.set.mockResolvedValue(undefined);

      await service.update(articleId, updateDto, userId);

      expect(mockRepository.update).toHaveBeenCalledWith(articleId, updateDto);
      expect(mockRedisService.del).toHaveBeenCalledWith(`article:${articleId}`);
      expect(mockRedisService.delPattern).toHaveBeenCalledWith(
        'article:list:*',
      );
    });

    it('should throw NotFoundException if article not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(randomUUID(), {}, randomUUID()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const article = {
        id: randomUUID(),
        authorId: randomUUID(),
      } as Article;

      mockRepository.findOne.mockResolvedValue(article);

      await expect(
        service.update(randomUUID(), {}, randomUUID()),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete article and invalidate cache', async () => {
      const articleId = randomUUID();
      const userId = randomUUID();
      const article = {
        id: articleId,
        authorId: userId,
      } as Article;

      mockRepository.findOne.mockResolvedValue(article);
      mockRepository.remove.mockResolvedValue(article);
      mockRedisService.del.mockResolvedValue(undefined);
      mockRedisService.delPattern.mockResolvedValue(undefined);

      await service.delete(articleId, userId);

      expect(mockRepository.remove).toHaveBeenCalledWith(article);
      expect(mockRedisService.del).toHaveBeenCalledWith(`article:${articleId}`);
      expect(mockRedisService.delPattern).toHaveBeenCalledWith(
        'article:list:*',
      );
    });

    it('should throw NotFoundException if article not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(randomUUID(), randomUUID())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const article = {
        id: randomUUID(),
        authorId: randomUUID(),
      } as Article;

      mockRepository.findOne.mockResolvedValue(article);

      await expect(service.delete(randomUUID(), randomUUID())).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('list', () => {
    it('should return cached list if exists', async () => {
      const queryDto = { page: 1, limit: 10 };
      const cachedResult = {
        articles: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockRedisService.get.mockResolvedValue(cachedResult);

      const result = await service.list(queryDto);

      expect(result).toEqual(cachedResult);
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid date format', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(service.list({ startDate: 'invalid-date' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should filter by authorId', async () => {
      const queryDto = { authorId: randomUUID() };
      const mockArticles = [
        {
          id: randomUUID(),
          title: 'Test Article',
          authorId: queryDto.authorId,
          author: { id: queryDto.authorId, email: 'test@test.com' },
        },
      ];

      mockRedisService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockArticles, 1]);

      await service.list(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'article.authorId = :authorId',
        { authorId: queryDto.authorId },
      );
    });

    it('should filter by date range', async () => {
      const queryDto = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      mockRedisService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.list(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'article.publishedAt BETWEEN :startDate AND :endDate',
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        },
      );
    });

    it('should filter by startDate only', async () => {
      const queryDto = { startDate: '2024-01-01' };

      mockRedisService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.list(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'article.publishedAt >= :startDate',
        { startDate: new Date('2024-01-01') },
      );
    });

    it('should filter by endDate only', async () => {
      const queryDto = { endDate: '2024-12-31' };

      mockRedisService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.list(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'article.publishedAt <= :endDate',
        { endDate: new Date('2024-12-31') },
      );
    });

    it('should apply pagination with custom page and limit', async () => {
      const queryDto = { page: 2, limit: 5 };

      mockRedisService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.list(queryDto);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('should use default pagination values', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.list({});

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should remove password from author data', async () => {
      const mockArticle = {
        id: randomUUID(),
        title: 'Test Article',
        author: {
          id: randomUUID(),
          email: 'test@test.com',
          password: 'should-be-removed',
          createdAt: new Date(),
          articles: [],
        },
      };

      mockRedisService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockArticle], 1]);

      const result = await service.list({});

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.articles[0].author).not.toHaveProperty('password');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((result.articles[0].author as { email: string }).email).toBe(
        'test@test.com',
      );
    });

    it('should cache the result after database query', async () => {
      const queryDto = { page: 1, limit: 10 };
      const expectedCacheKey = `article:list:${JSON.stringify(queryDto)}`;

      mockRedisService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.list(queryDto);

      expect(mockRedisService.set).toHaveBeenCalledWith(expectedCacheKey, {
        articles: [],
        total: 0,
        page: 1,
        limit: 10,
      });
    });

    it('should throw BadRequestException for invalid endDate format', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(service.list({ endDate: 'invalid-date' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate list cache when creating article', async () => {
      const createDto = {
        title: 'Test Article',
        description: 'Test Description',
        publishedAt: '2024-01-01T00:00:00Z',
      };
      const userId = randomUUID();

      mockRepository.create.mockReturnValue(createDto);
      mockRepository.save.mockResolvedValue({ ...createDto, id: randomUUID() });

      await service.create(createDto, userId);

      expect(mockRedisService.delPattern).toHaveBeenCalledWith(
        'article:list:*',
      );
    });

    it('should invalidate both individual and list cache when updating article', async () => {
      const articleId = randomUUID();
      const userId = randomUUID();
      const updateDto = { title: 'Updated Title' };

      const mockArticle = {
        id: articleId,
        authorId: userId,
        title: 'Original Title',
      };

      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.update.mockResolvedValue(undefined);

      jest.spyOn(service, 'read').mockResolvedValue(mockArticle as Article);

      await service.update(articleId, updateDto, userId);

      expect(mockRedisService.del).toHaveBeenCalledWith(`article:${articleId}`);
      expect(mockRedisService.delPattern).toHaveBeenCalledWith(
        'article:list:*',
      );
    });

    it('should invalidate both individual and list cache when deleting article', async () => {
      const articleId = randomUUID();
      const userId = randomUUID();

      const mockArticle = {
        id: articleId,
        authorId: userId,
        title: 'Test Article',
      };

      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.remove.mockResolvedValue(undefined);

      await service.delete(articleId, userId);

      expect(mockRedisService.del).toHaveBeenCalledWith(`article:${articleId}`);
      expect(mockRedisService.delPattern).toHaveBeenCalledWith(
        'article:list:*',
      );
    });
  });

  describe('read with caching', () => {
    it('should return cached article if exists', async () => {
      const articleId = randomUUID();
      const cachedArticle = {
        id: articleId,
        title: 'Cached Article',
        author: { id: randomUUID(), email: 'test@test.com' },
      };

      mockRedisService.get.mockResolvedValue(cachedArticle);

      const result = await service.read(articleId);

      expect(result).toEqual(cachedArticle);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it('should cache article after database fetch', async () => {
      const articleId = randomUUID();
      const mockArticle = {
        id: articleId,
        title: 'Test Article',
        author: {
          id: randomUUID(),
          email: 'test@test.com',
          password: 'should-be-removed',
          createdAt: new Date(),
          articles: [],
        },
      };

      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockArticle);

      await service.read(articleId);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        `article:${articleId}`,

        expect.objectContaining({
          id: articleId,
          title: 'Test Article',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          author: expect.not.objectContaining({
            password: expect.anything(),
          } as Record<string, unknown>),
        }) as unknown,
      );
    });

    it('should handle article without author', async () => {
      const articleId = randomUUID();
      const mockArticle = {
        id: articleId,
        title: 'Test Article',
        description: 'Test Description',
        publishedAt: new Date(),
        authorId: randomUUID(),
        author: null,
      };

      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockArticle);

      const result = await service.read(articleId);

      expect(result).toEqual(mockArticle as unknown as Article);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `article:${articleId}`,
        mockArticle,
      );
    });
  });
});
