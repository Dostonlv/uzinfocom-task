import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV === 'production') {
    app.use(
      ['/docs', '/docs-json'],
      basicAuth({
        users: {
          [process.env.SWAGGER_USER || 'admin']:
            process.env.SWAGGER_PASS || 'dh38dh32hd89233whkjsw\\sq',
        },
        challenge: true,
      }),
    );
  }

  const configBuilder = new DocumentBuilder()
    .setTitle('Article Management API')
    .setDescription('API for managing articles with authentication')
    .setVersion('1.0')
    .addBearerAuth();

  const config = configBuilder.build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
