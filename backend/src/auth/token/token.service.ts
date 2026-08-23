import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { PayloadType } from 'src/types/Auth.interface';

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

    async verifyAccessToken(token: string): Promise<PayloadType | Error> {
        try {
            const payload = await this.jwt.verifyAsync<PayloadType>(token, {
                secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
            });
            return payload;
        } catch {
            return new Error('Invalid access token');
        }
    }

    async verifyRefreshToken(token: string): Promise<PayloadType | Error> {
        try {
            const payload = await this.jwt.verifyAsync<PayloadType>(token, {
                secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            });
            return payload;
        } catch {
            return new Error('Invalid refresh token');
        }
    }


    generateRefreshToken(): string {
        return randomBytes(64).toString('base64url')
    }

    hashRefreshToken(token: string): string {
        return createHash('sha256').update(token).digest('hex')
    }
}