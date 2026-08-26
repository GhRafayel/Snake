jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({
    provider: 'postgres',
    adapterName: '@prisma/adapter-pg',
  })),
}));

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('should be defined and instantiate without throwing', () => {
    const service = new DatabaseService();
    expect(service).toBeDefined();
  });

  it('constructs a pg Pool using DATABASE_URL and wraps it in a PrismaPg adapter', () => {
    new DatabaseService();

    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgresql://user:pass@localhost:5432/testdb',
    });
    expect(PrismaPg).toHaveBeenCalledTimes(1);
  });

  describe('onModuleInit', () => {
    it('delegates to the inherited $connect', async () => {
      const service = new DatabaseService();
      const connectSpy = jest
        .spyOn(service, '$connect')
        .mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('delegates to the inherited $disconnect', async () => {
      const service = new DatabaseService();
      const disconnectSpy = jest
        .spyOn(service, '$disconnect')
        .mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });
  });
});
