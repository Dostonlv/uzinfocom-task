import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configBuilder = new DocumentBuilder()
    .setTitle('Article Management API')
    .setDescription('API for managing articles with authentication')
    .setVersion('1.0')
    .addBearerAuth();

  const config = configBuilder.build();
  const document = SwaggerModule.createDocument(app, config);
  if (process.env.NODE_ENV === 'production') {
    app.use(
      ['/docs', '/docs-json'],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      basicAuth({
        challenge: true,
        users: {
          [process.env.SWAGGER_USERNAME || 'admin']:
            process.env.SWAGGER_PASSWORD || 'dh38dh32hd89233whkjsw\\sq',
        },
      }),
    );
  }

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
