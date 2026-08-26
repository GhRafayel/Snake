jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@prisma/adapter-pg', () => ({
  // Shape matches what PrismaClient's internal driver-adapter compatibility
  // check expects (provider/adapterName), without doing any real I/O.
  PrismaPg: jest.fn().mockImplementation(() => ({
    provider: 'postgres',
    adapterName: '@prisma/adapter-pg',
  })),
}));

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { DatabaseService } from './database.service';

// DatabaseService is a very thin wrapper around the generated PrismaClient:
// the constructor just wires up a pg Pool + PrismaPg adapter, and
// onModuleInit/onModuleDestroy do nothing but call the inherited
// $connect()/$disconnect(). There is no custom business logic to exercise
// beyond "the adapter is constructed correctly" and "the lifecycle hooks
// delegate to the Prisma client" — so this spec is intentionally a smoke
// test and never touches a real database.
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
    // eslint-disable-next-line no-new
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
