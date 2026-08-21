import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { RedisService } from 'src/redis/redis.service';
import { TokenService } from '../token/token.service';

@Injectable()
export class SessionService {

    public constructor(
        private readonly prisma: DatabaseService,
        private readonly tokenService: TokenService,
        private readonly redisService: RedisService,
    ) { }

    async createSession(userId: number, refreshToken: string) {
        const refreshTokenHash = await this.tokenService.hashRefreshToken(refreshToken);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const session = await this.prisma.sessions.create({
            data: {
                userId,
                refreshTokenHash: refreshTokenHash,
                expiresAt: expiresAt,
            },
            select: {
                id: true,
                expiresAt: true,
            },
        });
        return session;
    }

    async findSessionByHash(tokenHash: string) {
        const session = await this.prisma.sessions.findFirst({
            where: {
                refreshTokenHash: tokenHash,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
        return session;
    }

    async rotateSession(sessionId: string, refreshToken: string) {
        const refreshTokenHash = await this.tokenService.hashRefreshToken(refreshToken);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        return this.prisma.sessions.update({
            where: { id: sessionId },
            data: {
                refreshTokenHash: refreshTokenHash,
                expiresAt,
            }
        });
    }

    async deleteSession(sessionId: string) {
        const result = await this.prisma.sessions.deleteMany({
            where: { id: sessionId },
        });
        await this.redisService.addSessionToBlackList(sessionId);
        return result;
    }

    async deleteAllUserSessions(userId: number) {
        const sessions = await this.prisma.sessions.findMany({
            where: { userId },
            select: { id: true },
        });
        const deletedCount = await this.prisma.sessions.deleteMany({
            where: {userId, },
        });

        for (const session of sessions) {
            await this.redisService.addSessionToBlackList(session.id);
        }
        return deletedCount;
    }
}
