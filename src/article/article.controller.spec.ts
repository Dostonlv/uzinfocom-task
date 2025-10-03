import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';

describe('ArticleController', () => {
  let controller: ArticleController;

  const mockArticleService = {
    create: jest.fn(),
    list: jest.fn(),
    read: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        {
          provide: ArticleService,
          useValue: mockArticleService,
        },
      ],
    }).compile();

    controller = module.get<ArticleController>(ArticleController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an article', async () => {
      const createDto: CreateArticleDto = {
        title: 'Test Article',
        description: 'Test Description',
        publishedAt: '2025-10-02T10:00:00Z',
      };
      const userId = randomUUID();
      const mockArticle = {
        id: randomUUID(),
        ...createDto,
        authorId: userId,
        publishedAt: createDto.publishedAt
          ? new Date(createDto.publishedAt)
          : new Date(),
      };
      const req = { user: { userId, email: 'test@example.com' } };

      mockArticleService.create.mockResolvedValue(mockArticle);

      const result = await controller.create(createDto, req as any);

      expect(mockArticleService.create).toHaveBeenCalledWith(createDto, userId);
      expect(result).toEqual(mockArticle);
    });
  });

  describe('list', () => {
    it('should return paginated articles', async () => {
      const queryDto: QueryArticleDto = { page: 1, limit: 10 };
      const mockResponse = {
        articles: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockArticleService.list.mockResolvedValue(mockResponse);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await controller.list(queryDto as any);

      expect(mockArticleService.list).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('read', () => {
    it('should return an article by id', async () => {
      const articleId = randomUUID();
      const mockArticle = {
        id: articleId,
        title: 'Test Article',
        description: 'Test Description',
        publishedAt: new Date(),
        authorId: randomUUID(),
        author: {
          id: randomUUID(),
          email: 'test@example.com',
        },
      };

      mockArticleService.read.mockResolvedValue(mockArticle);

      const result = await controller.read(articleId);

      expect(mockArticleService.read).toHaveBeenCalledWith(articleId);
      expect(result).toEqual(mockArticle);
    });
  });

  describe('update', () => {
    it('should update an article', async () => {
      const articleId = randomUUID();
      const updateDto: UpdateArticleDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };
      const userId = randomUUID();
      const mockArticle = {
        id: articleId,
        ...updateDto,
        authorId: userId,
        publishedAt: new Date(),
      };
      const req = { user: { userId, email: 'test@example.com' } };

      mockArticleService.update.mockResolvedValue(mockArticle);

      const result = await controller.update(articleId, updateDto, req as any);

      expect(mockArticleService.update).toHaveBeenCalledWith(
        articleId,
        updateDto,
        userId,
      );
      expect(result).toEqual(mockArticle);
    });
  });

  describe('delete', () => {
    it('should delete an article', async () => {
      const articleId = randomUUID();
      const userId = randomUUID();
      const req = { user: { userId, email: 'test@example.com' } };

      mockArticleService.delete.mockResolvedValue(undefined);

      await controller.delete(articleId, req as any);

      expect(mockArticleService.delete).toHaveBeenCalledWith(articleId, userId);
    });
  });
});
