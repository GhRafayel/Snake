import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { RequestWithOAuthProfileType } from 'src/types/Auth.interface';

jest.mock('src/logger/logger.service', () => ({
    LoggerService: jest.fn().mockImplementation(() => ({
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
    })),
}));

describe('AuthController', () => {
    let controller: AuthController;
    let authService: {
        signUp: jest.Mock;
        signIn: jest.Mock;
        refresh: jest.Mock;
        reset: jest.Mock;
        resetCode: jest.Mock;
        logout: jest.Mock;
        changePassword: jest.Mock;
        changePasswordCode: jest.Mock;
        logoutAll: jest.Mock;
        deleteUser: jest.Mock;
        oauthLogin: jest.Mock;
    };
    const originalFrontendUrl = process.env.FRONTEND_URL;

    beforeAll(() => {
        process.env.FRONTEND_URL = 'https://frontend.example.com';
    });

    afterAll(() => {
        process.env.FRONTEND_URL = originalFrontendUrl;
    });

    beforeEach(async () => {
        authService = {
            signUp: jest.fn(),
            signIn: jest.fn(),
            refresh: jest.fn(),
            reset: jest.fn(),
            resetCode: jest.fn(),
            logout: jest.fn(),
            changePassword: jest.fn(),
            changePasswordCode: jest.fn(),
            logoutAll: jest.fn(),
            deleteUser: jest.fn(),
            oauthLogin: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: authService }],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('signUp delegates to authService.signUp with the dto', async () => {
        const dto = { Username: 'bob', Email: 'bob@example.com', Password: 'pw', resetCode: null, codeExpire: null };
        authService.signUp.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

        const result = await controller.signUp(dto);

        expect(authService.signUp).toHaveBeenCalledWith(dto);
        expect(result).toEqual({ accessToken: 'a', refreshToken: 'r' });
    });

    it('signIn delegates to authService.signIn with the dto', async () => {
        const dto = { Email: 'bob@example.com', Password: 'pw' };
        authService.signIn.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

        const result = await controller.signIn(dto);

        expect(authService.signIn).toHaveBeenCalledWith(dto);
        expect(result).toEqual({ accessToken: 'a', refreshToken: 'r' });
    });

    it('refresh delegates to authService.refresh with the raw token', async () => {
        authService.refresh.mockResolvedValue({ accessToken: 'a2', refreshToken: 'r2' });

        const result = await controller.refresh('raw-refresh-token');

        expect(authService.refresh).toHaveBeenCalledWith('raw-refresh-token');
        expect(result).toEqual({ accessToken: 'a2', refreshToken: 'r2' });
    });

    it('reset delegates to authService.reset with the body', async () => {
        const body = { Email: 'bob@example.com', Password: 'x' };
        authService.reset.mockResolvedValue({ userId: 1 });

        const result = await controller.reset(body);

        expect(authService.reset).toHaveBeenCalledWith(body);
        expect(result).toEqual({ userId: 1 });
    });

    it('resetCode delegates to authService.resetCode with the body', async () => {
        const body = { userId: 1, Password: 'newPw', code: '123456' };
        authService.resetCode.mockResolvedValue({ message: 'Password changed successfully' });

        const result = await controller.resetCode(body);

        expect(authService.resetCode).toHaveBeenCalledWith(body);
        expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('logout deletes the session and reports the count', async () => {
        authService.logout.mockResolvedValue({ count: 1 });

        const result = await controller.logout('session-1');

        expect(authService.logout).toHaveBeenCalledWith('session-1');
        expect(result).toEqual({ success: true, count: { count: 1 } });
    });

    it('changePassword delegates to authService.changePassword with the userId and body', async () => {
        const body = { OldPassword: 'old', NewPassword: 'new' };
        authService.changePassword.mockResolvedValue({ success: true });

        const result = await controller.changePassword(1, body);

        expect(authService.changePassword).toHaveBeenCalledWith(1, body);
        expect(result).toEqual({ success: true });
    });

    it('changePasswordCode delegates to authService.changePasswordCode with userId, code and newPassword', async () => {
        authService.changePasswordCode.mockResolvedValue({ message: 'Password changed successfully' });

        const result = await controller.changePasswordCode(1, { code: '123456', newPassword: 'newPw' });

        expect(authService.changePasswordCode).toHaveBeenCalledWith(1, '123456', 'newPw');
        expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('logoutAll converts the userId to a number before delegating', async () => {
        authService.logoutAll.mockResolvedValue({ count: 2 });

        const result = await controller.logoutAll('7');

        expect(authService.logoutAll).toHaveBeenCalledWith(7);
        expect(result).toEqual({ success: true, count: { count: 2 } });
    });

    it('deleteUser delegates to authService.deleteUser and wraps the result', async () => {
        authService.deleteUser.mockResolvedValue({ id: 1 });

        const result = await controller.deleteUser(1);

        expect(authService.deleteUser).toHaveBeenCalledWith(1);
        expect(result).toEqual({ success: true, res: { id: 1 } });
    });

    describe('googleCallback', () => {
        it('logs the user in via oauth and redirects with fresh tokens', async () => {
            const req = {
                user: { provider: 'google', providerId: 'g-1', email: 'bob@example.com', username: 'bob' },
            } as RequestWithOAuthProfileType;
            const res = { redirect: jest.fn() } as unknown as Response;
            authService.oauthLogin.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

            await controller.googleCallback(req, res);

            expect(authService.oauthLogin).toHaveBeenCalledWith(req.user);
            expect(res.redirect).toHaveBeenCalledTimes(1);
            const redirectedUrl = (res.redirect as jest.Mock).mock.calls[0][0] as string;
            expect(redirectedUrl).toContain('https://frontend.example.com/api/auth');
            expect(redirectedUrl).toContain('accessToken=a');
            expect(redirectedUrl).toContain('refreshToken=r');
        });
    });

    describe('githubCallback', () => {
        it('logs the user in via oauth and redirects with fresh tokens', async () => {
            const req = {
                user: { provider: 'github', providerId: 'gh-1', email: 'bob@example.com', username: 'bob' },
            } as RequestWithOAuthProfileType;
            const res = { redirect: jest.fn() } as unknown as Response;
            authService.oauthLogin.mockResolvedValue({ accessToken: 'a3', refreshToken: 'r3' });

            await controller.githubCallback(req, res);

            expect(authService.oauthLogin).toHaveBeenCalledWith(req.user);
            expect(res.redirect).toHaveBeenCalledTimes(1);
            const redirectedUrl = (res.redirect as jest.Mock).mock.calls[0][0] as string;
            expect(redirectedUrl).toContain('https://frontend.example.com/api/auth');
            expect(redirectedUrl).toContain('accessToken=a3');
            expect(redirectedUrl).toContain('refreshToken=r3');
        });
    });
});
