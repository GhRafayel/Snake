import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { DatabaseService } from 'src/database/database.service';
import { RedisService } from '../redis/redis.service';
import { FriendsService } from 'src/friends/friends.service';
import { MailService } from 'src/mail/mail.service';

describe('UsersService', () => {
  let service: UsersService;
  let db: {
    users: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    userStats: { create: jest.Mock };
    translation: { findUnique: jest.Mock; upsert: jest.Mock };
    $transaction: jest.Mock;
  };
  let redisService: { deleteToken: jest.Mock };
  let friendsService: { getFriends: jest.Mock };
  let mailService: { sendContactMessage: jest.Mock };

  beforeEach(async () => {
    db = {
      users: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userStats: { create: jest.fn() },
      translation: { findUnique: jest.fn(), upsert: jest.fn() },
      $transaction: jest.fn(),
    };
    redisService = { deleteToken: jest.fn() };
    friendsService = { getFriends: jest.fn() };
    mailService = { sendContactMessage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: db },
        { provide: RedisService, useValue: redisService },
        { provide: FriendsService, useValue: friendsService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLanguage', () => {
    it('throws when no language data is provided', async () => {
      await expect(service.createLanguage({})).rejects.toThrow(BadRequestException);
      await expect(service.createLanguage(undefined as any)).rejects.toThrow('No language data provided');
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('upserts each language entry inside a transaction', async () => {
      db.translation.upsert.mockReturnValue('upsert-op');
      db.$transaction.mockResolvedValueOnce(undefined);

      const result = await service.createLanguage({ en: { hello: 'hi' }, fr: { hello: 'bonjour' } });

      expect(db.translation.upsert).toHaveBeenCalledWith({
        where: { key: 'en' },
        create: { key: 'en', values: { hello: 'hi' } },
        update: { values: { hello: 'hi' } },
      });
      expect(db.translation.upsert).toHaveBeenCalledWith({
        where: { key: 'fr' },
        create: { key: 'fr', values: { hello: 'bonjour' } },
        update: { values: { hello: 'bonjour' } },
      });
      expect(db.$transaction).toHaveBeenCalledWith(['upsert-op', 'upsert-op']);
      expect(result).toEqual({ success: true });
    });
  });

  describe('getLanguage', () => {
    it('returns the translation values for the given key when found', async () => {
      db.translation.findUnique.mockResolvedValueOnce({ key: 'fr', values: { hi: 'bonjour' } });
      const result = await service.getLanguage('fr');
      expect(db.translation.findUnique).toHaveBeenCalledWith({ where: { key: 'fr' } });
      expect(result).toEqual({ hi: 'bonjour' });
    });

    it('defaults to "en" when no key is given', async () => {
      db.translation.findUnique.mockResolvedValueOnce({ key: 'en', values: { hi: 'hello' } });
      await service.getLanguage();
      expect(db.translation.findUnique).toHaveBeenCalledWith({ where: { key: 'en' } });
    });

    it('falls back to "en" when the requested key is not found', async () => {
      db.translation.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ key: 'en', values: { hi: 'hello' } });

      const result = await service.getLanguage('de');

      expect(db.translation.findUnique).toHaveBeenNthCalledWith(1, { where: { key: 'de' } });
      expect(db.translation.findUnique).toHaveBeenNthCalledWith(2, { where: { key: 'en' } });
      expect(result).toEqual({ hi: 'hello' });
    });

    it('returns null when neither the key nor the "en" fallback exist', async () => {
      db.translation.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      const result = await service.getLanguage('de');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a user and an accompanying stats row', async () => {
      const body = { Username: 'bob', Email: 'bob@test.com', Password: 'pw', resetCode: null, codeExpire: null };
      const created = { id: 1, ...body };
      db.users.create.mockResolvedValueOnce(created);
      db.userStats.create.mockResolvedValueOnce({ id: 1, Email: body.Email });

      const result = await service.create(body as any);

      expect(db.users.create).toHaveBeenCalledWith({ data: body });
      expect(db.userStats.create).toHaveBeenCalledWith({ data: { Email: body.Email } });
      expect(result).toEqual(created);
    });
  });

  describe('findByProvider', () => {
    it('looks up a user by the provider/providerId composite key', async () => {
      db.users.findUnique.mockResolvedValueOnce({ id: 1 });
      const result = await service.findByProvider('google', 'abc123');
      expect(db.users.findUnique).toHaveBeenCalledWith({
        where: { provider_providerId: { provider: 'google', providerId: 'abc123' } },
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('createOAuthUser', () => {
    it('creates an OAuth user as a PLAYER and an accompanying stats row', async () => {
      const data = { Email: 'oauth@test.com', Username: 'oauthuser', provider: 'google', providerId: 'g1' };
      db.users.create.mockResolvedValueOnce({ id: 2, ...data, role: Role.PLAYER });
      db.userStats.create.mockResolvedValueOnce({ id: 2, Email: data.Email });

      const result = await service.createOAuthUser(data);

      expect(db.users.create).toHaveBeenCalledWith({
        data: {
          Email: data.Email,
          Username: data.Username,
          provider: data.provider,
          providerId: data.providerId,
          role: Role.PLAYER,
        },
      });
      expect(db.userStats.create).toHaveBeenCalledWith({ data: { Email: data.Email } });
      expect(result).toEqual({ id: 2, ...data, role: Role.PLAYER });
    });
  });

  describe('getOrCreateBots', () => {
    it('reuses an existing bot and creates a new one when missing', async () => {
      db.users.findFirst
        .mockResolvedValueOnce(null) // bot1 - not found
        .mockResolvedValueOnce({ id: 10, Username: 'AI 2', isBot: true }); // bot2 - found
      db.users.create.mockResolvedValueOnce({ id: 9, Username: 'AI 1', isBot: true });

      const bots = await service.getOrCreateBots(2);

      expect(db.users.findFirst).toHaveBeenNthCalledWith(1, { where: { Email: 'bot1@system.internal' } });
      expect(db.users.findFirst).toHaveBeenNthCalledWith(2, { where: { Email: 'bot2@system.internal' } });
      expect(db.users.create).toHaveBeenCalledTimes(1);
      expect(db.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          Email: 'bot1@system.internal',
          Username: 'AI 1',
          isBot: true,
          role: Role.BOT,
        }),
      });
      expect(bots).toEqual([
        { id: 9, Username: 'AI 1', isBot: true },
        { id: 10, Username: 'AI 2', isBot: true },
      ]);
    });

    it('returns an empty array when count is 0', async () => {
      const bots = await service.getOrCreateBots(0);
      expect(bots).toEqual([]);
      expect(db.users.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('finds a user by numeric id', async () => {
      db.users.findUnique.mockResolvedValueOnce({ id: 1 });
      const result = await service.findById(1);
      expect(db.users.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('search', () => {
    it('excludes the caller and their friends via notIn, then filters by name', async () => {
      friendsService.getFriends.mockResolvedValueOnce([{ id: 5 }, { id: 6 }]);
      const allUsers = [
        { id: 2, Username: 'alice' },
        { id: 3, Username: 'bob' },
      ];
      db.users.findMany.mockResolvedValueOnce(allUsers);

      const result = await service.search(1, 'alice');

      expect(friendsService.getFriends).toHaveBeenCalledWith(1);
      expect(db.users.findMany).toHaveBeenCalledWith({
        where: { id: { notIn: [1, 5, 6] } },
        select: { id: true, Username: true },
      });
      expect(result).toEqual([{ id: 2, Username: 'alice' }]);
    });

    it('is case-insensitive and excludes non-matching users from the results', async () => {
      friendsService.getFriends.mockResolvedValueOnce([]);
      const allUsers = [
        { id: 2, Username: 'alice' },
        { id: 3, Username: 'bob' },
      ];
      db.users.findMany.mockResolvedValueOnce(allUsers);

      const result = await service.search(1, 'ALICE');

      expect(result).toEqual([{ id: 2, Username: 'alice' }]);
    });

    it('returns an empty array when no username matches the given name', async () => {
      friendsService.getFriends.mockResolvedValueOnce([]);
      const allUsers = [
        { id: 2, Username: 'alice' },
        { id: 3, Username: 'bob' },
      ];
      db.users.findMany.mockResolvedValueOnce(allUsers);

      const result = await service.search(1, 'this-name-matches-nobody');

      expect(result).toEqual([]);
    });
  });

  describe('searchUsers', () => {
    it('searches by username or email (case-insensitive) and returns all matches when 10 or fewer', async () => {
      const users = [{ id: 1, Username: 'alice', Email: 'a@test.com', role: Role.PLAYER, createdAt: new Date() }];
      db.users.findMany.mockResolvedValueOnce(users);

      const result = await service.searchUsers('alice');

      expect(db.users.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { Username: { contains: 'alice', mode: 'insensitive' } },
            { Email: { contains: 'alice', mode: 'insensitive' } },
          ],
        },
        select: { id: true, Username: true, Email: true, role: true, createdAt: true },
      });
      expect(result).toEqual(users);
    });

    it('caps results at 10 when more than 10 users match', async () => {
      const users = Array.from({ length: 15 }, (_, i) => ({ id: i, Username: `user${i}` }));
      db.users.findMany.mockResolvedValueOnce(users);

      const result = await service.searchUsers('user');

      expect(result).toHaveLength(10);
      result.forEach((u) => expect(users).toContainEqual(u));
    });
  });

  describe('findOneForAdmin', () => {
    it('returns a limited admin projection of the user', async () => {
      db.users.findUnique.mockResolvedValueOnce({ id: 1, Username: 'bob', Email: 'bob@test.com', role: Role.PLAYER });
      const result = await service.findOneForAdmin(1);
      expect(db.users.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, Username: true, Email: true, role: true },
      });
      expect(result).toEqual({ id: 1, Username: 'bob', Email: 'bob@test.com', role: Role.PLAYER });
    });
  });

  describe('findAll', () => {
    it('filters by role when provided', async () => {
      db.users.findMany.mockResolvedValueOnce([{ id: 1, role: Role.ADMIN }]);
      const result = await service.findAll('ADMIN');
      expect(db.users.findMany).toHaveBeenCalledWith({ where: { role: 'ADMIN' } });
      expect(result).toEqual([{ id: 1, role: Role.ADMIN }]);
    });

    it('returns all users when no role filter is given', async () => {
      db.users.findMany.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
      const result = await service.findAll();
      expect(db.users.findMany).toHaveBeenCalledWith();
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('findOne', () => {
    it('returns the profile projection including stats history', async () => {
      const profile = {
        id: 1,
        Username: 'bob',
        role: Role.PLAYER,
        language: 'en',
        color: null,
        avatar: 'default.png',
        theme: true,
        termsAcceptedAt: null,
        history: { gamesLost: 1, gamesWon: 2, totalScore: 30 },
      };
      db.users.findUnique.mockResolvedValueOnce(profile);

      const result = await service.findOne(1);

      expect(db.users.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          Username: true,
          role: true,
          language: true,
          color: true,
          avatar: true,
          theme: true,
          termsAcceptedAt: true,
          history: { select: { gamesLost: true, gamesWon: true, totalScore: true } },
        },
      });
      expect(result).toEqual(profile);
    });

    it('returns null when the user does not exist', async () => {
      db.users.findUnique.mockResolvedValueOnce(null);
      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('changeLanguage', () => {
    it('updates the user language', async () => {
      db.users.update.mockResolvedValueOnce({ id: 1, language: 'fr' });
      const result = await service.changeLanguage(1, { language: 'fr' });
      expect(db.users.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { language: 'fr' } });
      expect(result).toEqual({ id: 1, language: 'fr' });
    });
  });

  describe('changeUsername', () => {
    it('throws when the trimmed username is empty', async () => {
      await expect(service.changeUsername(1, { Username: '   ' })).rejects.toThrow(BadRequestException);
      expect(db.users.update).not.toHaveBeenCalled();
    });

    it('throws when the username is shorter than 3 characters', async () => {
      await expect(service.changeUsername(1, { Username: 'ab' })).rejects.toThrow(
        'Username must be between 3 and 40 characters',
      );
    });

    it('throws when the username is longer than 40 characters', async () => {
      await expect(service.changeUsername(1, { Username: 'a'.repeat(41) })).rejects.toThrow(BadRequestException);
    });

    it('trims and updates a valid username', async () => {
      db.users.update.mockResolvedValueOnce({ id: 1, Username: 'bob' });
      const result = await service.changeUsername(1, { Username: '  bob  ' });
      expect(db.users.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { Username: 'bob' } });
      expect(result).toEqual({ id: 1, Username: 'bob' });
    });
  });

  describe('changeColor', () => {
    it('updates the snake color', async () => {
      db.users.update.mockResolvedValueOnce({ id: 1, color: '#fff' });
      const result = await service.changeColor(1, { color: '#fff' });
      expect(db.users.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { color: '#fff' } });
      expect(result).toEqual({ id: 1, color: '#fff' });
    });

    it('allows clearing the color with null', async () => {
      db.users.update.mockResolvedValueOnce({ id: 1, color: null });
      await service.changeColor(1, { color: null });
      expect(db.users.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { color: null } });
    });
  });

  describe('changeAvatar', () => {
    it('throws for a filename with a disallowed extension', async () => {
      await expect(service.changeAvatar(1, { avatar: 'malware.exe' })).rejects.toThrow(BadRequestException);
      expect(db.users.update).not.toHaveBeenCalled();
    });

    it('throws for a filename without an extension', async () => {
      await expect(service.changeAvatar(1, { avatar: 'noextension' })).rejects.toThrow('Invalid avatar filename');
    });

    it.each(['avatar.png', 'avatar.jpg', 'avatar.jpeg', 'avatar.gif', 'avatar.webp', 'AVATAR.PNG'])(
      'accepts a valid image filename: %s',
      async (avatar) => {
        db.users.update.mockResolvedValueOnce({ id: 1, avatar });
        const result = await service.changeAvatar(1, { avatar });
        expect(db.users.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { avatar } });
        expect(result).toEqual({ id: 1, avatar });
      },
    );
  });

  describe('contact', () => {
    it('sends a contact message using the user profile and returns their email', async () => {
      db.users.findUnique.mockResolvedValueOnce({ id: 1, Username: 'bob', Email: 'bob@test.com' });

      const result = await service.contact(1, 'hello there');

      expect(mailService.sendContactMessage).toHaveBeenCalledWith({
        message: 'hello there',
        Username: 'bob',
        Email: 'bob@test.com',
      });
      expect(result).toEqual({ email: 'bob@test.com' });
    });

    it('throws when the user cannot be found', async () => {
      db.users.findUnique.mockResolvedValueOnce(null);
      await expect(service.contact(999, 'hi')).rejects.toThrow();
      expect(mailService.sendContactMessage).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates the user with the given dto', async () => {
      db.users.update.mockResolvedValueOnce({ id: 1, Username: 'newname' });
      const result = await service.update(1, { Username: 'newname' } as any);
      expect(db.users.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { Username: 'newname' } });
      expect(result).toEqual({ id: 1, Username: 'newname' });
    });
  });

  describe('theme', () => {
    it('updates the theme flag', async () => {
      db.users.update.mockResolvedValueOnce({ id: 1, theme: false });
      const result = await service.theme(1, false);
      expect(db.users.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { theme: false } });
      expect(result).toEqual({ id: 1, theme: false });
    });
  });

  describe('acceptTerms', () => {
    it('sets termsAcceptedAt to a Date and returns the profile projection', async () => {
      db.users.update.mockResolvedValueOnce({ id: 1, termsAcceptedAt: new Date() });
      await service.acceptTerms(1);

      expect(db.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { termsAcceptedAt: expect.any(Date) },
        select: {
          id: true,
          Username: true,
          role: true,
          language: true,
          color: true,
          avatar: true,
          theme: true,
          termsAcceptedAt: true,
          history: { select: { gamesLost: true, gamesWon: true, totalScore: true } },
        },
      });
    });
  });

  describe('remove', () => {
    it('deletes the user and clears their cached auth token', async () => {
      db.users.delete.mockResolvedValueOnce({ id: 1, Username: 'bob' });

      const result = await service.remove(1);

      expect(db.users.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(redisService.deleteToken).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, Username: 'bob' });
    });
  });
});
