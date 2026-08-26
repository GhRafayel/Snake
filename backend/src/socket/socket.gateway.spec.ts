import { Test } from '@nestjs/testing';
import { RoomStatus } from '@prisma/client';
import { clampBotLevel, SocketGateway } from './socket.gateway';
import { GameRoomService } from 'src/gameRoom/gameRoom.service';
import { RedisService } from 'src/redis/redis.service';
import { TokenService } from 'src/auth/token/token.service';
import { UsersService } from 'src/users/users.service';
import { GameEnginService } from 'src/game-engin/game-engin.service';

jest.mock('src/logger/logger.service');

describe('clampBotLevel', () => {
  it('clamps values below the minimum up to 1', () => {
    expect(clampBotLevel(0)).toBe(1);
    expect(clampBotLevel(-5)).toBe(1);
  });

  it('clamps values above the maximum down to 4', () => {
    expect(clampBotLevel(5)).toBe(4);
    expect(clampBotLevel(100)).toBe(4);
  });

  it('floors fractional levels', () => {
    expect(clampBotLevel(2.9)).toBe(2);
  });

  it('passes through valid integer levels unchanged', () => {
    expect(clampBotLevel(1)).toBe(1);
    expect(clampBotLevel(3)).toBe(3);
    expect(clampBotLevel(4)).toBe(4);
  });

  it('falls back to the minimum for non-numeric input', () => {
    expect(clampBotLevel(undefined)).toBe(1);
    expect(clampBotLevel(null)).toBe(1);
    expect(clampBotLevel('not-a-number')).toBe(1);
  });
});

