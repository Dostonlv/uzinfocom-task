import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string | number) => {
      const config: Record<string, string | number> = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set and get', () => {
    it('should set and get a value', async () => {
      const key = 'test:key';
      const value = { data: 'test value' };

      await service.set(key, value);
      const result = await service.get<typeof value>(key);

      expect(result).toEqual(value);

      await service.del(key);
    });

    it('should return null for non-existent key', async () => {
      const result = await service.get('non:existent:key');
      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      const key = 'test:delete';
      const value = { data: 'to delete' };

      await service.set(key, value);
      await service.del(key);
      const result = await service.get(key);

      expect(result).toBeNull();
    });
  });

  describe('delPattern', () => {
    it('should delete keys matching pattern', async () => {
      await service.set('pattern:test:1', { id: 1 });
      await service.set('pattern:test:2', { id: 2 });
      await service.set('other:key', { id: 3 });

      await service.delPattern('pattern:test:*');

      const result1 = await service.get('pattern:test:1');
      const result2 = await service.get('pattern:test:2');
      const result3 = await service.get('other:key');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toEqual({ id: 3 });

      await service.del('other:key');
    });

    it('should handle empty pattern results', async () => {
      await expect(
        service.delPattern('nonexistent:pattern:*'),
      ).resolves.not.toThrow();
    });
  });
});
