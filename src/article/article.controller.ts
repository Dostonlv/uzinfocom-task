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
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createArticleDto: CreateArticleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.articleService.create(createArticleDto, req.user.userId);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  list(@Query() queryDto: QueryArticleDto) {
    return this.articleService.list(queryDto);
  }

  @Get(':id')
  read(@Param('id') id: string) {
    return this.articleService.read(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.articleService.update(id, updateArticleDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.articleService.delete(id, req.user.userId);
  }
}
