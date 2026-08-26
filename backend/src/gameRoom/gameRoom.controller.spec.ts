import { Test, TestingModule } from '@nestjs/testing';
import { GameRoomController } from './gameRoom.controller';
import { GameRoomService } from './gameRoom.service';

// The controller instantiates its own `new LoggerService(...)` rather than
// injecting it, and LoggerService writes to disk on every log call. Auto-mock
// the module so specs don't touch the real filesystem or console.
jest.mock('src/logger/logger.service');

describe('GameRoomController', () => {
  let controller: GameRoomController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    createRoom: jest.Mock;
    createPrivateRoom: jest.Mock;
    deleteRoom: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      createRoom: jest.fn(),
      createPrivateRoom: jest.fn(),
      deleteRoom: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameRoomController],
      providers: [{ provide: GameRoomService, useValue: service }],
    }).compile();

    controller = module.get<GameRoomController>(GameRoomController);
  });

  describe('findAll', () => {
    it('delegates to roomService.findAll with the status filter', () => {
      const rooms = [{ id: 'r1' }];
      service.findAll.mockReturnValue(rooms);

      const result = controller.findAll('WAITING');

      expect(service.findAll).toHaveBeenCalledWith('WAITING');
      expect(result).toBe(rooms);
    });

    it('delegates to roomService.findAll with undefined when no filter given', () => {
      const rooms = [{ id: 'r1' }, { id: 'r2' }];
      service.findAll.mockReturnValue(rooms);

      const result = controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toBe(rooms);
    });
  });

  describe('findOne', () => {
    it('delegates to roomService.findOne with the id param', async () => {
      const room = { id: 'room-1' };
      service.findOne.mockResolvedValue(room);

      const result = await controller.findOne('room-1');

      expect(service.findOne).toHaveBeenCalledWith('room-1');
      expect(result).toBe(room);
    });
  });

  describe('createRoom', () => {
    it('delegates to roomService.createRoom with the parsed numeric id', async () => {
      const created = { roomId: 'room-1', status: 'WAITING' };
      service.createRoom.mockResolvedValue(created);

      const result = await controller.createRoom(11);

      expect(service.createRoom).toHaveBeenCalledWith(11);
      expect(result).toBe(created);
    });
  });

  describe('createPrivateRoom', () => {
    it('delegates to roomService.createPrivateRoom with the request body', async () => {
      const dto = { name: 'Private', maxUsers: 4, ownerId: 1, type: 'PRIVATE' as const };
      const created = { id: 'priv-1', ...dto };
      service.createPrivateRoom.mockResolvedValue(created);

      const result = await controller.createPrivateRoom(dto);

      expect(service.createPrivateRoom).toHaveBeenCalledWith(dto);
      expect(result).toBe(created);
    });
  });

  describe('deleteRoom', () => {
    it('delegates to roomService.deleteRoom and awaits/returns its result', async () => {
      const deleted = { id: 'room-1' };
      service.deleteRoom.mockResolvedValue(deleted);

      const result = await controller.deleteRoom('room-1');

      expect(service.deleteRoom).toHaveBeenCalledWith('room-1');
      expect(result).toBe(deleted);
    });

    it('propagates a rejection from roomService.deleteRoom', async () => {
      service.deleteRoom.mockRejectedValue(new Error('room not found'));

      await expect(controller.deleteRoom('missing')).rejects.toThrow('room not found');
    });
  });
});
