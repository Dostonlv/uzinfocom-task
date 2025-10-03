/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;
  let httpServer: App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/ (GET)', () => {
    it('should return main page', async () => {
      const response = await request(httpServer).get('/');
      expect(response.status).toBe(200);
      expect(typeof response.text).toBe('string');
    });
  });

  describe('Auth endpoints', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('/auth/register (POST)', async () => {
      const response = await request(httpServer)
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('/auth/register (POST) - should fail with invalid email', async () => {
      await request(httpServer)
        .post('/auth/register')
        .send({ email: 'invalid-email', password: 'password123' })
        .expect(400);
    });

    it('/auth/register (POST) - should fail with weak password', async () => {
      await request(httpServer)
        .post('/auth/register')
        .send({ email: 'test2@example.com', password: '123' })
        .expect(400);
    });

    it('/auth/login (POST)', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send(testUser)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('/auth/login (POST) - should fail with wrong credentials', async () => {
      await request(httpServer)
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('/auth/login (POST) - should fail with non-existent user', async () => {
      await request(httpServer)
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);
    });
  });

  describe('Articles endpoints', () => {
    let authToken: string;
    let articleId: string;

    beforeAll(async () => {
      const registerResponse = await request(httpServer)
        .post('/auth/register')
        .send({
          email: 'article-test@example.com',
          password: 'password123',
        });
      authToken = registerResponse.body.access_token;
    });

    it('/articles (POST) - should create article', async () => {
      const articleData = {
        title: 'Test Article',
        description: 'This is a test article for E2E testing',
        publishedAt: '2025-10-02T10:00:00Z',
      };

      const response = await request(httpServer)
        .post('/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(articleData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(articleData.title);
      expect(response.body.description).toBe(articleData.description);
      articleId = response.body.id;
    });

    it('/articles (POST) - should fail without auth', async () => {
      await request(httpServer)
        .post('/articles')
        .send({
          title: 'Test Article',
          description: 'Test description',
          publishedAt: '2025-10-02T10:00:00Z',
        })
        .expect(401);
    });

    it('/articles (GET) - should list articles', async () => {
      const response = await request(httpServer).get('/articles').expect(200);

      expect(response.body).toHaveProperty('articles');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.articles)).toBe(true);
    });

    it('/articles (GET) - should support pagination', async () => {
      const response = await request(httpServer)
        .get('/articles?page=1&limit=5')
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
    });

    it('/articles/:id (GET) - should get article by id', async () => {
      const response = await request(httpServer)
        .get(`/articles/${articleId}`)
        .expect(200);

      expect(response.body.id).toBe(articleId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('author');
      expect(response.body.author).not.toHaveProperty('password');
    });

    it('/articles/:id (PUT) - should update article', async () => {
      const updateData = {
        title: 'Updated Test Article',
        description: 'Updated description',
      };

      const response = await request(httpServer)
        .put(`/articles/${articleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
    });

    it('/articles/:id (PUT) - should fail without auth', async () => {
      await request(httpServer)
        .put(`/articles/${articleId}`)
        .send({ title: 'Should fail' })
        .expect(401);
    });

    it('/articles/:id (DELETE) - should delete article', async () => {
      await request(httpServer)
        .delete(`/articles/${articleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      await request(httpServer).get(`/articles/${articleId}`).expect(404);
    });

    it('/articles/:id (DELETE) - should fail without auth', async () => {
      await request(httpServer).delete(`/articles/${articleId}`).expect(401);
    });
  });
});
