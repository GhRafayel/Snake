import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { DatabaseService } from 'src/database/database.service';
import { RedisService } from 'src/redis/redis.service';

describe('FriendsService', () => {
  let service: FriendsService;
  let db: {
    friendsRequest: {
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      findMany: jest.Mock;
      findFirstOrThrow: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let redis: { isOnline: jest.Mock };

  beforeEach(async () => {
    db = {
      friendsRequest: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        findFirstOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    redis = { isOnline: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: DatabaseService, useValue: db },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendRequest', () => {
    it('throws when the sender and receiver are the same user', async () => {
      await expect(service.sendRequest(1, 1)).rejects.toThrow(BadRequestException);
      expect(db.friendsRequest.findUnique).not.toHaveBeenCalled();
    });

    it('throws when a PENDING request already exists in the forward direction', async () => {
      db.friendsRequest.findUnique.mockResolvedValueOnce({ id: 'r1', status: 'PENDING' });
      await expect(service.sendRequest(1, 2)).rejects.toThrow('Request already sent');
    });

    it('throws when an ACCEPTED request already exists in the forward direction', async () => {
      db.friendsRequest.findUnique.mockResolvedValueOnce({ id: 'r1', status: 'ACCEPTED' });
      await expect(service.sendRequest(1, 2)).rejects.toThrow('You are friends already');
    });

    it('deletes a stale REJECTED forward request and creates a new one', async () => {
      db.friendsRequest.findUnique
        .mockResolvedValueOnce({ id: 'old-1', status: 'REJECTED' }) // forward
        .mockResolvedValueOnce(null); // reverse
      db.friendsRequest.create.mockResolvedValueOnce({ id: 'new-1' });

      const result = await service.sendRequest(1, 2);

      expect(db.friendsRequest.delete).toHaveBeenCalledWith({ where: { id: 'old-1' } });
      expect(db.friendsRequest.create).toHaveBeenCalledWith({
        data: { senderId: 1, receiverId: 2 },
        select: { id: true },
      });
      expect(result).toEqual({ id: 'new-1' });
    });

    it('throws when the receiver already sent a pending request (reverse PENDING)', async () => {
      db.friendsRequest.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'rev-1', status: 'PENDING' });
      await expect(service.sendRequest(1, 2)).rejects.toThrow('The user already sent you a request');
    });

    it('throws when the reverse request is ACCEPTED (already friends)', async () => {
      db.friendsRequest.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'rev-1', status: 'ACCEPTED' });
      await expect(service.sendRequest(1, 2)).rejects.toThrow('You are friends already');
    });

    it('deletes a stale REJECTED reverse request and creates a new request', async () => {
      db.friendsRequest.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'rev-1', status: 'REJECTED' });
      db.friendsRequest.create.mockResolvedValueOnce({ id: 'new-1' });

      const result = await service.sendRequest(1, 2);

      expect(db.friendsRequest.delete).toHaveBeenCalledWith({ where: { id: 'rev-1' } });
      expect(result).toEqual({ id: 'new-1' });
    });

    it('creates a request when there is no existing relationship in either direction', async () => {
      db.friendsRequest.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      db.friendsRequest.create.mockResolvedValueOnce({ id: 'new-1' });

      const result = await service.sendRequest(1, 2);

      expect(db.friendsRequest.findUnique).toHaveBeenNthCalledWith(1, {
        where: { senderId_receiverId: { senderId: 1, receiverId: 2 } },
      });
      expect(db.friendsRequest.findUnique).toHaveBeenNthCalledWith(2, {
        where: { senderId_receiverId: { senderId: 2, receiverId: 1 } },
      });
      expect(result).toEqual({ id: 'new-1' });
    });
  });

  describe('acceptRequest', () => {
    it('throws when the caller is not the receiver of the request', async () => {
      db.friendsRequest.findUniqueOrThrow.mockResolvedValueOnce({ id: 'r1', receiverId: 99, status: 'PENDING' });
      await expect(service.acceptRequest(1, 'r1')).rejects.toThrow('You are not the receiver of this request');
    });

    it('throws when the request is not pending', async () => {
      db.friendsRequest.findUniqueOrThrow.mockResolvedValueOnce({ id: 'r1', receiverId: 1, status: 'ACCEPTED' });
      await expect(service.acceptRequest(1, 'r1')).rejects.toThrow('Request is not pending');
    });

    it('accepts a pending request addressed to the caller', async () => {
      db.friendsRequest.findUniqueOrThrow.mockResolvedValueOnce({ id: 'r1', receiverId: 1, status: 'PENDING' });
      db.friendsRequest.update.mockResolvedValueOnce({ id: 'r1', status: 'ACCEPTED' });

      const result = await service.acceptRequest(1, 'r1');

      expect(db.friendsRequest.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { status: 'ACCEPTED' },
      });
      expect(result).toEqual({ success: true });
    });

    it('propagates the not-found error from findUniqueOrThrow', async () => {
      db.friendsRequest.findUniqueOrThrow.mockRejectedValueOnce(new Error('not found'));
      await expect(service.acceptRequest(1, 'missing')).rejects.toThrow('not found');
    });
  });

  describe('rejectRequest', () => {
    it('throws when the caller is not the receiver of the request', async () => {
      db.friendsRequest.findUniqueOrThrow.mockResolvedValueOnce({ id: 'r1', receiverId: 99, status: 'PENDING' });
      await expect(service.rejectRequest(1, 'r1')).rejects.toThrow('You are not the receiver of this request');
    });

    it('throws when the request is not pending', async () => {
      db.friendsRequest.findUniqueOrThrow.mockResolvedValueOnce({ id: 'r1', receiverId: 1, status: 'REJECTED' });
      await expect(service.rejectRequest(1, 'r1')).rejects.toThrow('Request is not pending');
    });

    it('rejects a pending request addressed to the caller', async () => {
      db.friendsRequest.findUniqueOrThrow.mockResolvedValueOnce({ id: 'r1', receiverId: 1, status: 'PENDING' });
      db.friendsRequest.update.mockResolvedValueOnce({ id: 'r1', status: 'REJECTED' });

      const result = await service.rejectRequest(1, 'r1');

      expect(db.friendsRequest.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { status: 'REJECTED' },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('getFriends', () => {
    it('resolves each request to the counterparty of the caller, with score and online status', async () => {
      db.friendsRequest.findMany.mockResolvedValueOnce([
        {
          id: 'req-1',
          senderId: 1,
          receiverId: 2,
          status: 'ACCEPTED',
          sender: { id: 1, Username: 'me', history: { totalScore: 10 } },
          receiver: { id: 2, Username: 'friend2', history: { totalScore: 20 } },
        },
        {
          id: 'req-2',
          senderId: 3,
          receiverId: 1,
          status: 'ACCEPTED',
          sender: { id: 3, Username: 'friend3', history: null },
          receiver: { id: 1, Username: 'me', history: { totalScore: 10 } },
        },
      ]);
      redis.isOnline.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      const result = await service.getFriends(1);

      expect(result).toEqual([
        { id: 2, Username: 'friend2', score: 20, requestId: 'req-1', status: 'ACCEPTED', senderId: 1, isOnline: true },
        { id: 3, Username: 'friend3', score: 0, requestId: 'req-2', status: 'ACCEPTED', senderId: 3, isOnline: false },
      ]);
      expect(redis.isOnline).toHaveBeenCalledWith(2);
      expect(redis.isOnline).toHaveBeenCalledWith(3);
    });

    it('returns an empty list when the user has no requests', async () => {
      db.friendsRequest.findMany.mockResolvedValueOnce([]);
      const result = await service.getFriends(1);
      expect(result).toEqual([]);
    });
  });

  describe('removeFriend', () => {
    it('deletes the accepted friendship between the two users', async () => {
      db.friendsRequest.findFirstOrThrow.mockResolvedValueOnce({ id: 'r1' });
      db.friendsRequest.delete.mockResolvedValueOnce({ id: 'r1' });

      const result = await service.removeFriend(1, 2);

      expect(db.friendsRequest.findFirstOrThrow).toHaveBeenCalledWith({
        where: {
          status: 'ACCEPTED',
          OR: [
            { senderId: 1, receiverId: 2 },
            { senderId: 2, receiverId: 1 },
          ],
        },
      });
      expect(db.friendsRequest.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
      expect(result).toEqual({ success: true });
    });

    it('propagates the not-found error when no accepted friendship exists', async () => {
      db.friendsRequest.findFirstOrThrow.mockRejectedValueOnce(new Error('not found'));
      await expect(service.removeFriend(1, 2)).rejects.toThrow('not found');
    });
  });

  describe('incomingRequest', () => {
    it('returns pending requests addressed to the user with sender info and online status', async () => {
      db.friendsRequest.findMany.mockResolvedValueOnce([
        {
          id: 'req-1',
          status: 'PENDING',
          sender: { id: 5, Username: 'sender5', history: { totalScore: 50 } },
        },
      ]);
      redis.isOnline.mockResolvedValueOnce(true);

      const result = await service.incomingRequest(1);

      expect(db.friendsRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'PENDING', receiverId: 1 } }),
      );
      expect(result).toEqual([
        {
          id: 'req-1',
          status: 'PENDING',
          sender: { id: 5, Username: 'sender5', score: 50, isOnline: true },
        },
      ]);
    });

    it('falls back to a score of 0 when the sender has no stats history', async () => {
      db.friendsRequest.findMany.mockResolvedValueOnce([
        {
          id: 'req-1',
          status: 'PENDING',
          sender: { id: 5, Username: 'sender5', history: null },
        },
      ]);
      redis.isOnline.mockResolvedValueOnce(false);

      const result = await service.incomingRequest(1);

      expect(result[0].sender.score).toBe(0);
    });
  });

  describe('cancelRequest', () => {
    it('deletes a pending request sent by the caller to the given receiver', async () => {
      db.friendsRequest.findFirstOrThrow.mockResolvedValueOnce({ id: 'r1' });
      db.friendsRequest.delete.mockResolvedValueOnce({ id: 'r1' });

      const result = await service.cancelRequest(1, 2);

      expect(db.friendsRequest.findFirstOrThrow).toHaveBeenCalledWith({
        where: { status: 'PENDING', senderId: 1, receiverId: 2 },
      });
      expect(db.friendsRequest.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
      expect(result).toEqual({ success: true });
    });

    it('propagates the not-found error when no pending request exists', async () => {
      db.friendsRequest.findFirstOrThrow.mockRejectedValueOnce(new Error('not found'));
      await expect(service.cancelRequest(1, 2)).rejects.toThrow('not found');
    });
  });
});
