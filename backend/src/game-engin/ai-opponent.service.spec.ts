import { Test, TestingModule } from '@nestjs/testing';
import { AiOpponentService } from './ai-opponent.service';
import {
  GameStateType,
  SnakeType,
  FoodType,
  PositionType,
} from 'src/types/Game.engin.interface';

function makeSnake(overrides: Partial<SnakeType> = {}): SnakeType {
  return {
    userId: 1,
    body: [{ x: 2, y: 2 }],
    direction: 'RIGHT',
    newDirection: null,
    newPosition: null,
    willGrow: false,
    alive: true,
    score: 0,
    color: '#22c55e',
    player: 'BOT',
    pendingKindIndex: null,
    ...overrides,
  };
}

function makeFood(position: PositionType, eaten = false): FoodType {
  return { position, kindIndex: 0, value: 1, eaten };
}

function makeGame(overrides: Partial<GameStateType> = {}): GameStateType {
  return {
    roomId: 'room-1',
    snakes: [],
    food: [],
    status: 'running',
    tick: 0,
    gridWidth: 5,
    gridHeight: 5,
    winnerId: null,
    botPresent: true,
    moveIntervalMs: 150,
    ...overrides,
  };
}

describe('AiOpponentService', () => {
  let service: AiOpponentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiOpponentService],
    }).compile();

    service = module.get<AiOpponentService>(AiOpponentService);
  });

  describe('createMap', () => {
    it('marks all cells as open ("0") when there is nothing on the board', () => {
      const game = makeGame({ gridWidth: 3, gridHeight: 3, snakes: [], food: [] });

      const map = service.createMap(game);

      expect(map.length).toBe(3);
      expect(map[0].length).toBe(3);
      for (let x = 0; x < 3; x++)
        for (let y = 0; y < 3; y++)
          expect(map[x][y]).toBe('0');
    });

    it('marks every snake body cell across all snakes as blocked ("1")', () => {
      const snakeA = makeSnake({ userId: 1, body: [{ x: 0, y: 0 }, { x: 1, y: 0 }] });
      const snakeB = makeSnake({ userId: 2, body: [{ x: 2, y: 2 }] });
      const game = makeGame({ snakes: [snakeA, snakeB], food: [] });

      const map = service.createMap(game);

      expect(map[0][0]).toBe('1');
      expect(map[1][0]).toBe('1');
      expect(map[2][2]).toBe('1');
      expect(map[4][4]).toBe('0');
    });

    it('marks uneaten food as "F" but leaves eaten food untouched', () => {
      const game = makeGame({
        snakes: [],
        food: [makeFood({ x: 3, y: 3 }, false), makeFood({ x: 1, y: 1 }, true)],
      });

      const map = service.createMap(game);

      expect(map[3][3]).toBe('F');
      expect(map[1][1]).toBe('0');
    });
  });

  describe('newBotDirection', () => {
    it('steps toward reachable food via the shortest path', () => {
      const snake = makeSnake({ body: [{ x: 2, y: 2 }] });
      const game = makeGame({
        gridWidth: 5,
        gridHeight: 5,
        snakes: [snake],
        food: [makeFood({ x: 4, y: 2 })],
      });
      const map = service.createMap(game);

      const dir = service.newBotDirection(snake, map);

      expect(dir).toBe('RIGHT');
    });

    it('steps toward food above the head', () => {
      const snake = makeSnake({ body: [{ x: 2, y: 2 }] });
      const game = makeGame({
        gridWidth: 5,
        gridHeight: 5,
        snakes: [snake],
        food: [makeFood({ x: 2, y: 0 })],
      });
      const map = service.createMap(game);

      const dir = service.newBotDirection(snake, map);

      expect(dir).toBe('UP');
    });

    it('falls back to a random valid neighbour when no food is reachable', () => {
      // Head at (2,2); block the LEFT neighbour so the fallback (which tries
      // left, right, down, up in that order) must skip to RIGHT.
      const snake = makeSnake({ body: [{ x: 2, y: 2 }] });
      const game = makeGame({
        gridWidth: 5,
        gridHeight: 5,
        snakes: [snake, makeSnake({ userId: 2, body: [{ x: 1, y: 2 }] })],
        food: [],
      });
      const map = service.createMap(game);

      const dir = service.newBotDirection(snake, map);

      expect(dir).toBe('RIGHT');
    });

    it('avoids walking off the grid when a boundary neighbour is invalid', () => {
      // Head at the top-left corner; LEFT (x=-1) is off-grid so the fallback
      // must pick RIGHT instead.
      const snake = makeSnake({ body: [{ x: 0, y: 0 }] });
      const game = makeGame({
        gridWidth: 3,
        gridHeight: 3,
        snakes: [snake],
        food: [],
      });
      const map = service.createMap(game);

      const dir = service.newBotDirection(snake, map);

      expect(dir).toBe('RIGHT');
    });

    it('documents current behaviour when the bot is fully boxed in: it still returns a direction, even though that cell is blocked', () => {
      // Head at (1,1) on a 3x3 grid with all four neighbours blocked.
      // nextRandom() has no valid neighbour to offer and falls back to
      // returning {x: head.x - 1, y: head.y} unconditionally, which
      // cellToDir() reports as 'LEFT' even though that cell is occupied.
      // This isn't being treated as a bug to fix - a fully trapped bot has
      // no non-lethal move available anyway - but it's worth pinning down.
      const snake = makeSnake({ userId: 1, body: [{ x: 1, y: 1 }] });
      const blockers = makeSnake({
        userId: 2,
        body: [
          { x: 0, y: 1 },
          { x: 2, y: 1 },
          { x: 1, y: 0 },
          { x: 1, y: 2 },
        ],
      });
      const game = makeGame({
        gridWidth: 3,
        gridHeight: 3,
        snakes: [snake, blockers],
        food: [],
      });
      const map = service.createMap(game);

      const dir = service.newBotDirection(snake, map);

      expect(dir).toBe('LEFT');
    });
  });
});
