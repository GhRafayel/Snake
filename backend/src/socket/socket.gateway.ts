import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomStatus } from '@prisma/client';
import { GameRoomService } from 'src/gameRoom/gameRoom.service';
import { RedisService } from 'src/redis/redis.service';
import { CreateSnake } from 'src/types/interface';
import { Direction , GameState} from "src/types/interface"
import { TokenService } from 'src/auth/token/token.service';
import { UsersService } from 'src/users/users.service';
import { LoggerService } from 'src/logger/logger.service';
import { GameEnginService } from 'src/game-engin/game-engin.service';

interface changeDirectionPayload {
	direction: Direction;
	roomId: string;
	userId: number;
}

interface BOTPayload { level?: number; }

interface JoinRoomPayload { roomId?: string; }

interface RematchPayload { roomId: string; }

interface RoomInvitePayload {
	roomId: string;
	toUserId: number;
}

const MIN_BOT_LEVEL = 1;
const MAX_BOT_LEVEL = 4;

function clampBotLevel(level: unknown): number {
	const n = Number(level);
	if (!Number.isFinite(n))
		return MIN_BOT_LEVEL;
	return Math.min(MAX_BOT_LEVEL, Math.max(MIN_BOT_LEVEL, Math.floor(n)));
}

@WebSocketGateway(2000, {
  cors: { origin: true, credentials: true },
  perMessageDeflate: false,
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server!: Server;

  afterInit(server: Server) {
    server.httpServer.on('connection', (socket) => socket.setNoDelay(true));
  }

  constructor(
    private readonly roomService: GameRoomService,
    private readonly redisService: RedisService,
    private readonly tokenService : TokenService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => GameEnginService)) private readonly gameEnginService: GameEnginService,
  ) {}
      private readonly logger = new LoggerService(SocketGateway.name);

    // redis updata command (        redis-cli FLUSHALL        )

    private roomOpQueues = new Map<string, Promise<unknown>>();

    private runRoomOp<T>(client: Socket, fn: () => Promise<T>): Promise<T> {
      const previous = this.roomOpQueues.get(client.id) ?? Promise.resolve();
      const result = previous.then(fn, fn);
      this.roomOpQueues.set(client.id, result.catch(() => undefined));
      return result;
    }

    private readonly MAX_PLAYERS = 4;
    private readonly COUNTDOWN_SECONDS = 5;
    private roomCountdowns = new Map<string, ReturnType<typeof setTimeout>>();
    private startedRooms = new Set<string>();
    // finished roomId -> the new room its former players should rejoin on rematch
    private rematchRooms = new Map<string, string>();

    private clearCountdown(roomId: string) {
      const timer = this.roomCountdowns.get(roomId);
      if (timer) {
        clearTimeout(timer);
        this.roomCountdowns.delete(roomId);
      }
    }

    private effectiveRoomStatus(roomId: string, dbStatus: RoomStatus): string {
      if (this.startedRooms.has(roomId)) return RoomStatus.PLAYING;
      if (this.roomCountdowns.has(roomId)) return 'STARTING';
      return dbStatus;
    }

    private async beginGame(roomId: string) {
      this.clearCountdown(roomId);
      if (this.startedRooms.has(roomId)) return;
      const players = await this.roomService.getPlayerCount(roomId);
      if (players < 2) return;

      this.startedRooms.add(roomId);
      await this.roomService.setStatus(roomId, RoomStatus.PLAYING);
      this.server.to(roomId).emit('room-update', {
        roomId,
        roomStatus: RoomStatus.PLAYING,
        players,
      });
      await this.gameEnginService.startGame(roomId);
    }

    private async scheduleOrStartGame(roomId: string, players: number) {
      if (this.startedRooms.has(roomId)) return;

      if (players >= this.MAX_PLAYERS) {
        await this.beginGame(roomId);
        return;
      }

      if (players > 1 && !this.roomCountdowns.has(roomId)) {
        this.server.to(roomId).emit('room-update', {
          roomId,
          roomStatus: 'STARTING',
          players,
        });
        this.server.to(roomId).emit('room-countdown', { roomId, seconds: this.COUNTDOWN_SECONDS });
        const timer = setTimeout(() => {
          this.roomCountdowns.delete(roomId);
          this.beginGame(roomId).catch((err) =>
            this.logger.error(`Failed to start room ${roomId}: ${err}`),
          );
        }, this.COUNTDOWN_SECONDS * 1000);
        this.roomCountdowns.set(roomId, timer);
      }
    }
    
    onGameFinished(roomId: string) {
      this.clearCountdown(roomId);
      this.startedRooms.delete(roomId);
      for (const [oldRoomId, newRoomId] of this.rematchRooms) {
        if (newRoomId === roomId) this.rematchRooms.delete(oldRoomId);
      }
    }

    async refreshOnlineUsers(userIds: number[]) {
      for (const userId of userIds) {
        const user = await this.usersService.findOne(userId);
        if (!user) continue;
        await this.redisService.refreshOnlineUser({
          ...user,
          history: user.history ?? { gamesWon: 0, gamesLost: 0, totalScore: 0 },
        });
      }
      const onlineUsers = await this.redisService.getOnlineUsers();
      this.server.emit('online-users', onlineUsers);
    }

    async getClient(client: Socket) {
      const cookie = client.handshake.headers.cookie ?? "";
      const accessToken = cookie.split(";").map((c) => c.trim())
      .find((c) => c.startsWith("accessToken="))?.slice("accessToken=".length);

      if (!accessToken) {
        client.disconnect();
        return null;
      }
      const payload = await this.tokenService.verifyAccessToken(accessToken);
      const user = await this.usersService.findOne(payload.userId);
      if (!user) {
        client.disconnect();
        return null;
      }
      return {
        ...user,
        history: user.history ?? { gamesWon: 0, gamesLost: 0, totalScore: 0 },
      };
    }

    async handleConnection(client: Socket) {
      const user = await this.getClient(client);
      if (!user) {
        this.logger.warn(`Rejected socket connection ${client.id}: unauthenticated`);
        client.disconnect();
        return ;
      }
      client.data.user = user;
      await client.join(`user:${user.id}`);
      this.logger.log(`Socket connected: user ${user.id} (${client.id})`);
      const addedUser = await this.redisService.addOnlineUser(user);
      if (addedUser)
        await this.getOnlineUsers(client);
    }

    async handleDisconnect(client: Socket) {
      try {
        if (!client.data.user) return;
        this.logger.log(`Socket disconnected: user ${client.data.user.id} (${client.id})`);
        await this.redisService.removeOnlineUser(client.data.user.id);
        await this.getOnlineUsers(client)

        await this.runRoomOp(client, () => this.leaveCurrentRoom(client));
      } finally {
        this.roomOpQueues.delete(client.id);
      }
    }

    @SubscribeMessage("get-online-users")
      async getOnlineUsers(client: Socket) {
        this.logger.log(`get-online-users requested by ${client.id}`);
        const onlineUsers = await this.redisService.getOnlineUsers();
        this.server.emit("online-users", onlineUsers);
    }

    @SubscribeMessage('join-room')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data?: JoinRoomPayload) {
      return this.runRoomOp(client, async () => {
        this.logger.log(`join-room requested by ${client.id}`);

        if (client.data.user === undefined)
          client.data.user = await  this.getClient(client);

        await this.leaveCurrentRoom(client);

        const invitedRoom = data?.roomId ? await this.roomService.findOne(data.roomId) : null;
        const invitedRoomPlayers = invitedRoom ? await this.roomService.getPlayerCount(invitedRoom.id) : 0;
        const canJoinInvitedRoom = !!invitedRoom
          && invitedRoom.status === RoomStatus.WAITING
          && invitedRoomPlayers < invitedRoom.maxUsers;

        const room = canJoinInvitedRoom
          ? { roomId: invitedRoom!.id, status: invitedRoom!.status }
          : await this.roomService.createRoom(client.data.user.id);
        client.data.roomId = room.roomId;

        await this.redisService.set(`game:${room.roomId}:${client.data.user.id}`,
        JSON.stringify(CreateSnake(client.data.user.id)))
        await client.join(room.roomId);

        await this.roomService.addUserToRoom(room.roomId, client.data.user.id, client.id);
        const players = await this.roomService.getPlayerCount(client.data.roomId);
        this.logger.log(`User ${client.data.user.id} joined room ${room.roomId}`);
        this.server.to(client.data.roomId).emit('room-update', {
          roomId: room.roomId,
          roomStatus: this.effectiveRoomStatus(room.roomId, room.status),
          players,
        });

        await this.scheduleOrStartGame(room.roomId, players);
      });
    }

    @SubscribeMessage('rematch')
    handleRematch(@ConnectedSocket() client: Socket, @MessageBody() data: RematchPayload) {
      return this.runRoomOp(client, async () => {
        this.logger.log(`rematch requested by ${client.id}`);

        if (client.data.user === undefined)
          client.data.user = await this.getClient(client);
        if (!client.data.user || !data?.roomId) return;

        await this.leaveCurrentRoom(client);

        const targetRoomId = this.rematchRooms.get(data.roomId);
        const targetRoom = targetRoomId ? await this.roomService.findOne(targetRoomId) : null;
        const targetPlayers = targetRoom ? await this.roomService.getPlayerCount(targetRoom.id) : 0;
        const canJoinTarget = !!targetRoom
          && targetRoom.status === RoomStatus.WAITING
          && targetPlayers < targetRoom.maxUsers;

        const room = canJoinTarget
          ? { roomId: targetRoom!.id, status: targetRoom!.status }
          : await this.roomService.createDedicatedRoom(client.data.user.id);

        this.rematchRooms.set(data.roomId, room.roomId);
        client.data.roomId = room.roomId;

        await this.redisService.set(`game:${room.roomId}:${client.data.user.id}`,
        JSON.stringify(CreateSnake(client.data.user.id)))
        await client.join(room.roomId);

        await this.roomService.addUserToRoom(room.roomId, client.data.user.id, client.id);
        const players = await this.roomService.getPlayerCount(room.roomId);
        this.logger.log(`User ${client.data.user.id} joined rematch room ${room.roomId}`);
        this.server.to(room.roomId).emit('room-update', {
          roomId: room.roomId,
          roomStatus: this.effectiveRoomStatus(room.roomId, room.status),
          players,
        });

        await this.scheduleOrStartGame(room.roomId, players);
      });
    }

    @SubscribeMessage('room-invite')
    async handleRoomInvite(@ConnectedSocket() client: Socket, @MessageBody() data: RoomInvitePayload) {
      if (client.data.user === undefined)
        client.data.user = await this.getClient(client);
      if (!client.data.user || !data?.roomId || !data?.toUserId) return;

      const room = await this.roomService.findOne(data.roomId);
      if (!room) return;

      this.logger.log(`User ${client.data.user.id} invited user ${data.toUserId} to room ${data.roomId}`);
      this.server.to(`user:${data.toUserId}`).emit('room-invite', {
        roomId: data.roomId,
        from: { id: client.data.user.id, Username: client.data.user.Username },
      });
    }

    @SubscribeMessage('play-AI')
    handlePlayAI(@ConnectedSocket() client: Socket, @MessageBody() data?: BOTPayload) {
      return this.runRoomOp(client, async () => {
        this.logger.log(`play-AI requested by ${client.id}`);

        if (client.data.user === undefined)
          client.data.user = await this.getClient(client);
        if (!client.data.user) return;

        await this.leaveCurrentRoom(client);

        const level = clampBotLevel(data?.level);
        const bots = await this.usersService.getOrCreateBots(level);
        const room = await this.roomService.createSoloRoom(client.data.user.id, level + 1);
        client.data.roomId = room.roomId;

        await client.join(room.roomId);
        await this.roomService.addUserToRoom(room.roomId, client.data.user.id, client.id);
        for (const bot of bots)
          await this.roomService.addUserToRoom(room.roomId, bot.id, '');

        const players = await this.roomService.getPlayerCount(room.roomId);
        this.logger.log(`User ${client.data.user.id} started a vs-AI match (level ${level}) in room ${room.roomId}`);
        this.server.to(room.roomId).emit('room-update', {
          roomId: room.roomId,
          roomStatus: room.status,
          players,
        });

        await this.gameEnginService.startGame(room.roomId);
      });
    }

    @SubscribeMessage('leave-room')
    handleLeaveRoom(@ConnectedSocket() client: Socket) {
      return this.runRoomOp(client, () => this.leaveCurrentRoom(client));
    }

    private async leaveCurrentRoom(client: Socket) {
      const roomId = client.data.roomId;
      if (!roomId || !client.data.user) return;

      this.logger.log(`User ${client.data.user.id} leaving room ${roomId} (${client.id})`);

      if (this.startedRooms.has(roomId))
        await this.gameEnginService.eliminatePlayer(roomId, client.data.user.id);

      try {
        await this.roomService.removeUserFromRoom(roomId, client.data.user.id);
      } catch (err) {
        this.logger.error(`Failed to remove user ${client.data.user.id} from room ${roomId}: ${err}`);
      } finally {
        await client.leave(roomId);
        await this.redisService.del(`game:${roomId}:${client.data.user.id}`);

        client.data.roomId = undefined;

        const players = await this.roomService.getPlayerCount(roomId);
        if (!this.startedRooms.has(roomId) && players < 2)
          this.clearCountdown(roomId);

        const room = await this.roomService.findOne(roomId);
        this.server.to(roomId).emit('room-update', {
          roomId,
          roomStatus: this.effectiveRoomStatus(roomId, room?.status ?? RoomStatus.WAITING),
          players,
        });
      }
    }

    @SubscribeMessage('change-direction')
    handleChangeDirection(@MessageBody() data: changeDirectionPayload,){
      const game = this.gameEnginService.getGame(data.roomId);
      if (!game) {
        this.logger.warn(`change-direction failed: room ${data.roomId} not found`);
        return {success: false};
      }
      const snake = game.snakes.find(s => s.userId === data.userId);
      if (!snake) {
        this.logger.warn(`change-direction failed: user ${data.userId} has no snake in room ${data.roomId}`);
        return {success: false};
      }
      this.gameEnginService.queueDirection(data.roomId, data.userId, data.direction);

      return {success: true};
    }

    async broadcastGameState(roomId: string, state: GameState) {
      this.server.to(roomId).emit('game-state', state);
    }
}
