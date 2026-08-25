import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { OnlineUsersDataType } from 'src/types/Redis.interface';

const mockClient = {
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  setEx: jest.fn(),
  exists: jest.fn(),
  keys: jest.fn(),
  mGet: jest.fn(),
};

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockClient),
}));

describe('RedisService', () => {
  let service: RedisService;
  let consoleLogSpy: jest.SpyInstance;

  const sampleUser: OnlineUsersDataType = {
    id: 1,
    Username: 'Rafayel',
    role: 'user',
    history: {
      gamesWon: 1,
      gamesLost: 2,
      totalScore: 3,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
    await service.onModuleInit();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('creates a redis client, registers an error handler and connects', () => {
      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith('Redis Connected');
    });

    it('logs redis client errors', () => {
      const errorHandler = mockClient.on.mock.calls.find(
        (call) => call[0] === 'error',
      )?.[1] as (err: unknown) => void;

      const err = new Error('connection lost');
      errorHandler(err);

      expect(consoleLogSpy).toHaveBeenCalledWith('Redis Error:', err);
    });
  });

  describe('get/set/del', () => {
    it('set delegates to the underlying client', async () => {
      await service.set('foo', 'bar');
      expect(mockClient.set).toHaveBeenCalledWith('foo', 'bar');
    });

    it('get delegates to the underlying client and returns its value', async () => {
      mockClient.get.mockResolvedValueOnce('bar');
      const result = await service.get('foo');
      expect(mockClient.get).toHaveBeenCalledWith('foo');
      expect(result).toBe('bar');
    });

    it('get returns null when the key does not exist', async () => {
      mockClient.get.mockResolvedValueOnce(null);
      const result = await service.get('missing');
      expect(result).toBeNull();
    });

    it('del delegates to the underlying client', async () => {
      await service.del('foo');
      expect(mockClient.del).toHaveBeenCalledWith('foo');
    });
  });

  describe('setEx / exists', () => {
    it('setEx sets a key with a ttl', async () => {
      await service.setEx('foo', 60, 'bar');
      expect(mockClient.setEx).toHaveBeenCalledWith('foo', 60, 'bar');
    });

    it('exists returns the underlying client result', async () => {
      mockClient.exists.mockResolvedValueOnce(1);
      const result = await service.exists('foo');
      expect(mockClient.exists).toHaveBeenCalledWith('foo');
      expect(result).toBe(1);
    });
  });

  describe('token helpers', () => {
    it('saveToken stores the token under the correct key', async () => {
      await service.saveToken(42, 'abc-token');
      expect(mockClient.set).toHaveBeenCalledWith('token:42', 'abc-token');
    });

    it('getToken retrieves the token under the correct key', async () => {
      mockClient.get.mockResolvedValueOnce('abc-token');
      const result = await service.getToken(42);
      expect(mockClient.get).toHaveBeenCalledWith('token:42');
      expect(result).toBe('abc-token');
    });

    it('deleteToken deletes the token under the correct key', async () => {
      await service.deleteToken(42);
      expect(mockClient.del).toHaveBeenCalledWith('token:42');
    });
  });

  describe('session blacklist helpers', () => {
    it('addSessionToBlackList sets a flag for the session', async () => {
      await service.addSessionToBlackList('session-1');
      expect(mockClient.set).toHaveBeenCalledWith(
        'session:blacklist:session-1',
        'true',
      );
    });

    it('isSessionBlacklisted returns true when the key exists', async () => {
      mockClient.exists.mockResolvedValueOnce(1);
      const result = await service.isSessionBlacklisted('session-1');
      expect(mockClient.exists).toHaveBeenCalledWith(
        'session:blacklist:session-1',
      );
      expect(result).toBe(true);
    });

    it('isSessionBlacklisted returns false when the key does not exist', async () => {
      mockClient.exists.mockResolvedValueOnce(0);
      const result = await service.isSessionBlacklisted('session-1');
      expect(result).toBe(false);
    });

    it('deleteSessionFromBlackList removes the blacklist key', async () => {
      await service.deleteSessionFromBlackList('session-1');
      expect(mockClient.del).toHaveBeenCalledWith(
        'session:blacklist:session-1',
      );
    });
  });

  describe('isOnline', () => {
    it('returns true when the user online key exists', async () => {
      mockClient.exists.mockResolvedValueOnce(1);
      const result = await service.isOnline(7);
      expect(mockClient.exists).toHaveBeenCalledWith('user:online:7');
      expect(result).toBe(true);
    });

    it('returns false when the user online key does not exist', async () => {
      mockClient.exists.mockResolvedValueOnce(0);
      const result = await service.isOnline(7);
      expect(result).toBe(false);
    });
  });

  describe('addOnlineUser', () => {
    it('stores the user data and returns true when there was no previous socket', async () => {
      mockClient.get.mockResolvedValueOnce(null);

      const result = await service.addOnlineUser(sampleUser);

      expect(mockClient.get).toHaveBeenCalledWith('user:online:1');
      expect(mockClient.set).toHaveBeenCalledWith(
        'user:online:1',
        JSON.stringify(sampleUser),
      );
      expect(result).toBe(true);
    });

    it('returns false when a previous socket already existed', async () => {
      mockClient.get.mockResolvedValueOnce(JSON.stringify(sampleUser));

      const result = await service.addOnlineUser(sampleUser);

      expect(result).toBe(false);
    });
  });

  describe('removeOnlineUser', () => {
    it('deletes the online user key', async () => {
      await service.removeOnlineUser(1);
      expect(mockClient.del).toHaveBeenCalledWith('user:online:1');
    });
  });

  describe('refreshOnlineUser', () => {
    it('updates the stored data when the user already exists', async () => {
      mockClient.get.mockResolvedValueOnce(JSON.stringify(sampleUser));

      await service.refreshOnlineUser(sampleUser);

      expect(mockClient.set).toHaveBeenCalledWith(
        'user:online:1',
        JSON.stringify(sampleUser),
      );
    });

    it('does nothing when the user does not exist', async () => {
      mockClient.get.mockResolvedValueOnce(null);

      await service.refreshOnlineUser(sampleUser);

      expect(mockClient.set).not.toHaveBeenCalled();
    });
  });

  describe('getOnlineUsers', () => {
    it('returns an empty array when there are no online users', async () => {
      mockClient.keys.mockResolvedValueOnce([]);

      const result = await service.getOnlineUsers();

      expect(result).toEqual([]);
      expect(mockClient.mGet).not.toHaveBeenCalled();
    });

    it('parses and returns the online users, filtering out null values', async () => {
      mockClient.keys.mockResolvedValueOnce(['user:online:1', 'user:online:2']);
      mockClient.mGet.mockResolvedValueOnce([JSON.stringify(sampleUser), null]);

      const result = await service.getOnlineUsers();

      expect(mockClient.keys).toHaveBeenCalledWith('user:online:*');
      expect(mockClient.mGet).toHaveBeenCalledWith([
        'user:online:1',
        'user:online:2',
      ]);
      expect(result).toEqual([sampleUser]);
    });
  });

  describe('updatePlayerPosition', () => {
    it('stores the position for the given game and user', async () => {
      await service.updatePlayerPosition('game-1', 5, { x: 3, y: 4 });

      expect(mockClient.set).toHaveBeenCalledWith(
        'game:game-1:player:5:pos',
        JSON.stringify({ x: 3, y: 4 }),
      );
    });
  });
});
