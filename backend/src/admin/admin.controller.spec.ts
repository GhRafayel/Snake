import { Test } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/common/guards/jwt-auth.guard';

jest.mock('src/logger/logger.service');

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<Pick<AdminService, 'searchUsers' | 'findOne' | 'update' | 'remove'>>;

  beforeEach(async () => {
    adminService = {
      searchUsers: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: adminService }],
    })
      // AdminController is decorated with @UseGuards(JwtAuthGuard, AdminGuard). Nest's
      // DependenciesScanner auto-registers guard classes referenced this way as real
      // providers of the module (needing their own dependencies, e.g. DatabaseService),
      // so overrideGuard is required to swap them for no-op stand-ins in this unit test,
      // which never exercises the HTTP guard pipeline.
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = moduleRef.get(AdminController);
  });

  describe('searchUsers', () => {
    it('passes the query through to the service and returns its result', async () => {
      adminService.searchUsers.mockResolvedValue([{ id: 1 }] as never);

      const result = await controller.searchUsers('bob');

      expect(adminService.searchUsers).toHaveBeenCalledWith('bob');
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('findOne', () => {
    it('passes the parsed id through to the service', async () => {
      adminService.findOne.mockResolvedValue({ id: 9 } as never);

      const result = await controller.findOne(9);

      expect(adminService.findOne).toHaveBeenCalledWith(9);
      expect(result).toEqual({ id: 9 });
    });
  });

  describe('update', () => {
    it('passes id and dto through to the service', async () => {
      const dto = { Username: 'new-name' } as never;
      adminService.update.mockResolvedValue({ id: 9, Username: 'new-name' } as never);

      const result = await controller.update(9, dto);

      expect(adminService.update).toHaveBeenCalledWith(9, dto);
      expect(result).toEqual({ id: 9, Username: 'new-name' });
    });

    it('propagates errors thrown by the service (e.g. trying to edit an admin)', async () => {
      adminService.update.mockRejectedValue(new Error());

      await expect(controller.update(1, {} as never)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('passes the parsed id through to the service', async () => {
      adminService.remove.mockResolvedValue({ id: 3 } as never);

      const result = await controller.remove(3);

      expect(adminService.remove).toHaveBeenCalledWith(3);
      expect(result).toEqual({ id: 3 });
    });
  });
});
