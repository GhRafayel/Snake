import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { TokenService } from './token.service';

describe('TokenService', () => {
    let service: TokenService;
    let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
    let config: { getOrThrow: jest.Mock };

    beforeEach(async () => {
        jwt = {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
        };
        config = {
            getOrThrow: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TokenService,
                { provide: JwtService, useValue: jwt },
                { provide: ConfigService, useValue: config },
            ],
        }).compile();

        service = module.get<TokenService>(TokenService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateAccessToken', () => {
        it('signs a token with the access secret and 15m expiry', async () => {
            config.getOrThrow.mockReturnValue('access-secret');
            jwt.signAsync.mockResolvedValue('signed.access.token');

            const result = await service.generateAccessToken(42, 'session-1');

            expect(config.getOrThrow).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
            expect(jwt.signAsync).toHaveBeenCalledWith(
                { userId: 42, sessionId: 'session-1' },
                { secret: 'access-secret', expiresIn: '15m' },
            );
            expect(result).toBe('signed.access.token');
        });
    });

    describe('verifyAccessToken', () => {
        it('returns the payload when verification succeeds', async () => {
            config.getOrThrow.mockReturnValue('access-secret');
            const payload = { userId: 1, sessionId: 's', iat: 1, exp: 2 };
            jwt.verifyAsync.mockResolvedValue(payload);

            const result = await service.verifyAccessToken('token');

            expect(jwt.verifyAsync).toHaveBeenCalledWith('token', { secret: 'access-secret' });
            expect(result).toEqual(payload);
        });

        it('returns an Error instead of throwing when verification fails', async () => {
            config.getOrThrow.mockReturnValue('access-secret');
            jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

            const result = await service.verifyAccessToken('bad-token');

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Invalid access token');
        });
    });

    describe('verifyRefreshToken', () => {
        it('returns the payload when verification succeeds', async () => {
            config.getOrThrow.mockReturnValue('refresh-secret');
            const payload = { userId: 1, sessionId: 's', iat: 1, exp: 2 };
            jwt.verifyAsync.mockResolvedValue(payload);

            const result = await service.verifyRefreshToken('token');

            expect(jwt.verifyAsync).toHaveBeenCalledWith('token', { secret: 'refresh-secret' });
            expect(result).toEqual(payload);
        });

        it('returns an Error instead of throwing when verification fails', async () => {
            config.getOrThrow.mockReturnValue('refresh-secret');
            jwt.verifyAsync.mockRejectedValue(new Error('invalid signature'));

            const result = await service.verifyRefreshToken('bad-token');

            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Invalid refresh token');
        });
    });

    describe('generateRefreshToken', () => {
        it('returns a base64url string', () => {
            const token = service.generateRefreshToken();

            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
            expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
        });

        it('returns a different value on each call', () => {
            const first = service.generateRefreshToken();
            const second = service.generateRefreshToken();

            expect(first).not.toBe(second);
        });
    });

    describe('hashRefreshToken', () => {
        it('returns the sha256 hex digest of the token', () => {
            const token = 'my-refresh-token';
            const expected = createHash('sha256').update(token).digest('hex');

            expect(service.hashRefreshToken(token)).toBe(expected);
        });

        it('is deterministic for the same input', () => {
            const token = 'same-token';

            expect(service.hashRefreshToken(token)).toBe(service.hashRefreshToken(token));
        });

        it('produces different hashes for different inputs', () => {
            expect(service.hashRefreshToken('token-a')).not.toBe(service.hashRefreshToken('token-b'));
        });
    });
});
