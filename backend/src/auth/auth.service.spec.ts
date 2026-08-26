import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { DatabaseService } from 'src/database/database.service';
import { UsersService } from 'src/users/users.service';
import { TokenService } from './token/token.service';
import { SessionService } from './session/session.service';
import { MailService } from 'src/mail/mail.service';

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

describe('AuthService', () => {
    let service: AuthService;
    let dbService: { users: { findUnique: jest.Mock; update: jest.Mock } };
    let usersService: {
        create: jest.Mock;
        findOne: jest.Mock;
        findByProvider: jest.Mock;
        createOAuthUser: jest.Mock;
        update: jest.Mock;
        findById: jest.Mock;
        remove: jest.Mock;
    };
    let tokenService: {
        verifyAccessToken: jest.Mock;
        hashRefreshToken: jest.Mock;
        generateRefreshToken: jest.Mock;
        generateAccessToken: jest.Mock;
    };
    let sessionService: {
        createSession: jest.Mock;
        findSessionByHash: jest.Mock;
        rotateSession: jest.Mock;
        deleteSession: jest.Mock;
        deleteAllUserSessions: jest.Mock;
    };
    let mailService: { sendResetCode: jest.Mock };

    beforeEach(async () => {
        dbService = {
            users: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
        };
        usersService = {
            create: jest.fn(),
            findOne: jest.fn(),
            findByProvider: jest.fn(),
            createOAuthUser: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            remove: jest.fn(),
        };
        tokenService = {
            verifyAccessToken: jest.fn(),
            hashRefreshToken: jest.fn(),
            generateRefreshToken: jest.fn(),
            generateAccessToken: jest.fn(),
        };
        sessionService = {
            createSession: jest.fn(),
            findSessionByHash: jest.fn(),
            rotateSession: jest.fn(),
            deleteSession: jest.fn(),
            deleteAllUserSessions: jest.fn(),
        };
        mailService = { sendResetCode: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: DatabaseService, useValue: dbService },
                { provide: UsersService, useValue: usersService },
                { provide: TokenService, useValue: tokenService },
                { provide: SessionService, useValue: sessionService },
                { provide: MailService, useValue: mailService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('me', () => {
        it('returns the verification error when the access token is invalid', async () => {
            const error = new Error('Invalid access token');
            tokenService.verifyAccessToken.mockResolvedValue(error);

            const result = await service.me('bad-token');

            expect(result).toBe(error);
            expect(usersService.findOne).not.toHaveBeenCalled();
        });

        it('returns the user data when found', async () => {
            const payload = { userId: 1, sessionId: 's', iat: 1, exp: 2 };
            const userData = { id: 1, Username: 'bob' };
            tokenService.verifyAccessToken.mockResolvedValue(payload);
            usersService.findOne.mockResolvedValue(userData);

            const result = await service.me('good-token');

            expect(usersService.findOne).toHaveBeenCalledWith(1);
            expect(result).toBe(userData);
        });

        it('falls back to the payload when no user data is found', async () => {
            const payload = { userId: 1, sessionId: 's', iat: 1, exp: 2 };
            tokenService.verifyAccessToken.mockResolvedValue(payload);
            usersService.findOne.mockResolvedValue(null);

            const result = await service.me('good-token');

            expect(result).toBe(payload);
        });

        it('throws UnauthorizedException when looking up the user fails', async () => {
            const payload = { userId: 1, sessionId: 's', iat: 1, exp: 2 };
            tokenService.verifyAccessToken.mockResolvedValue(payload);
            usersService.findOne.mockRejectedValue(new Error('db down'));

            await expect(service.me('good-token')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('signUp', () => {
        const dto = {
            Username: 'bob',
            Email: 'bob@example.com',
            Password: 'plaintext',
            resetCode: null,
            codeExpire: null,
        };

        it('hashes the password, creates the user and returns fresh tokens', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            usersService.create.mockResolvedValue({ id: 10 });
            tokenService.generateRefreshToken.mockReturnValue('refresh-token');
            sessionService.createSession.mockResolvedValue({ id: 'session-1' });
            tokenService.generateAccessToken.mockResolvedValue('access-token');

            const result = await service.signUp(dto);

            expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 10);
            expect(usersService.create).toHaveBeenCalledWith({
                Username: 'bob',
                Email: 'bob@example.com',
                Password: 'hashed-password',
                resetCode: null,
                codeExpire: null,
                role: Role.PLAYER,
            });
            expect(sessionService.createSession).toHaveBeenCalledWith(10, 'refresh-token');
            expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
        });

        it('throws ConflictException when the user already exists', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            usersService.create.mockResolvedValue(null);

            await expect(service.signUp(dto)).rejects.toThrow(ConflictException);
        });
    });

    describe('signIn', () => {
        const dto = { Email: 'bob@example.com', Password: 'plaintext' };

        it('throws UnauthorizedException when the user does not exist', async () => {
            dbService.users.findUnique.mockResolvedValue(null);

            await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when the user has no password (oauth-only account)', async () => {
            dbService.users.findUnique.mockResolvedValue({ id: 1, Password: null });

            await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when the password does not match', async () => {
            dbService.users.findUnique.mockResolvedValue({ id: 1, Password: 'hashed' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
        });

        it('returns fresh tokens on success', async () => {
            dbService.users.findUnique.mockResolvedValue({ id: 1, Password: 'hashed' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            tokenService.generateRefreshToken.mockReturnValue('refresh-token');
            sessionService.createSession.mockResolvedValue({ id: 'session-1' });
            tokenService.generateAccessToken.mockResolvedValue('access-token');

            const result = await service.signIn(dto);

            expect(dbService.users.findUnique).toHaveBeenCalledWith({ where: { Email: dto.Email } });
            expect(bcrypt.compare).toHaveBeenCalledWith('plaintext', 'hashed');
            expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
        });
    });

    describe('oauthLogin', () => {
        const profile = {
            provider: 'google',
            providerId: 'google-123',
            email: 'bob@example.com',
            username: 'bob',
        };

        beforeEach(() => {
            tokenService.generateRefreshToken.mockReturnValue('refresh-token');
            sessionService.createSession.mockResolvedValue({ id: 'session-1' });
            tokenService.generateAccessToken.mockResolvedValue('access-token');
        });

        it('reuses the user already linked to the provider', async () => {
            usersService.findByProvider.mockResolvedValue({ id: 5 });

            const result = await service.oauthLogin(profile);

            expect(usersService.findByProvider).toHaveBeenCalledWith('google', 'google-123');
            expect(dbService.users.findUnique).not.toHaveBeenCalled();
            expect(sessionService.createSession).toHaveBeenCalledWith(5, 'refresh-token');
            expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
        });

        it('links the provider to an existing user found by email', async () => {
            usersService.findByProvider.mockResolvedValue(null);
            dbService.users.findUnique.mockResolvedValue({ id: 6, Email: profile.email });
            dbService.users.update.mockResolvedValue({ id: 6 });

            await service.oauthLogin(profile);

            expect(dbService.users.findUnique).toHaveBeenCalledWith({ where: { Email: profile.email } });
            expect(dbService.users.update).toHaveBeenCalledWith({
                where: { id: 6 },
                data: { provider: 'google', providerId: 'google-123' },
            });
            expect(usersService.createOAuthUser).not.toHaveBeenCalled();
            expect(sessionService.createSession).toHaveBeenCalledWith(6, 'refresh-token');
        });

        it('creates a brand new user when none exists by provider or email', async () => {
            usersService.findByProvider.mockResolvedValue(null);
            dbService.users.findUnique.mockResolvedValue(null);
            usersService.createOAuthUser.mockResolvedValue({ id: 7 });

            await service.oauthLogin(profile);

            expect(usersService.createOAuthUser).toHaveBeenCalledWith({
                Email: profile.email,
                Username: profile.username,
                provider: profile.provider,
                providerId: profile.providerId,
            });
            expect(sessionService.createSession).toHaveBeenCalledWith(7, 'refresh-token');
        });
    });

    describe('sendCode', () => {
        it('generates a 6-digit code, stores it and emails it to the user', async () => {
            usersService.update.mockResolvedValue({});
            mailService.sendResetCode.mockResolvedValue(undefined);

            const result = await service.sendCode(3, 'bob@example.com');

            expect(usersService.update).toHaveBeenCalledTimes(1);
            const [userId, updatePayload] = usersService.update.mock.calls[0];
            expect(userId).toBe(3);
            expect(updatePayload.resetCode).toMatch(/^\d{6}$/);
            expect(updatePayload.codeExpire).toBeInstanceOf(Date);
            expect(mailService.sendResetCode).toHaveBeenCalledWith('bob@example.com', updatePayload.resetCode);
            expect(result).toEqual({ userId: 3 });
        });
    });

    describe('reset', () => {
        it('throws UnauthorizedException when the email is not registered', async () => {
            dbService.users.findUnique.mockResolvedValue(null);

            await expect(service.reset({ Email: 'nobody@example.com', Password: 'x' })).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('delegates to sendCode for the found user', async () => {
            dbService.users.findUnique.mockResolvedValue({ id: 9, Email: 'bob@example.com' });
            const sendCodeSpy = jest.spyOn(service, 'sendCode').mockResolvedValue({ userId: 9 });

            const result = await service.reset({ Email: 'bob@example.com', Password: 'x' });

            expect(sendCodeSpy).toHaveBeenCalledWith(9, 'bob@example.com');
            expect(result).toEqual({ userId: 9 });
        });
    });

    describe('resetCode', () => {
        const body = { userId: 1, Password: 'newPassword', code: '123456' };

        it('throws UnauthorizedException when the user does not exist', async () => {
            usersService.findById.mockResolvedValue(null);

            await expect(service.resetCode(body)).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when the code does not match', async () => {
            usersService.findById.mockResolvedValue({
                id: 1,
                resetCode: '000000',
                codeExpire: new Date(Date.now() + 10000),
            });

            await expect(service.resetCode(body)).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when the code has expired', async () => {
            usersService.findById.mockResolvedValue({
                id: 1,
                resetCode: '123456',
                codeExpire: new Date(Date.now() - 10000),
            });

            await expect(service.resetCode(body)).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when there is no codeExpire stored', async () => {
            usersService.findById.mockResolvedValue({
                id: 1,
                resetCode: '123456',
                codeExpire: null,
            });

            await expect(service.resetCode(body)).rejects.toThrow(UnauthorizedException);
        });

        it('updates the password and clears the reset code on success', async () => {
            usersService.findById.mockResolvedValue({
                id: 1,
                resetCode: '123456',
                codeExpire: new Date(Date.now() + 10000),
            });
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
            usersService.update.mockResolvedValue({});

            const result = await service.resetCode(body);

            expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
            expect(usersService.update).toHaveBeenCalledWith(1, {
                Password: 'hashed-new-password',
                resetCode: null,
                codeExpire: null,
            });
            expect(result).toEqual({ message: 'Password changed successfully' });
        });
    });

    describe('refresh', () => {
        it('throws UnauthorizedException when no refresh token is provided', async () => {
            await expect(service.refresh('')).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when no session matches the token hash', async () => {
            tokenService.hashRefreshToken.mockReturnValue('hashed-token');
            sessionService.findSessionByHash.mockResolvedValue(null);

            await expect(service.refresh('raw-token')).rejects.toThrow(UnauthorizedException);
        });

        it('rotates the session and returns new tokens on success', async () => {
            tokenService.hashRefreshToken.mockReturnValue('hashed-token');
            sessionService.findSessionByHash.mockResolvedValue({ id: 'session-1', userId: 4 });
            tokenService.generateRefreshToken.mockReturnValue('new-refresh-token');
            sessionService.rotateSession.mockResolvedValue({});
            tokenService.generateAccessToken.mockResolvedValue('new-access-token');

            const result = await service.refresh('raw-token');

            expect(tokenService.hashRefreshToken).toHaveBeenCalledWith('raw-token');
            expect(sessionService.rotateSession).toHaveBeenCalledWith('session-1', 'new-refresh-token');
            expect(tokenService.generateAccessToken).toHaveBeenCalledWith(4, 'session-1');
            expect(result).toEqual({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' });
        });
    });

    describe('logout', () => {
        it('deletes the session and returns the result', async () => {
            sessionService.deleteSession.mockResolvedValue({ count: 1 });

            const result = await service.logout('session-1');

            expect(sessionService.deleteSession).toHaveBeenCalledWith('session-1');
            expect(result).toEqual({ count: 1 });
        });
    });

    describe('logoutAll', () => {
        it('deletes all sessions for the user and returns the result', async () => {
            sessionService.deleteAllUserSessions.mockResolvedValue({ count: 3 });

            const result = await service.logoutAll(4);

            expect(sessionService.deleteAllUserSessions).toHaveBeenCalledWith(4);
            expect(result).toEqual({ count: 3 });
        });
    });

    describe('createTokenSession', () => {
        it('creates a session and issues an access token for it', async () => {
            tokenService.generateRefreshToken.mockReturnValue('refresh-token');
            sessionService.createSession.mockResolvedValue({ id: 'session-42' });
            tokenService.generateAccessToken.mockResolvedValue('access-token');

            const result = await service.createTokenSession(11);

            expect(sessionService.createSession).toHaveBeenCalledWith(11, 'refresh-token');
            expect(tokenService.generateAccessToken).toHaveBeenCalledWith(11, 'session-42');
            expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
        });
    });

    describe('changePassword', () => {
        const body = { OldPassword: 'old', NewPassword: 'new' };

        it('throws UnauthorizedException when the user does not exist', async () => {
            dbService.users.findUnique.mockResolvedValue(null);

            await expect(service.changePassword(1, body)).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when the user has no password set', async () => {
            dbService.users.findUnique.mockResolvedValue({ id: 1, Password: null });

            await expect(service.changePassword(1, body)).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when the old password is wrong', async () => {
            dbService.users.findUnique.mockResolvedValue({ id: 1, Password: 'hashed', Email: 'bob@example.com' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.changePassword(1, body)).rejects.toThrow(UnauthorizedException);
        });

        it('sends a reset code and returns success when the old password matches', async () => {
            dbService.users.findUnique.mockResolvedValue({ id: 1, Password: 'hashed', Email: 'bob@example.com' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            const sendCodeSpy = jest.spyOn(service, 'sendCode').mockResolvedValue({ userId: 1 });

            const result = await service.changePassword(1, body);

            expect(bcrypt.compare).toHaveBeenCalledWith('old', 'hashed');
            expect(sendCodeSpy).toHaveBeenCalledWith(1, 'bob@example.com');
            expect(result).toEqual({ success: true });
        });
    });

    describe('changePasswordCode', () => {
        it('throws UnauthorizedException when the user does not exist', async () => {
            dbService.users.findUnique.mockResolvedValue(null);

            await expect(service.changePasswordCode(1, '123456', 'newPass')).rejects.toThrow(UnauthorizedException);
        });

        it('delegates to resetCode for the found user', async () => {
            dbService.users.findUnique.mockResolvedValue({ id: 1 });
            const resetCodeSpy = jest
                .spyOn(service, 'resetCode')
                .mockResolvedValue({ message: 'Password changed successfully' });

            const result = await service.changePasswordCode(1, '123456', 'newPass');

            expect(resetCodeSpy).toHaveBeenCalledWith({ userId: 1, code: '123456', Password: 'newPass' });
            expect(result).toEqual({ message: 'Password changed successfully' });
        });
    });

    describe('deleteUser', () => {
        it('logs out all sessions before removing the user', async () => {
            sessionService.deleteAllUserSessions.mockResolvedValue({ count: 1 });
            usersService.remove.mockResolvedValue({ id: 1 });

            const result = await service.deleteUser(1);

            expect(sessionService.deleteAllUserSessions).toHaveBeenCalledWith(1);
            expect(usersService.remove).toHaveBeenCalledWith(1);
            expect(result).toEqual({ id: 1 });
        });
    });
});
