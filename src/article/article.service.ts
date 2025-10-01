import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { Article } from './entities/article.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  async create(
    createArticleDto: CreateArticleDto,
    userId: string,
  ): Promise<Article> {
    const article = this.articleRepository.create({
      ...createArticleDto,
      authorId: userId,
      publishedAt: createArticleDto.publishedAt
        ? new Date(createArticleDto.publishedAt)
        : new Date(),
    });

    return this.articleRepository.save(article);
  }

  async list(queryDto: QueryArticleDto): Promise<{
    articles: Article[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, authorId, startDate, endDate } = queryDto;
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new BadRequestException('Invalid date format for startDate');
      }
    }
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date format for endDate');
      }
    }
    const skip = (page - 1) * limit;

    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .skip(skip)
      .take(limit)
      .orderBy('article.publishedAt', 'DESC');

    if (authorId) {
      queryBuilder.andWhere('article.authorId = :authorId', { authorId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'article.publishedAt BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      );
    } else if (startDate) {
      queryBuilder.andWhere('article.publishedAt >= :startDate', {
        startDate: new Date(startDate),
      });
    } else if (endDate) {
      queryBuilder.andWhere('article.publishedAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    const [articles, total] = await queryBuilder.getManyAndCount();

    return {
      articles,
      total,
      page,
      limit,
    };
  }

  async read(id: string): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
    userId: string,
  ): Promise<Article> {
    const article = await this.read(id);

    if (article.authorId !== userId) {
      throw new ForbiddenException('You can only update your own articles');
    }

    const updateData: Partial<Article> = {};

    if (updateArticleDto.title) {
      updateData.title = updateArticleDto.title;
    }
    if (updateArticleDto.description) {
      updateData.description = updateArticleDto.description;
    }
    if (updateArticleDto.publishedAt) {
      updateData.publishedAt = new Date(updateArticleDto.publishedAt);
    }

    await this.articleRepository.update(id, updateData);
    return this.read(id);
  }

  async delete(id: string, userId: string): Promise<void> {
    const article = await this.read(id);

    if (article.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own articles');
    }

    await this.articleRepository.remove(article);
  }
}
