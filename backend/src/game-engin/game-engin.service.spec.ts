import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RoomStatus } from '@prisma/client';
import { GameEnginService } from './game-engin.service';
import { AiOpponentService } from './ai-opponent.service';
import { DatabaseService } from 'src/database/database.service';
import { SocketGateway } from 'src/socket/socket.gateway';
import { GameStateType, SnakeType } from 'src/types/Game.engin.interface';

jest.mock('src/logger/logger.service');

function makeSnake(overrides: Partial<SnakeType> = {}): SnakeType {
  return {
    userId: 1,
    body: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
    direction: 'RIGHT',
    newDirection: null,
    newPosition: null,
    willGrow: false,
    alive: true,
    score: 0,
    color: '#22c55e',
    player: 'PLAYER',
    pendingKindIndex: null,
    ...overrides,
  };
}

function makeGame(overrides: Partial<GameStateType> = {}): GameStateType {
  return {
    roomId: 'room-1',
    snakes: [],
    food: [],
    status: 'running',
    tick: 0,
    gridWidth: 30,
    gridHeight: 30,
    winnerId: null,
    botPresent: false,
    moveIntervalMs: 150,
    ...overrides,
  };
}

describe('GameEnginService', () => {
  let service: GameEnginService;
  let prismaService: {
    gameRoom: { findUnique: jest.Mock; update: jest.Mock };
    gameResults: { create: jest.Mock };
    users: { update: jest.Mock };
  };
  let aiBotService: { createMap: jest.Mock; newBotDirection: jest.Mock };
  let socketGateway: {
    broadcastGameState: jest.Mock;
    refreshOnlineUsers: jest.Mock;
    onGameFinished: jest.Mock;
  };

  let now: number;

  beforeEach(async () => {
    prismaService = {
      gameRoom: { findUnique: jest.fn(), update: jest.fn() },
      gameResults: { create: jest.fn() },
      users: { update: jest.fn() },
    };
    aiBotService = { createMap: jest.fn().mockReturnValue([]), newBotDirection: jest.fn() };
    socketGateway = {
      broadcastGameState: jest.fn(),
      refreshOnlineUsers: jest.fn().mockResolvedValue(undefined),
      onGameFinished: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameEnginService,
        { provide: DatabaseService, useValue: prismaService },
        { provide: AiOpponentService, useValue: aiBotService },
        { provide: SocketGateway, useValue: socketGateway },
      ],
    }).compile();

    service = module.get<GameEnginService>(GameEnginService);

    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** Directly seeds the service's internal state map, bypassing startGame/initGame. */
  function prime(game: GameStateType) {
    (service as any).games.set(game.roomId, game);
    (service as any).moveAccumulators.set(game.roomId, 0);
    (service as any).lastTickAt.set(game.roomId, now);
  }

  /** Advances the mocked clock by one moveIntervalMs and runs exactly one stepGame(). */
  async function stepOnce(game: GameStateType) {
    now += game.moveIntervalMs;
    await service.tick(game.roomId);
  }

  describe('getGame', () => {
    it('returns undefined for a room with no active game', () => {
      expect(service.getGame('missing-room')).toBeUndefined();
    });

    it('returns the stored game state for a known room', () => {
      const game = makeGame({ roomId: 'room-1' });
      prime(game);

      expect(service.getGame('room-1')).toBe(game);
    });
  });

  describe('eliminatePlayer', () => {
    it('does nothing when the room has no active game', () => {
      expect(() => service.eliminatePlayer('missing-room', 1)).not.toThrow();
    });

    it('does nothing when the game has already finished', () => {
      const snake = makeSnake({ userId: 1, alive: true });
      const game = makeGame({ roomId: 'room-1', status: 'finished', snakes: [snake] });
      prime(game);

      service.eliminatePlayer('room-1', 1);

      expect(snake.alive).toBe(true);
    });

    it('does nothing when the userId has no matching alive snake', () => {
      const snake = makeSnake({ userId: 1, alive: false });
      const game = makeGame({ roomId: 'room-1', snakes: [snake] });
      prime(game);

      service.eliminatePlayer('room-1', 1);

      expect(snake.alive).toBe(false);
    });

    it('marks the matching alive snake as dead and leaves others untouched', () => {
      const target = makeSnake({ userId: 1, alive: true });
      const other = makeSnake({ userId: 2, alive: true });
      const game = makeGame({ roomId: 'room-1', snakes: [target, other] });
      prime(game);

      service.eliminatePlayer('room-1', 1);

      expect(target.alive).toBe(false);
      expect(other.alive).toBe(true);
    });
  });

  describe('tick - movement', () => {
    it('does nothing (and stops ticking) when the room has no active game', async () => {
      const stopSpy = jest.spyOn(service as any, 'stopTicking');

      await service.tick('missing-room');

      expect(stopSpy).toHaveBeenCalledWith('missing-room');
      expect(socketGateway.broadcastGameState).not.toHaveBeenCalled();
    });

    it('is a no-op once the game has already finished', async () => {
      const game = makeGame({ roomId: 'room-1', status: 'finished' });
      prime(game);

      await stepOnce(game);

      expect(socketGateway.broadcastGameState).not.toHaveBeenCalled();
    });

    it('moves a snake forward one cell in its current direction', async () => {
      const a = makeSnake({ userId: 1, body: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], direction: 'RIGHT' });
      const b = makeSnake({ userId: 2, body: [{ x: 5, y: 20 }, { x: 4, y: 20 }, { x: 3, y: 20 }], direction: 'RIGHT' });
      const game = makeGame({ roomId: 'room-1', snakes: [a, b] });
      prime(game);

      await stepOnce(game);

      expect(a.body[0]).toEqual({ x: 6, y: 5 });
      expect(a.body.length).toBe(3);
      expect(a.direction).toBe('RIGHT');
      expect(socketGateway.broadcastGameState).toHaveBeenCalledWith('room-1', game);
      expect(game.tick).toBe(1);
    });

    it('turns the snake when a queued direction is not a reversal', async () => {
      const a = makeSnake({ userId: 1, body: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], direction: 'RIGHT' });
      const b = makeSnake({ userId: 2, body: [{ x: 5, y: 20 }, { x: 4, y: 20 }, { x: 3, y: 20 }], direction: 'RIGHT' });
      const game = makeGame({ roomId: 'room-1', snakes: [a, b] });
      prime(game);
      service.queueDirection('room-1', 1, 'DOWN');

      await stepOnce(game);

      expect(a.body[0]).toEqual({ x: 5, y: 6 });
      expect(a.direction).toBe('DOWN');
    });

    it('ignores a queued direction that would reverse the snake on itself', async () => {
      const a = makeSnake({ userId: 1, body: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], direction: 'RIGHT' });
      const b = makeSnake({ userId: 2, body: [{ x: 5, y: 20 }, { x: 4, y: 20 }, { x: 3, y: 20 }], direction: 'RIGHT' });
      const game = makeGame({ roomId: 'room-1', snakes: [a, b] });
      prime(game);
      service.queueDirection('room-1', 1, 'LEFT');

      await stepOnce(game);

      expect(a.body[0]).toEqual({ x: 6, y: 5 });
      expect(a.direction).toBe('RIGHT');
    });
  });

  describe('tick - collisions', () => {
    it('kills a snake that moves off the grid', async () => {
      const wallHitter = makeSnake({ userId: 1, body: [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }], direction: 'LEFT' });
      const survivor = makeSnake({ userId: 2, body: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }], direction: 'RIGHT' });
      const bystander = makeSnake({ userId: 3, body: [{ x: 20, y: 20 }, { x: 19, y: 20 }, { x: 18, y: 20 }], direction: 'RIGHT' });
      const game = makeGame({ roomId: 'room-1', snakes: [wallHitter, survivor, bystander] });
      prime(game);

      await stepOnce(game);

      expect(wallHitter.alive).toBe(false);
      expect(survivor.alive).toBe(true);
      expect(bystander.alive).toBe(true);
      expect(game.status).toBe('running');
    });

    it('kills a snake that runs into its own body', async () => {
   
      const looped = makeSnake({
        userId: 1,
        body: [{ x: 3, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 3 }],
        direction: 'UP',
        newDirection: null,
      });
      const bystanderA = makeSnake({ userId: 2, body: [{ x: 20, y: 20 }, { x: 19, y: 20 }, { x: 18, y: 20 }], direction: 'RIGHT' });
      const bystanderB = makeSnake({ userId: 3, body: [{ x: 10, y: 25 }, { x: 9, y: 25 }, { x: 8, y: 25 }], direction: 'RIGHT' });
      const game = makeGame({ roomId: 'room-1', snakes: [looped, bystanderA, bystanderB] });
      prime(game);

      await stepOnce(game);

      expect(looped.alive).toBe(false);
      expect(bystanderA.alive).toBe(true);
      expect(bystanderB.alive).toBe(true);
    });

    it('kills a snake that moves into another snake\'s body', async () => {
      const attacker = makeSnake({ userId: 1, body: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], direction: 'RIGHT' });
      const victim = makeSnake({ userId: 2, body: [{ x: 6, y: 5 }, { x: 6, y: 6 }, { x: 6, y: 7 }, { x: 7, y: 7 }], direction: 'UP' });
      const bystander = makeSnake({ userId: 3, body: [{ x: 20, y: 20 }, { x: 19, y: 20 }, { x: 18, y: 20 }], direction: 'RIGHT' });
      const game = makeGame({ roomId: 'room-1', snakes: [attacker, victim, bystander] });
      prime(game);

      await stepOnce(game);

      expect(attacker.alive).toBe(false);
      expect(victim.alive).toBe(true);
      expect(bystander.alive).toBe(true);
    });

    it('kills both snakes on a head-to-head collision', async () => {
      const a = makeSnake({ userId: 1, body: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], direction: 'RIGHT' });
      const b = makeSnake({ userId: 2, body: [{ x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }], direction: 'LEFT' });
      const bystanderA = makeSnake({ userId: 3, body: [{ x: 20, y: 20 }, { x: 19, y: 20 }, { x: 18, y: 20 }], direction: 'RIGHT' });
      const bystanderB = makeSnake({ userId: 4, body: [{ x: 25, y: 25 }, { x: 24, y: 25 }, { x: 23, y: 25 }], direction: 'RIGHT' });
      const game = makeGame({ roomId: 'room-1', snakes: [a, b, bystanderA, bystanderB] });
      prime(game);

      await stepOnce(game);

      expect(a.alive).toBe(false);
      expect(b.alive).toBe(false);
      expect(bystanderA.alive).toBe(true);
      expect(bystanderB.alive).toBe(true);
    });
  });

  describe('tick - food', () => {
    it('grows the snake and awards score equal to kindIndex + 1 when it eats food', async () => {
      const snake = makeSnake({ userId: 1, body: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], direction: 'RIGHT', score: 0 });
      const bystander = makeSnake({ userId: 2, body: [{ x: 20, y: 20 }, { x: 19, y: 20 }, { x: 18, y: 20 }], direction: 'RIGHT' });
      const game = makeGame({
        roomId: 'room-1',
        snakes: [snake, bystander],
        food: [{ position: { x: 6, y: 5 }, eaten: false, kindIndex: 2, value: 3 }],
      });
      prime(game);

      await stepOnce(game);

      expect(snake.alive).toBe(true);
      expect(snake.score).toBe(3);
      expect(snake.body.length).toBe(4);
      expect(snake.body[0]).toEqual({ x: 6, y: 5 });
      expect(snake.willGrow).toBe(false);
      expect(snake.pendingKindIndex).toBeNull();
      expect(game.food.length).toBe(1);
      expect(game.food[0].eaten).toBe(false);
    });

    it('does not grow or score when no food is at the new head position', async () => {
      const snake = makeSnake({ userId: 1, body: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], direction: 'RIGHT', score: 0 });
      const bystander = makeSnake({ userId: 2, body: [{ x: 20, y: 20 }, { x: 19, y: 20 }, { x: 18, y: 20 }], direction: 'RIGHT' });
      const game = makeGame({
        roomId: 'room-1',
        snakes: [snake, bystander],
        food: [{ position: { x: 29, y: 29 }, eaten: false, kindIndex: 2, value: 3 }],
      });
      prime(game);

      await stepOnce(game);

      expect(snake.score).toBe(0);
      expect(snake.body.length).toBe(3);
    });
  });

  describe('tick - game over', () => {
    it('finishes the game and assigns the sole survivor as winner, then stores results', async () => {
      const loser = makeSnake({ userId: 1, body: [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }], direction: 'LEFT' });
      const winner = makeSnake({ userId: 2, body: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }], direction: 'RIGHT' });
      const game = makeGame({ roomId: 'room-1', snakes: [loser, winner] });
      prime(game);
      const storeResultsSpy = jest.spyOn(service, 'storeResults').mockResolvedValue(undefined);

      await stepOnce(game);

      expect(game.status).toBe('finished');
      expect(game.winnerId).toBe(2);
      expect(storeResultsSpy).toHaveBeenCalledWith(game);
    });

    it('lets the bot win once every human player is eliminated', async () => {
      const player = makeSnake({ userId: 1, player: 'PLAYER', body: [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }], direction: 'LEFT' });
      const bot = makeSnake({ userId: 99, player: 'BOT', body: [{ x: 15, y: 15 }, { x: 14, y: 15 }, { x: 13, y: 15 }], direction: 'RIGHT', newDirection: 'RIGHT' });
      const game = makeGame({ roomId: 'room-1', snakes: [player, bot], botPresent: true });
      prime(game);
      aiBotService.newBotDirection.mockReturnValue('RIGHT');
      const storeResultsSpy = jest.spyOn(service, 'storeResults').mockResolvedValue(undefined);

      await stepOnce(game);

      expect(aiBotService.createMap).toHaveBeenCalledWith(game);
      expect(aiBotService.newBotDirection).toHaveBeenCalledWith(bot, expect.anything());
      expect(game.status).toBe('finished');
      expect(game.winnerId).toBe(99);
      expect(bot.alive).toBe(true);
      expect(game.snakes).toEqual([player]);
      expect(player.alive).toBe(false);
      expect(storeResultsSpy).toHaveBeenCalledWith(game);
    });
  });

  describe('startGame', () => {
    it('throws BadRequestException when the room does not exist', async () => {
      prismaService.gameRoom.findUnique.mockResolvedValue(null);

      await expect(service.startGame('missing-room')).rejects.toThrow(BadRequestException);
    });

    it('initialises game state from the room roster, broadcasts it, and starts ticking', async () => {
      jest.useFakeTimers({ doNotFake: ['nextTick'] });
      prismaService.gameRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        roomUsers: [
          { user: { id: 1, isBot: false, score: 0, color: '#111111' } },
          { user: { id: 2, isBot: true, score: 0, color: null } },
        ],
      });
      const tickSpy = jest.spyOn(service, 'tick').mockResolvedValue(undefined);

      await service.startGame('room-1');

      const game = service.getGame('room-1');
      expect(game).toBeDefined();
      expect(game!.status).toBe('running');
      expect(game!.snakes).toHaveLength(2);
      expect(game!.snakes.map((s) => s.userId)).toEqual([1, 2]);
      expect(game!.botPresent).toBe(true);
      expect(socketGateway.broadcastGameState).toHaveBeenCalledWith('room-1', game);

      jest.advanceTimersByTime(1000);
      expect(tickSpy).toHaveBeenCalledWith('room-1');

      jest.useRealTimers();
    });
  });

  describe('storeResults', () => {
    function buildFinishedGame(): GameStateType {
      const winner = makeSnake({ userId: 1, player: 'PLAYER', score: 5, alive: true });
      const loser = makeSnake({ userId: 2, player: 'PLAYER', score: 2, alive: false });
      const bot = makeSnake({ userId: 3, player: 'BOT', score: 1, alive: false });
      return makeGame({ roomId: 'room-1', status: 'finished', winnerId: 1, tick: 42, snakes: [winner, loser, bot] });
    }

    it('persists results, updates non-bot player stats, marks the room finished, and cleans up', async () => {
      const game = buildFinishedGame();
      prime(game);
      prismaService.gameResults.create.mockResolvedValue({});
      prismaService.users.update.mockResolvedValue({});
      prismaService.gameRoom.update.mockResolvedValue({});

      await service.storeResults(game);

      expect(prismaService.gameResults.create).toHaveBeenCalledWith({
        data: {
          roomId: 'room-1',
          winnerId: 1,
          ticks: 42,
          participants: {
            create: [
              { userId: 1, score: 5, alive: true },
              { userId: 2, score: 2, alive: false },
              { userId: 3, score: 1, alive: false },
            ],
          },
        },
      });

      // only non-bot snakes get a stats update
      expect(prismaService.users.update).toHaveBeenCalledTimes(2);
      expect(prismaService.users.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      expect(prismaService.users.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 2 } }),
      );

      expect(prismaService.gameRoom.update).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        data: { status: RoomStatus.FINISHED },
      });
      expect(socketGateway.refreshOnlineUsers).toHaveBeenCalledWith([1, 2]);
      expect(socketGateway.onGameFinished).toHaveBeenCalledWith('room-1');

      expect(service.getGame('room-1')).toBeUndefined();
    });

    it('still cleans up and notifies the gateway when persisting fails', async () => {
      const game = buildFinishedGame();
      prime(game);
      prismaService.gameResults.create.mockRejectedValue(new Error('db down'));

      await expect(service.storeResults(game)).resolves.toBeUndefined();

      expect(service.getGame('room-1')).toBeUndefined();
      expect(socketGateway.onGameFinished).toHaveBeenCalledWith('room-1');
    });
  });
});
