/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('RedisService', () => {
  let service: RedisService;
  let mockRedis: jest.Mocked<Redis>;

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
    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      quit: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(
      () => mockRedis,
    );

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
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set and get', () => {
    it('should set and get a value', async () => {
      const key = 'test:key';
      const value = { data: 'test value' };
      const serializedValue = JSON.stringify(value);

      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(serializedValue);

      await service.set(key, value);
      const result = await service.get<typeof value>(key);

      expect(jest.mocked(mockRedis.set)).toHaveBeenCalledWith(
        key,
        serializedValue,
        'EX',
        2592000,
      );
      expect(jest.mocked(mockRedis.get)).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get('non:existent:key');

      expect(jest.mocked(mockRedis.get)).toHaveBeenCalledWith(
        'non:existent:key',
      );
      expect(result).toBeNull();
    });

    it('should handle invalid JSON gracefully', async () => {
      const key = 'test:invalid:json';
      mockRedis.get.mockResolvedValue('invalid-json');

      const result = await service.get(key);

      expect(jest.mocked(mockRedis.get)).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
    });

    it('should handle Redis get error', async () => {
      const key = 'test:error';

      mockRedis.get.mockRejectedValue(new Error('Redis get error'));

      await expect(service.get(key)).rejects.toThrow('Redis get error');
      expect(jest.mocked(mockRedis.get)).toHaveBeenCalledWith(key);
    });

    it('should handle Redis set error', async () => {
      const key = 'test:error';
      const value = { data: 'test' };

      mockRedis.set.mockRejectedValue(new Error('Redis set error'));

      await expect(service.set(key, value)).rejects.toThrow('Redis set error');
      expect(jest.mocked(mockRedis.set)).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        'EX',
        2592000,
      );
    });

    it('should set with correct TTL value (30 days)', async () => {
      const key = 'test:ttl';
      const value = { test: 'data' };
      const expectedTTL = 30 * 24 * 60 * 60;

      mockRedis.set.mockResolvedValue('OK');

      await service.set(key, value);

      expect(jest.mocked(mockRedis.set)).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        'EX',
        expectedTTL,
      );
    });

    it('should handle complex objects in get/set', async () => {
      const key = 'test:complex';
      const value = {
        id: 'test-id',
        nested: {
          array: [1, 2, 3],
          boolean: true,
          null: null,
        },
        timestamp: new Date().toISOString(),
      };

      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(JSON.stringify(value));

      await service.set(key, value);
      const result = await service.get(key);

      expect(result).toEqual(value);
    });

    it('should handle empty string value', async () => {
      const key = 'test:empty';
      const value = '';

      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(JSON.stringify(value));

      await service.set(key, value);
      const result = await service.get(key);

      expect(result).toBe('');
    });

    it('should handle null value in set', async () => {
      const key = 'test:null';
      const value = null;

      mockRedis.set.mockResolvedValue('OK');

      await service.set(key, value);

      expect(jest.mocked(mockRedis.set)).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        'EX',
        2592000,
      );
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      const key = 'test:delete';

      mockRedis.del.mockResolvedValue(1);

      await service.del(key);

      expect(jest.mocked(mockRedis.del)).toHaveBeenCalledWith(key);
    });

    it('should handle Redis del error', async () => {
      const key = 'test:error';

      mockRedis.del.mockRejectedValue(new Error('Redis delete error'));

      await expect(service.del(key)).rejects.toThrow('Redis delete error');
      expect(jest.mocked(mockRedis.del)).toHaveBeenCalledWith(key);
    });

    it('should handle non-existent key deletion', async () => {
      const key = 'test:nonexistent';

      mockRedis.del.mockResolvedValue(0);

      await service.del(key);

      expect(jest.mocked(mockRedis.del)).toHaveBeenCalledWith(key);
    });
  });

  describe('delPattern', () => {
    it('should delete keys matching pattern', async () => {
      const pattern = 'pattern:test:*';
      const matchingKeys = ['pattern:test:1', 'pattern:test:2'];

      mockRedis.keys.mockResolvedValue(matchingKeys);
      mockRedis.del.mockResolvedValue(matchingKeys.length);

      await service.delPattern(pattern);

      expect(jest.mocked(mockRedis.keys)).toHaveBeenCalledWith(pattern);
      expect(jest.mocked(mockRedis.del)).toHaveBeenCalledWith(...matchingKeys);
    });

    it('should handle empty pattern results', async () => {
      const pattern = 'nonexistent:pattern:*';

      mockRedis.keys.mockResolvedValue([]);

      await service.delPattern(pattern);

      expect(jest.mocked(mockRedis.keys)).toHaveBeenCalledWith(pattern);
      expect(jest.mocked(mockRedis.del)).not.toHaveBeenCalled();
    });

    it('should handle single key deletion', async () => {
      const pattern = 'single:key:*';
      const singleKey = ['single:key:1'];

      mockRedis.keys.mockResolvedValue(singleKey);
      mockRedis.del.mockResolvedValue(1);

      await service.delPattern(pattern);

      expect(jest.mocked(mockRedis.keys)).toHaveBeenCalledWith(pattern);
      expect(jest.mocked(mockRedis.del)).toHaveBeenCalledWith(...singleKey);
    });

    it('should handle Redis keys error gracefully', async () => {
      const pattern = 'error:pattern:*';

      mockRedis.keys.mockRejectedValue(new Error('Redis keys error'));

      await expect(service.delPattern(pattern)).rejects.toThrow(
        'Redis keys error',
      );
      expect(jest.mocked(mockRedis.keys)).toHaveBeenCalledWith(pattern);
      expect(jest.mocked(mockRedis.del)).not.toHaveBeenCalled();
    });

    it('should handle Redis del error gracefully', async () => {
      const pattern = 'error:del:*';
      const matchingKeys = ['error:del:1', 'error:del:2'];

      mockRedis.keys.mockResolvedValue(matchingKeys);
      mockRedis.del.mockRejectedValue(new Error('Redis del error'));

      await expect(service.delPattern(pattern)).rejects.toThrow(
        'Redis del error',
      );
      expect(jest.mocked(mockRedis.keys)).toHaveBeenCalledWith(pattern);
      expect(jest.mocked(mockRedis.del)).toHaveBeenCalledWith(...matchingKeys);
    });
  });

  describe('onModuleDestroy', () => {
    it('should call Redis quit on module destroy', () => {
      mockRedis.quit = jest.fn();

      service.onModuleDestroy();

      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });

  describe('Redis configuration', () => {
    it('should use default values when config not provided', async () => {
      const defaultConfigService = {
        get: jest.fn(
          (key: string, defaultValue?: string | number) => defaultValue,
        ),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RedisService,
          {
            provide: ConfigService,
            useValue: defaultConfigService,
          },
        ],
      }).compile();

      const serviceWithDefaults = module.get<RedisService>(RedisService);

      expect(serviceWithDefaults).toBeDefined();
      expect(defaultConfigService.get).toHaveBeenCalledWith(
        'REDIS_HOST',
        'localhost',
      );
      expect(defaultConfigService.get).toHaveBeenCalledWith('REDIS_PORT', 6379);
    });

    it('should use custom configuration values', async () => {
      const customConfigService = {
        get: jest.fn((key: string) => {
          const config: Record<string, string | number> = {
            REDIS_HOST: 'custom-redis-host',
            REDIS_PORT: 6380,
          };
          return config[key];
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RedisService,
          {
            provide: ConfigService,
            useValue: customConfigService,
          },
        ],
      }).compile();

      const serviceWithCustomConfig = module.get<RedisService>(RedisService);

      expect(serviceWithCustomConfig).toBeDefined();
      expect(customConfigService.get).toHaveBeenCalledWith(
        'REDIS_HOST',
        'localhost',
      );
      expect(customConfigService.get).toHaveBeenCalledWith('REDIS_PORT', 6379);
    });
  });
});