describe('SocketGateway', () => {
  let gateway: SocketGateway;
  let roomService: jest.Mocked<
    Pick<
      GameRoomService,
      | 'findOne'
      | 'getPlayerCount'
      | 'createRoom'
      | 'addUserToRoom'
      | 'createDedicatedRoom'
      | 'createSoloRoom'
      | 'removeUserFromRoom'
      | 'setStatus'
    >
  >;
  let redisService: jest.Mocked<
    Pick<RedisService, 'addOnlineUser' | 'removeOnlineUser' | 'getOnlineUsers' | 'refreshOnlineUser' | 'set' | 'del'>
  >;
  let tokenService: jest.Mocked<Pick<TokenService, 'verifyAccessToken'>>;
  let usersService: jest.Mocked<Pick<UsersService, 'findOne' | 'getOrCreateBots'>>;
  let gameEnginService: jest.Mocked<Pick<GameEnginService, 'startGame' | 'eliminatePlayer' | 'getGame' | 'queueDirection'>>;

  let roomEmit: jest.Mock;
  let server: { to: jest.Mock; emit: jest.Mock; httpServer: { on: jest.Mock } };

  const fakeUser = {
    id: 1,
    Username: 'tester',
    role: 'PLAYER',
    history: { gamesWon: 1, gamesLost: 2, totalScore: 30 },
  };

  const createMockClient = (overrides: Record<string, unknown> = {}) => ({
    id: 'socket-1',
    handshake: { headers: { cookie: '' } },
    data: {},
    join: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    ...overrides,
  });

  beforeEach(async () => {
    roomService = {
      findOne: jest.fn(),
      getPlayerCount: jest.fn(),
      createRoom: jest.fn(),
      addUserToRoom: jest.fn(),
      createDedicatedRoom: jest.fn(),
      createSoloRoom: jest.fn(),
      removeUserFromRoom: jest.fn(),
      setStatus: jest.fn(),
    };
    redisService = {
      addOnlineUser: jest.fn(),
      removeOnlineUser: jest.fn(),
      getOnlineUsers: jest.fn(),
      refreshOnlineUser: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    tokenService = {
      verifyAccessToken: jest.fn(),
    };
    usersService = {
      findOne: jest.fn(),
      getOrCreateBots: jest.fn(),
    };
    gameEnginService = {
      startGame: jest.fn(),
      eliminatePlayer: jest.fn(),
      getGame: jest.fn(),
      queueDirection: jest.fn(),
    };

    roomEmit = jest.fn();
    server = {
      to: jest.fn(() => ({ emit: roomEmit })),
      emit: jest.fn(),
      httpServer: { on: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SocketGateway,
        { provide: GameRoomService, useValue: roomService },
        { provide: RedisService, useValue: redisService },
        { provide: TokenService, useValue: tokenService },
        { provide: UsersService, useValue: usersService },
        { provide: GameEnginService, useValue: gameEnginService },
      ],
    }).compile();

    gateway = moduleRef.get(SocketGateway);
    (gateway as unknown as { server: typeof server }).server = server;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('afterInit', () => {
    it('registers a raw-socket connection handler that disables Nagle', () => {
      gateway.afterInit(server as never);

      expect(server.httpServer.on).toHaveBeenCalledWith('connection', expect.any(Function));

      const handler = server.httpServer.on.mock.calls[0][1];
      const rawSocket = { setNoDelay: jest.fn() };
      handler(rawSocket);

      expect(rawSocket.setNoDelay).toHaveBeenCalledWith(true);
    });
  });

  describe('getClient / handleConnection', () => {
    it('disconnects and returns null when there is no accessToken cookie', async () => {
      const client = createMockClient({ handshake: { headers: { cookie: '' } } });

      const result = await gateway.getClient(client as never);

      expect(result).toBeNull();
      expect(client.disconnect).toHaveBeenCalled();
      expect(tokenService.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('disconnects when the access token fails verification', async () => {
      const client = createMockClient({ handshake: { headers: { cookie: 'accessToken=bad-token' } } });
      tokenService.verifyAccessToken.mockResolvedValue(new Error('invalid') as never);

      const result = await gateway.getClient(client as never);

      expect(result).toBeNull();
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('disconnects when the token is valid but the user no longer exists', async () => {
      const client = createMockClient({ handshake: { headers: { cookie: 'accessToken=good-token' } } });
      tokenService.verifyAccessToken.mockResolvedValue({ userId: 1, sessionId: 's', iat: 0, exp: 0 } as never);
      usersService.findOne.mockResolvedValue(null as never);

      const result = await gateway.getClient(client as never);

      expect(result).toBeNull();
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('returns the user with a default history fallback on success', async () => {
      const client = createMockClient({ handshake: { headers: { cookie: 'accessToken=good-token' } } });
      tokenService.verifyAccessToken.mockResolvedValue({ userId: 1, sessionId: 's', iat: 0, exp: 0 } as never);
      usersService.findOne.mockResolvedValue({ id: 1, Username: 'tester', history: null } as never);

      const result = await gateway.getClient(client as never);

      expect(result).toEqual({
        id: 1,
        Username: 'tester',
        history: { gamesWon: 0, gamesLost: 0, totalScore: 0 },
      });
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('handleConnection rejects unauthenticated sockets without joining any room', async () => {
      const client = createMockClient({ handshake: { headers: { cookie: '' } } });

      await gateway.handleConnection(client as never);

      expect(client.disconnect).toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
      expect(redisService.addOnlineUser).not.toHaveBeenCalled();
    });

    it('handleConnection joins the user room and broadcasts online users when newly added', async () => {
      const client = createMockClient({ handshake: { headers: { cookie: 'accessToken=good-token' } } });
      tokenService.verifyAccessToken.mockResolvedValue({ userId: 1, sessionId: 's', iat: 0, exp: 0 } as never);
      usersService.findOne.mockResolvedValue(fakeUser as never);
      redisService.addOnlineUser.mockResolvedValue(true);
      redisService.getOnlineUsers.mockResolvedValue([fakeUser] as never);

      await gateway.handleConnection(client as never);

      expect(client.join).toHaveBeenCalledWith('user:1');
      expect(redisService.addOnlineUser).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
      expect(server.emit).toHaveBeenCalledWith('online-users', [fakeUser]);
    });

    it('handleConnection does not re-broadcast when the user was already online', async () => {
      const client = createMockClient({ handshake: { headers: { cookie: 'accessToken=good-token' } } });
      tokenService.verifyAccessToken.mockResolvedValue({ userId: 1, sessionId: 's', iat: 0, exp: 0 } as never);
      usersService.findOne.mockResolvedValue(fakeUser as never);
      redisService.addOnlineUser.mockResolvedValue(false);

      await gateway.handleConnection(client as never);

      expect(server.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('does nothing when the socket never authenticated', async () => {
      const client = createMockClient({ data: {} });

      await gateway.handleDisconnect(client as never);

      expect(redisService.removeOnlineUser).not.toHaveBeenCalled();
    });

    it('removes the user from presence tracking and leaves the current room', async () => {
      const client = createMockClient({ data: { user: fakeUser, roomId: 'room-1' } });
      redisService.getOnlineUsers.mockResolvedValue([] as never);
      roomService.getPlayerCount.mockResolvedValue(0);
      roomService.findOne.mockResolvedValue({ id: 'room-1', status: RoomStatus.WAITING } as never);

      await gateway.handleDisconnect(client as never);

      expect(redisService.removeOnlineUser).toHaveBeenCalledWith(1);
      expect(server.emit).toHaveBeenCalledWith('online-users', []);
      expect(roomService.removeUserFromRoom).toHaveBeenCalledWith('room-1', 1);
      expect(client.leave).toHaveBeenCalledWith('room-1');
    });
  });

  describe('get-online-users', () => {
    it('fetches and broadcasts the online users list', async () => {
      const client = createMockClient();
      redisService.getOnlineUsers.mockResolvedValue(['a', 'b'] as never);

      await gateway.getOnlineUsers(client as never);

      expect(server.emit).toHaveBeenCalledWith('online-users', ['a', 'b']);
    });
  });

  describe('handleJoinRoom', () => {
    it('creates a fresh room when no invite is supplied and starts no countdown for a single player', async () => {
      const client = createMockClient({ data: { user: fakeUser } });
      roomService.createRoom.mockResolvedValue({ roomId: 'room-1', status: RoomStatus.WAITING } as never);
      roomService.addUserToRoom.mockResolvedValue(undefined as never);
      roomService.getPlayerCount.mockResolvedValue(1);

      await gateway.handleJoinRoom(client as never, undefined);

      expect(roomService.createRoom).toHaveBeenCalledWith(1);
      expect(redisService.set).toHaveBeenCalledWith('game:room-1:1', expect.any(String));
      expect(client.join).toHaveBeenCalledWith('room-1');
      expect(roomService.addUserToRoom).toHaveBeenCalledWith('room-1', 1, 'socket-1');
      expect(roomEmit).toHaveBeenCalledWith('room-update', {
        roomId: 'room-1',
        roomStatus: RoomStatus.WAITING,
        players: 1,
      });
      expect(gameEnginService.startGame).not.toHaveBeenCalled();
    });

    it('joins an existing waiting invited room instead of creating a new one', async () => {
      const client = createMockClient({ data: { user: fakeUser } });
      roomService.findOne.mockResolvedValue({ id: 'invite-room', status: RoomStatus.WAITING, maxUsers: 4 } as never);
      roomService.getPlayerCount.mockResolvedValue(1);
      roomService.addUserToRoom.mockResolvedValue(undefined as never);

      await gateway.handleJoinRoom(client as never, { roomId: 'invite-room' });

      expect(roomService.createRoom).not.toHaveBeenCalled();
      expect(client.join).toHaveBeenCalledWith('invite-room');
      expect(roomService.addUserToRoom).toHaveBeenCalledWith('invite-room', 1, 'socket-1');
    });

    it('falls back to creating a room when the invited room is already full', async () => {
      const client = createMockClient({ data: { user: fakeUser } });
      roomService.findOne.mockResolvedValue({ id: 'invite-room', status: RoomStatus.WAITING, maxUsers: 2 } as never);
      roomService.getPlayerCount.mockResolvedValue(2);
      roomService.createRoom.mockResolvedValue({ roomId: 'new-room', status: RoomStatus.WAITING } as never);

      await gateway.handleJoinRoom(client as never, { roomId: 'invite-room' });

      expect(roomService.createRoom).toHaveBeenCalledWith(1);
      expect(client.join).toHaveBeenCalledWith('new-room');
    });

    it('starts a countdown once a second player joins', async () => {
      jest.useFakeTimers();
      const client = createMockClient({ data: { user: fakeUser } });
      roomService.createRoom.mockResolvedValue({ roomId: 'room-2', status: RoomStatus.WAITING } as never);
      roomService.getPlayerCount.mockResolvedValue(2);
      roomService.setStatus.mockResolvedValue(undefined as never);

      await gateway.handleJoinRoom(client as never, undefined);

      expect(roomEmit).toHaveBeenCalledWith('room-update', {
        roomId: 'room-2',
        roomStatus: 'STARTING',
        players: 2,
      });
      expect(roomEmit).toHaveBeenCalledWith('room-countdown', { roomId: 'room-2', seconds: 5 });
      expect(gameEnginService.startGame).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(5000);

      expect(roomService.setStatus).toHaveBeenCalledWith('room-2', RoomStatus.PLAYING);
      expect(gameEnginService.startGame).toHaveBeenCalledWith('room-2');
    });

    it('starts the game immediately once the room reaches the max player count', async () => {
      const client = createMockClient({ data: { user: fakeUser } });
      roomService.createRoom.mockResolvedValue({ roomId: 'room-3', status: RoomStatus.WAITING } as never);
      roomService.getPlayerCount.mockResolvedValue(4);
      roomService.setStatus.mockResolvedValue(undefined as never);

      await gateway.handleJoinRoom(client as never, undefined);

      expect(roomService.setStatus).toHaveBeenCalledWith('room-3', RoomStatus.PLAYING);
      expect(gameEnginService.startGame).toHaveBeenCalledWith('room-3');
    });

    it('authenticates the socket first when it has not authenticated yet', async () => {
      const client = createMockClient({
        data: {},
        handshake: { headers: { cookie: 'accessToken=good-token' } },
      });
      tokenService.verifyAccessToken.mockResolvedValue({ userId: 1, sessionId: 's', iat: 0, exp: 0 } as never);
      usersService.findOne.mockResolvedValue(fakeUser as never);
      roomService.createRoom.mockResolvedValue({ roomId: 'room-4', status: RoomStatus.WAITING } as never);
      roomService.getPlayerCount.mockResolvedValue(1);

      await gateway.handleJoinRoom(client as never, undefined);

      expect(roomService.createRoom).toHaveBeenCalledWith(1);
    });

    it('does nothing when the socket cannot be authenticated', async () => {
      const client = createMockClient({ data: {}, handshake: { headers: { cookie: '' } } });

      await gateway.handleJoinRoom(client as never, undefined);

      expect(roomService.createRoom).not.toHaveBeenCalled();
    });
  });

  describe('handleRematch', () => {
    it('does nothing without a roomId in the payload', async () => {
      const client = createMockClient({ data: { user: fakeUser } });

      await gateway.handleRematch(client as never, {} as never);

      expect(roomService.createDedicatedRoom).not.toHaveBeenCalled();
    });

    it('creates a dedicated room on the first rematch request and reuses it on the next', async () => {
      const client = createMockClient({ data: { user: fakeUser } });
      roomService.createDedicatedRoom.mockResolvedValue({ roomId: 'new-room', status: RoomStatus.WAITING } as never);
      roomService.getPlayerCount.mockResolvedValue(1);

      await gateway.handleRematch(client as never, { roomId: 'orig-room' });

      expect(roomService.createDedicatedRoom).toHaveBeenCalledWith(1);
      expect(client.join).toHaveBeenCalledWith('new-room');

      // second player requesting a rematch for the same original room should join the same new room
      const secondClient = createMockClient({ id: 'socket-2', data: { user: { ...fakeUser, id: 2 } } });
      roomService.findOne.mockResolvedValue({ id: 'new-room', status: RoomStatus.WAITING, maxUsers: 4 } as never);

      await gateway.handleRematch(secondClient as never, { roomId: 'orig-room' });

      expect(roomService.createDedicatedRoom).toHaveBeenCalledTimes(1);
      expect(secondClient.join).toHaveBeenCalledWith('new-room');
    });
  });

  describe('handleRoomInvite', () => {
    it('does nothing when the payload is missing required fields', async () => {
      const client = createMockClient({ data: { user: fakeUser } });

      await gateway.handleRoomInvite(client as never, {} as never);

      expect(roomService.findOne).not.toHaveBeenCalled();
    });

    it('does nothing when the target room does not exist', async () => {
      const client = createMockClient({ data: { user: fakeUser } });
      roomService.findOne.mockResolvedValue(null as never);

      await gateway.handleRoomInvite(client as never, { roomId: 'room-1', toUserId: 5 });

      expect(roomEmit).not.toHaveBeenCalled();
    });

    it('emits a room-invite event to the invited user room', async () => {
      const client = createMockClient({ data: { user: fakeUser } });
      roomService.findOne.mockResolvedValue({ id: 'room-1', status: RoomStatus.WAITING } as never);

      await gateway.handleRoomInvite(client as never, { roomId: 'room-1', toUserId: 5 });

      expect(server.to).toHaveBeenCalledWith('user:5');
      expect(roomEmit).toHaveBeenCalledWith('room-invite', {
        roomId: 'room-1',
        from: { id: 1, Username: 'tester' },
      });
    });
  });

  describe('handlePlayAI', () => {
    it('creates a solo room stocked with the requested bots and starts the game', async () => {
      const client = createMockClient({ data: { user: fakeUser } });
      usersService.getOrCreateBots.mockResolvedValue([{ id: 101 }, { id: 102 }] as never);
      roomService.createSoloRoom.mockResolvedValue({ roomId: 'solo-room', status: RoomStatus.PLAYING } as never);
      roomService.getPlayerCount.mockResolvedValue(3);

      await gateway.handlePlayAI(client as never, { level: 2 });

      expect(usersService.getOrCreateBots).toHaveBeenCalledWith(2);
      expect(roomService.createSoloRoom).toHaveBeenCalledWith(1, 3);
      expect(client.join).toHaveBeenCalledWith('solo-room');
      expect(roomService.addUserToRoom).toHaveBeenCalledWith('solo-room', 1, 'socket-1');
      expect(roomService.addUserToRoom).toHaveBeenCalledWith('solo-room', 101, '');
      expect(roomService.addUserToRoom).toHaveBeenCalledWith('solo-room', 102, '');
      expect(roomEmit).toHaveBeenCalledWith('room-update', {
        roomId: 'solo-room',
        roomStatus: RoomStatus.PLAYING,
        players: 3,
      });
      expect(gameEnginService.startGame).toHaveBeenCalledWith('solo-room');
    });

    it('clamps an out-of-range bot level before requesting bots', async () => {
      const client = createMockClient({ data: { user: fakeUser } });
      usersService.getOrCreateBots.mockResolvedValue([] as never);
      roomService.createSoloRoom.mockResolvedValue({ roomId: 'solo-room-2', status: RoomStatus.PLAYING } as never);
      roomService.getPlayerCount.mockResolvedValue(1);

      await gateway.handlePlayAI(client as never, { level: 99 });

      expect(usersService.getOrCreateBots).toHaveBeenCalledWith(4);
      expect(roomService.createSoloRoom).toHaveBeenCalledWith(1, 5);
    });
  });

  describe('handleLeaveRoom / leaveCurrentRoom', () => {
    it('does nothing when the client is not in a room', async () => {
      const client = createMockClient({ data: { user: fakeUser } });

      await gateway.handleLeaveRoom(client as never);

      expect(roomService.removeUserFromRoom).not.toHaveBeenCalled();
    });

    it('removes the user from the room, leaves the socket room and clears redis state', async () => {
      const client = createMockClient({ data: { user: fakeUser, roomId: 'room-1' } });
      roomService.getPlayerCount.mockResolvedValue(0);
      roomService.findOne.mockResolvedValue({ id: 'room-1', status: RoomStatus.WAITING } as never);

      await gateway.handleLeaveRoom(client as never);

      expect(roomService.removeUserFromRoom).toHaveBeenCalledWith('room-1', 1);
      expect(client.leave).toHaveBeenCalledWith('room-1');
      expect(redisService.del).toHaveBeenCalledWith('game:room-1:1');
      expect(client.data.roomId).toBeUndefined();
      expect(roomEmit).toHaveBeenCalledWith('room-update', {
        roomId: 'room-1',
        roomStatus: RoomStatus.WAITING,
        players: 0,
      });
    });

    it('still leaves and cleans up redis state when removeUserFromRoom throws', async () => {
      const client = createMockClient({ data: { user: fakeUser, roomId: 'room-1' } });
      roomService.removeUserFromRoom.mockRejectedValue(new Error('db down'));
      roomService.getPlayerCount.mockResolvedValue(0);
      roomService.findOne.mockResolvedValue({ id: 'room-1', status: RoomStatus.WAITING } as never);

      await expect(gateway.handleLeaveRoom(client as never)).resolves.not.toThrow();

      expect(client.leave).toHaveBeenCalledWith('room-1');
      expect(redisService.del).toHaveBeenCalledWith('game:room-1:1');
    });
  });

  describe('handleChangeDirection', () => {
    it('returns success:false when the room/game does not exist', () => {
      gameEnginService.getGame.mockReturnValue(undefined);

      const result = gateway.handleChangeDirection({ roomId: 'missing', userId: 1, direction: 'UP' });

      expect(result).toEqual({ success: false });
      expect(gameEnginService.queueDirection).not.toHaveBeenCalled();
    });

    it('returns success:false when the user has no snake in the room', () => {
      gameEnginService.getGame.mockReturnValue({ snakes: [{ userId: 99 }] } as never);

      const result = gateway.handleChangeDirection({ roomId: 'room-1', userId: 1, direction: 'UP' });

      expect(result).toEqual({ success: false });
    });

    it('queues the direction change and returns success:true', () => {
      gameEnginService.getGame.mockReturnValue({ snakes: [{ userId: 1 }] } as never);

      const result = gateway.handleChangeDirection({ roomId: 'room-1', userId: 1, direction: 'DOWN' });

      expect(gameEnginService.queueDirection).toHaveBeenCalledWith('room-1', 1, 'DOWN');
      expect(result).toEqual({ success: true });
    });
  });

  describe('broadcastGameState', () => {
    it('emits the game-state event to the room', () => {
      const state = { roomId: 'room-1', tick: 1 };

      gateway.broadcastGameState('room-1', state as never);

      expect(server.to).toHaveBeenCalledWith('room-1');
      expect(roomEmit).toHaveBeenCalledWith('game-state', state);
    });
  });

  describe('refreshOnlineUsers', () => {
    it('refreshes presence for each resolvable user and broadcasts the online list', async () => {
      usersService.findOne.mockImplementation((id: number) =>
        (id === 1 ? Promise.resolve({ id: 1, Username: 'a', history: null }) : Promise.resolve(null)) as never,
      );
      redisService.getOnlineUsers.mockResolvedValue(['online'] as never);

      await gateway.refreshOnlineUsers([1, 2]);

      expect(redisService.refreshOnlineUser).toHaveBeenCalledTimes(1);
      expect(redisService.refreshOnlineUser).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, history: { gamesWon: 0, gamesLost: 0, totalScore: 0 } }),
      );
      expect(server.emit).toHaveBeenCalledWith('online-users', ['online']);
    });
  });

  describe('onGameFinished', () => {
    it('clears started/countdown state so a later leave no longer eliminates the player', async () => {
      const client = createMockClient({ data: { user: fakeUser } });
      roomService.createRoom.mockResolvedValue({ roomId: 'room-5', status: RoomStatus.WAITING } as never);
      roomService.getPlayerCount.mockResolvedValue(4);
      roomService.setStatus.mockResolvedValue(undefined as never);

      await gateway.handleJoinRoom(client as never, undefined);
      expect(gameEnginService.startGame).toHaveBeenCalledWith('room-5');

      const leaver = createMockClient({ id: 'socket-9', data: { user: fakeUser, roomId: 'room-5' } });
      roomService.findOne.mockResolvedValue({ id: 'room-5', status: RoomStatus.PLAYING } as never);
      await gateway.handleLeaveRoom(leaver as never);
      expect(gameEnginService.eliminatePlayer).toHaveBeenCalledWith('room-5', 1);

      gateway.onGameFinished('room-5');
      gameEnginService.eliminatePlayer.mockClear();

      const secondLeaver = createMockClient({ id: 'socket-10', data: { user: fakeUser, roomId: 'room-5' } });
      await gateway.handleLeaveRoom(secondLeaver as never);
      expect(gameEnginService.eliminatePlayer).not.toHaveBeenCalled();
    });

    it('clears the rematch mapping so the original room can be rematched again', async () => {
      const client = createMockClient({ data: { user: fakeUser } });
      roomService.createDedicatedRoom.mockResolvedValue({ roomId: 'new-room', status: RoomStatus.WAITING } as never);
      roomService.getPlayerCount.mockResolvedValue(1);

      await gateway.handleRematch(client as never, { roomId: 'orig-room' });
      expect(roomService.createDedicatedRoom).toHaveBeenCalledTimes(1);

      gateway.onGameFinished('new-room');

      const secondClient = createMockClient({ id: 'socket-2', data: { user: fakeUser } });
      await gateway.handleRematch(secondClient as never, { roomId: 'orig-room' });

      expect(roomService.createDedicatedRoom).toHaveBeenCalledTimes(2);
    });
  });
});
