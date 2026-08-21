import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class TokenService {
    public constructor(
        private readonly jwt: JwtService,
        private readonly config: ConfigService
    ) { }

    async generateAccessToken(userId: number, sessionId: string): Promise<string> {
        const accessToken = await this.jwt.signAsync(
            {
                userId: userId,
                sessionId: sessionId,
            },
            {
                secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
                expiresIn: '15m',
            },
        );
        return accessToken
    }

    async verifyAccessToken(token: string) {
        try {
            const payload = await this.jwt.verifyAsync(token, {
                secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
            });
            return payload;
        } catch (error) {
            throw new Error('Invalid access token');
        }
    }

    async verifyRefreshToken(token: string) {
        try {
            const payload = await this.jwt.verifyAsync(token, {
                secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            });
            return payload;
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }


    async generateRefreshToken(): Promise<string> {
        return randomBytes(64).toString('base64url')
    }

    async hashRefreshToken(token: string): Promise<string> {
        return createHash('sha256').update(token).digest('hex')
    }
}