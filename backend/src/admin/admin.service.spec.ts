import { Test } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { UsersService } from 'src/users/users.service';
import { DatabaseService } from 'src/database/database.service';
import { LanguageSeed } from './seed/seed-translations';

jest.mock('src/logger/logger.service');
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

import * as bcrypt from 'bcrypt';

describe('AdminService', () => {
  let service: AdminService;
  let usersService: jest.Mocked<Pick<UsersService, 'searchUsers' | 'findAll' | 'findOneForAdmin' | 'findById' | 'update' | 'remove'>>;
  let databaseService: {
    translation: { count: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      searchUsers: jest.fn(),
      findAll: jest.fn(),
      findOneForAdmin: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    databaseService = {
      translation: {
        count: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: UsersService, useValue: usersService },
        { provide: DatabaseService, useValue: databaseService },
      ],
    }).compile();

    service = moduleRef.get(AdminService);
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('does nothing when translations already exist', async () => {
      databaseService.translation.count.mockResolvedValue(3);

      await service.onModuleInit();

      expect(databaseService.translation.create).not.toHaveBeenCalled();
      expect(databaseService.$transaction).not.toHaveBeenCalled();
    });

    it('seeds every language when there are no translations yet', async () => {
      databaseService.translation.count.mockResolvedValue(0);
      databaseService.translation.create.mockImplementation((args: unknown) => args);

      await service.onModuleInit();

      const expectedKeys = Object.keys(LanguageSeed);
      expect(databaseService.translation.create).toHaveBeenCalledTimes(expectedKeys.length);
      for (const key of expectedKeys) {
        expect(databaseService.translation.create).toHaveBeenCalledWith({
          data: { key, values: LanguageSeed[key] },
        });
      }
      expect(databaseService.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchUsers', () => {
    it('delegates directly to usersService.searchUsers for an empty query', async () => {
      usersService.searchUsers.mockResolvedValue([{ id: 1, Username: 'a' }] as never);

      const result = await service.searchUsers('');

      expect(usersService.searchUsers).toHaveBeenCalledWith('');
      expect(usersService.findAll).not.toHaveBeenCalled();
      expect(result).toEqual([{ id: 1, Username: 'a' }]);
    });

    it('filters all users case-insensitively by username for a non-empty query', async () => {
      usersService.findAll.mockResolvedValue([
        { id: 1, Username: 'Alice' },
        { id: 2, Username: 'Bob' },
        { id: 3, Username: 'alicia' },
      ] as never);

      const result = await service.searchUsers('ali');

      expect(usersService.findAll).toHaveBeenCalled();
      expect(usersService.searchUsers).not.toHaveBeenCalled();
      expect(result).toEqual([
        { id: 1, Username: 'Alice' },
        { id: 3, Username: 'alicia' },
      ]);
    });
  });

  describe('findOne', () => {
    it('delegates to usersService.findOneForAdmin', () => {
      usersService.findOneForAdmin.mockResolvedValue({ id: 7 } as never);

      const result = service.findOne(7);

      expect(usersService.findOneForAdmin).toHaveBeenCalledWith(7);
      expect(result).resolves.toEqual({ id: 7 });
    });
  });

  describe('update', () => {
    it('throws when the user does not exist', async () => {
      usersService.findById.mockResolvedValue(null as never);

      await expect(service.update(1, {} as never)).rejects.toThrow();
      expect(usersService.update).not.toHaveBeenCalled();
    });

    it('throws when trying to update an ADMIN user', async () => {
      usersService.findById.mockResolvedValue({ id: 1, role: 'ADMIN' } as never);

      await expect(service.update(1, {} as never)).rejects.toThrow();
      expect(usersService.update).not.toHaveBeenCalled();
    });

    it('hashes the password before updating when a password is provided', async () => {
      usersService.findById.mockResolvedValue({ id: 1, role: 'PLAYER' } as never);
      usersService.update.mockResolvedValue({ id: 1 } as never);
      const dto = { Password: 'plaintext' } as never;

      await service.update(1, dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 10);
      expect(usersService.update).toHaveBeenCalledWith(1, { Password: 'hashed-password' });
    });

    it('updates without touching the password when none is provided', async () => {
      usersService.findById.mockResolvedValue({ id: 1, role: 'PLAYER' } as never);
      usersService.update.mockResolvedValue({ id: 1 } as never);
      const dto = { Username: 'newname' } as never;

      await service.update(1, dto);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(usersService.update).toHaveBeenCalledWith(1, { Username: 'newname' });
    });
  });

  describe('remove', () => {
    it('delegates to usersService.remove', () => {
      usersService.remove.mockResolvedValue({ id: 5 } as never);

      const result = service.remove(5);

      expect(usersService.remove).toHaveBeenCalledWith(5);
      expect(result).resolves.toEqual({ id: 5 });
    });
  });
});
