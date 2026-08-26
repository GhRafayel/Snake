import { Test, TestingModule } from '@nestjs/testing';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';

describe('FriendsController', () => {
  let controller: FriendsController;
  let service: {
    sendRequest: jest.Mock;
    acceptRequest: jest.Mock;
    rejectRequest: jest.Mock;
    cancelRequest: jest.Mock;
    getFriends: jest.Mock;
    removeFriend: jest.Mock;
    incomingRequest: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      sendRequest: jest.fn(),
      acceptRequest: jest.fn(),
      rejectRequest: jest.fn(),
      cancelRequest: jest.fn(),
      getFriends: jest.fn(),
      removeFriend: jest.fn(),
      incomingRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendsController],
      providers: [{ provide: FriendsService, useValue: service }],
    }).compile();

    controller = module.get<FriendsController>(FriendsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sendRequest delegates to the service with the authenticated sender id and the body receiver id', async () => {
    service.sendRequest.mockResolvedValueOnce({ id: 'req-1' });
    const result = await controller.sendRequest(1, 2);
    expect(service.sendRequest).toHaveBeenCalledWith(1, 2);
    expect(result).toEqual({ id: 'req-1' });
  });

  it('acceptRequest delegates to the service with the authenticated user id and the request id param', async () => {
    service.acceptRequest.mockResolvedValueOnce({ success: true });
    const result = await controller.acceptRequest(1, 'req-1');
    expect(service.acceptRequest).toHaveBeenCalledWith(1, 'req-1');
    expect(result).toEqual({ success: true });
  });

  it('rejectRequest delegates to the service with the authenticated user id and the request id param', async () => {
    service.rejectRequest.mockResolvedValueOnce({ success: true });
    const result = await controller.rejectRequest(1, 'req-1');
    expect(service.rejectRequest).toHaveBeenCalledWith(1, 'req-1');
    expect(result).toEqual({ success: true });
  });

  it('cancelRequest delegates to the service with the authenticated user id and the body receiver id', async () => {
    service.cancelRequest.mockResolvedValueOnce({ success: true });
    const result = await controller.cancelRequest(1, 2);
    expect(service.cancelRequest).toHaveBeenCalledWith(1, 2);
    expect(result).toEqual({ success: true });
  });

  it('getFriends delegates to the service with the authenticated user id', async () => {
    service.getFriends.mockResolvedValueOnce([{ id: 2 }]);
    const result = await controller.getFriends(1);
    expect(service.getFriends).toHaveBeenCalledWith(1);
    expect(result).toEqual([{ id: 2 }]);
  });

  it('removeFriend delegates to the service with the authenticated user id and the parsed friend id param', async () => {
    service.removeFriend.mockResolvedValueOnce({ success: true });
    const result = await controller.removeFriend(1, 2);
    expect(service.removeFriend).toHaveBeenCalledWith(1, 2);
    expect(result).toEqual({ success: true });
  });

  it('incomingRequest delegates to the service with the authenticated user id', async () => {
    service.incomingRequest.mockResolvedValueOnce([{ id: 'req-1' }]);
    const result = await controller.incomingRequest(1);
    expect(service.incomingRequest).toHaveBeenCalledWith(1);
    expect(result).toEqual([{ id: 'req-1' }]);
  });

  it('propagates errors thrown by the service', async () => {
    service.sendRequest.mockRejectedValueOnce(new Error('boom'));
    await expect(controller.sendRequest(1, 2)).rejects.toThrow('boom');
  });
});
