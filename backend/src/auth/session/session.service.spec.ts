import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { DatabaseService } from 'src/database/database.service';
import { TokenService } from '../token/token.service';
import { RedisService } from 'src/redis/redis.service';

describe('SessionService', () => {
    let service: SessionService;
    let prisma: {
        sessions: {
            create: jest.Mock;
            findFirst: jest.Mock;
            update: jest.Mock;
            deleteMany: jest.Mock;
            findMany: jest.Mock;
        };
    };
    let tokenService: { hashRefreshToken: jest.Mock };
    let redisService: { addSessionToBlackList: jest.Mock };

    const FIXED_NOW = new Date('2026-01-01T00:00:00.000Z');

    beforeEach(async () => {
        jest.useFakeTimers();
        jest.setSystemTime(FIXED_NOW);

        prisma = {
            sessions: {
                create: jest.fn(),
                findFirst: jest.fn(),
                update: jest.fn(),
                deleteMany: jest.fn(),
                findMany: jest.fn(),
            },
        };
        tokenService = { hashRefreshToken: jest.fn() };
        redisService = { addSessionToBlackList: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionService,
                { provide: DatabaseService, useValue: prisma },
                { provide: TokenService, useValue: tokenService },
                { provide: RedisService, useValue: redisService },
            ],
        }).compile();

        service = module.get<SessionService>(SessionService);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('createSession', () => {
        it('hashes the refresh token and creates a session with a 30 day expiry', async () => {
            tokenService.hashRefreshToken.mockReturnValue('hashed-token');
            const created = { id: 'session-1', expiresAt: new Date() };
            prisma.sessions.create.mockResolvedValue(created);

            const expectedExpiresAt = new Date(FIXED_NOW.getTime() + 30 * 24 * 60 * 60 * 1000);

            const result = await service.createSession(7, 'raw-refresh-token');

            expect(tokenService.hashRefreshToken).toHaveBeenCalledWith('raw-refresh-token');
            expect(prisma.sessions.create).toHaveBeenCalledWith({
                data: {
                    userId: 7,
                    refreshTokenHash: 'hashed-token',
                    expiresAt: expectedExpiresAt,
                },
                select: {
                    id: true,
                    expiresAt: true,
                },
            });
            expect(result).toBe(created);
        });
    });

    describe('findSessionByHash', () => {
        it('looks up a non-expired session by refresh token hash', async () => {
            const session = { id: 'session-1', userId: 7 };
            prisma.sessions.findFirst.mockResolvedValue(session);

            const result = await service.findSessionByHash('hashed-token');

            expect(prisma.sessions.findFirst).toHaveBeenCalledWith({
                where: {
                    refreshTokenHash: 'hashed-token',
                    expiresAt: { gt: FIXED_NOW },
                },
            });
            expect(result).toBe(session);
        });

        it('returns null when no matching session is found', async () => {
            prisma.sessions.findFirst.mockResolvedValue(null);

            const result = await service.findSessionByHash('missing-hash');

            expect(result).toBeNull();
        });
    });

    describe('rotateSession', () => {
        it('hashes the new refresh token and updates the session expiry', async () => {
            tokenService.hashRefreshToken.mockReturnValue('new-hashed-token');
            const updated = { id: 'session-1' };
            prisma.sessions.update.mockResolvedValue(updated);

            const expectedExpiresAt = new Date(FIXED_NOW.getTime() + 30 * 24 * 60 * 60 * 1000);

            const result = await service.rotateSession('session-1', 'new-refresh-token');

            expect(tokenService.hashRefreshToken).toHaveBeenCalledWith('new-refresh-token');
            expect(prisma.sessions.update).toHaveBeenCalledWith({
                where: { id: 'session-1' },
                data: {
                    refreshTokenHash: 'new-hashed-token',
                    expiresAt: expectedExpiresAt,
                },
            });
            expect(result).toBe(updated);
        });
    });

    describe('deleteSession', () => {
        it('deletes the session and blacklists it in redis', async () => {
            const deleteResult = { count: 1 };
            prisma.sessions.deleteMany.mockResolvedValue(deleteResult);

            const result = await service.deleteSession('session-1');

            expect(prisma.sessions.deleteMany).toHaveBeenCalledWith({ where: { id: 'session-1' } });
            expect(redisService.addSessionToBlackList).toHaveBeenCalledWith('session-1');
            expect(result).toBe(deleteResult);
        });
    });

    describe('deleteAllUserSessions', () => {
        it('deletes all sessions for a user and blacklists each of them', async () => {
            const sessions = [{ id: 'session-1' }, { id: 'session-2' }];
            const deleteResult = { count: 2 };
            prisma.sessions.findMany.mockResolvedValue(sessions);
            prisma.sessions.deleteMany.mockResolvedValue(deleteResult);

            const result = await service.deleteAllUserSessions(7);

            expect(prisma.sessions.findMany).toHaveBeenCalledWith({
                where: { userId: 7 },
                select: { id: true },
            });
            expect(prisma.sessions.deleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
            expect(redisService.addSessionToBlackList).toHaveBeenCalledTimes(2);
            expect(redisService.addSessionToBlackList).toHaveBeenNthCalledWith(1, 'session-1');
            expect(redisService.addSessionToBlackList).toHaveBeenNthCalledWith(2, 'session-2');
            expect(result).toBe(deleteResult);
        });

        it('does not blacklist anything when the user has no sessions', async () => {
            prisma.sessions.findMany.mockResolvedValue([]);
            prisma.sessions.deleteMany.mockResolvedValue({ count: 0 });

            const result = await service.deleteAllUserSessions(7);

            expect(redisService.addSessionToBlackList).not.toHaveBeenCalled();
            expect(result).toEqual({ count: 0 });
        });
    });
});
