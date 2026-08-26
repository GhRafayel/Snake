import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminGuard } from './admin.guard';
import { DatabaseService } from 'src/database/database.service';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let databaseService: { users: { findUnique: jest.Mock } };

  const buildContext = (user: unknown): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    databaseService = {
      users: {
        findUnique: jest.fn(),
      },
    };
    guard = new AdminGuard(databaseService as unknown as DatabaseService);
  });

  it('throws when the request has no user (unauthenticated)', async () => {
    const context = buildContext(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow();
    expect(databaseService.users.findUnique).not.toHaveBeenCalled();
  });

  it('queries the user role using the userId from the request', async () => {
    databaseService.users.findUnique.mockResolvedValue({ role: Role.ADMIN });
    const context = buildContext({ userId: 42, sessionId: 's1', iat: 0, exp: 0 });

    await guard.canActivate(context);

    expect(databaseService.users.findUnique).toHaveBeenCalledWith({
      where: { id: 42 },
      select: { role: true },
    });
  });

  it('returns true when the user has the ADMIN role', async () => {
    databaseService.users.findUnique.mockResolvedValue({ role: Role.ADMIN });
    const context = buildContext({ userId: 1, sessionId: 's1', iat: 0, exp: 0 });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('throws ForbiddenException when the user has a non-admin role', async () => {
    databaseService.users.findUnique.mockResolvedValue({ role: Role.PLAYER });
    const context = buildContext({ userId: 2, sessionId: 's1', iat: 0, exp: 0 });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when the user record is not found', async () => {
    databaseService.users.findUnique.mockResolvedValue(null);
    const context = buildContext({ userId: 3, sessionId: 's1', iat: 0, exp: 0 });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException with a descriptive message for a BOT role', async () => {
    databaseService.users.findUnique.mockResolvedValue({ role: Role.BOT });
    const context = buildContext({ userId: 4, sessionId: 's1', iat: 0, exp: 0 });

    await expect(guard.canActivate(context)).rejects.toThrow('Admin access required');
  });
});
