import { Test, TestingModule } from '@nestjs/testing';
import { RoomStatus, RoomType } from '@prisma/client';
import { GameRoomService } from './gameRoom.service';
import { DatabaseService } from 'src/database/database.service';

describe('GameRoomService', () => {
  let service: GameRoomService;
  let db: {
    gameRoom: {
      findMany: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    roomUser: {
      upsert: jest.Mock;
      deleteMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    db = {
      gameRoom: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      roomUser: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameRoomService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    service = module.get<GameRoomService>(GameRoomService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findAll', () => {
    it('queries with a status filter and roomUsers count when a status is provided', async () => {
      const rooms = [{ id: 'r1', status: 'WAITING' }];
      db.gameRoom.findMany.mockResolvedValue(rooms);

      const result = await service.findAll('WAITING');

      expect(db.gameRoom.findMany).toHaveBeenCalledWith({
        where: { status: 'WAITING' },
        include: { _count: { select: { roomUsers: true } } },
      });
      expect(result).toBe(rooms);
    });

    it('queries with no arguments when no status is provided', async () => {
      const rooms = [{ id: 'r1' }, { id: 'r2' }];
      db.gameRoom.findMany.mockResolvedValue(rooms);

      const result = await service.findAll();

      expect(db.gameRoom.findMany).toHaveBeenCalledWith();
      expect(result).toBe(rooms);
    });
  });

  describe('createRoom', () => {
    it('joins a random waiting room that has capacity instead of creating one', async () => {
      const rooms = [
        { id: 'full', status: 'WAITING', maxUsers: 2, _count: { roomUsers: 2 } },
        { id: 'has-space', status: 'WAITING', maxUsers: 4, _count: { roomUsers: 1 } },
      ];
      db.gameRoom.findMany.mockResolvedValue(rooms);
      jest.spyOn(Math, 'random').mockReturnValue(0);

      const result = await service.createRoom(7);

      expect(result).toEqual({ roomId: 'has-space', status: 'WAITING' });
      expect(db.gameRoom.create).not.toHaveBeenCalled();
    });

    it('creates a new room when every waiting room is full', async () => {
      const rooms = [
        { id: 'full1', status: 'WAITING', maxUsers: 2, _count: { roomUsers: 2 } },
      ];
      db.gameRoom.findMany.mockResolvedValue(rooms);
      db.gameRoom.create.mockResolvedValue({ id: 'new-room', status: 'WAITING' });

      const result = await service.createRoom(7);

      expect(db.gameRoom.create).toHaveBeenCalledWith({
        data: { name: 'Room', ownerId: 7 },
        include: { _count: { select: { roomUsers: true } } },
      });
      expect(result).toEqual({ roomId: 'new-room', status: 'WAITING' });
    });

    it('creates a new room when there are no waiting rooms at all', async () => {
      db.gameRoom.findMany.mockResolvedValue([]);
      db.gameRoom.create.mockResolvedValue({ id: 'brand-new', status: 'WAITING' });

      const result = await service.createRoom(3);

      expect(db.gameRoom.create).toHaveBeenCalled();
      expect(result).toEqual({ roomId: 'brand-new', status: 'WAITING' });
    });
  });

  describe('createDedicatedRoom', () => {
    it('creates a room owned by the given user', async () => {
      db.gameRoom.create.mockResolvedValue({ id: 'ded-1', status: 'WAITING' });

      const result = await service.createDedicatedRoom(42);

      expect(db.gameRoom.create).toHaveBeenCalledWith({
        data: { name: 'Room', ownerId: 42 },
        include: { _count: { select: { roomUsers: true } } },
      });
      expect(result).toEqual({ roomId: 'ded-1', status: 'WAITING' });
    });
  });

  describe('createSoloRoom', () => {
    it('creates a private room already in PLAYING status for vs-AI games', async () => {
      db.gameRoom.create.mockResolvedValue({ id: 'solo-1', status: RoomStatus.PLAYING });

      const result = await service.createSoloRoom(9, 2);

      expect(db.gameRoom.create).toHaveBeenCalledWith({
        data: {
          name: 'vs AI Bot',
          ownerId: 9,
          type: RoomType.PRIVATE,
          status: RoomStatus.PLAYING,
          maxUsers: 2,
        },
      });
      expect(result).toEqual({ roomId: 'solo-1', status: RoomStatus.PLAYING });
    });
  });

  describe('addUserToRoom', () => {
    it('upserts the roomUser keyed by the composite roomId/userId', async () => {
      const upserted = { id: 'ru1', roomId: 'room-1', userId: 5, socketId: 'sock-1' };
      db.roomUser.upsert.mockResolvedValue(upserted);

      const result = await service.addUserToRoom('room-1', 5, 'sock-1');

      expect(db.roomUser.upsert).toHaveBeenCalledWith({
        where: { roomId_userId: { roomId: 'room-1', userId: 5 } },
        update: { socketId: 'sock-1' },
        create: { roomId: 'room-1', userId: 5, socketId: 'sock-1' },
      });
      expect(result).toBe(upserted);
    });
  });

  describe('findOne', () => {
    it('returns the room found by id', async () => {
      const room = { id: 'room-1', name: 'Room' };
      db.gameRoom.findUnique.mockResolvedValue(room);

      const result = await service.findOne('room-1');

      expect(db.gameRoom.findUnique).toHaveBeenCalledWith({ where: { id: 'room-1' } });
      expect(result).toBe(room);
    });

    it('returns null when the room does not exist', async () => {
      db.gameRoom.findUnique.mockResolvedValue(null);

      const result = await service.findOne('missing');

      expect(result).toBeNull();
    });
  });

  describe('createPrivateRoom', () => {
    it('creates a room from the provided DTO and includes the roomUsers count', async () => {
      const dto = { name: 'Private', maxUsers: 4, ownerId: 1, type: 'PRIVATE' as const };
      const created = { id: 'priv-1', ...dto };
      db.gameRoom.create.mockResolvedValue(created);

      const result = await service.createPrivateRoom(dto);

      expect(db.gameRoom.create).toHaveBeenCalledWith({
        data: dto,
        include: { _count: { select: { roomUsers: true } } },
      });
      expect(result).toBe(created);
    });
  });

  describe('deleteRoom', () => {
    it('deletes the room by id and returns the deleted row', async () => {
      const deleted = { id: 'room-1' };
      db.gameRoom.delete.mockResolvedValue(deleted);

      const result = await service.deleteRoom('room-1');

      expect(db.gameRoom.delete).toHaveBeenCalledWith({ where: { id: 'room-1' } });
      expect(result).toBe(deleted);
    });
  });

  describe('removeUserFromRoom', () => {
    it('deletes matching roomUser rows for the given room and user', async () => {
      db.roomUser.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.removeUserFromRoom('room-1', 5);

      expect(db.roomUser.deleteMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1', userId: 5 },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('getPlayerCount', () => {
    it('counts roomUser rows for the given room', async () => {
      db.roomUser.count.mockResolvedValue(3);

      const result = await service.getPlayerCount('room-1');

      expect(db.roomUser.count).toHaveBeenCalledWith({ where: { roomId: 'room-1' } });
      expect(result).toBe(3);
    });
  });

  describe('setStatus', () => {
    it('updates the room status', async () => {
      const updated = { id: 'room-1', status: RoomStatus.PLAYING };
      db.gameRoom.update.mockResolvedValue(updated);

      const result = await service.setStatus('room-1', RoomStatus.PLAYING);

      expect(db.gameRoom.update).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        data: { status: RoomStatus.PLAYING },
      });
      expect(result).toBe(updated);
    });
  });

  describe('findBySocketId', () => {
    it('returns the roomUser matching the socketId', async () => {
      const roomUser = { id: 'ru1', socketId: 'sock-1' };
      db.roomUser.findFirst.mockResolvedValue(roomUser);

      const result = await service.findBySocketId('sock-1');

      expect(db.roomUser.findFirst).toHaveBeenCalledWith({ where: { socketId: 'sock-1' } });
      expect(result).toBe(roomUser);
    });

    it('returns null when no roomUser has that socketId', async () => {
      db.roomUser.findFirst.mockResolvedValue(null);

      const result = await service.findBySocketId('unknown-sock');

      expect(result).toBeNull();
    });
  });

});
