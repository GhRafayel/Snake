import { Injectable, BadRequestException, Inject, forwardRef} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { GameStateType, DirectionType, SnakeType, PositionType, FoodType, PlayerType, PlayerRoleType } from "src/types/Game.engin.interface"
import { AiOpponentService } from './ai-opponent.service';
import { RoomStatus } from "@prisma/client";
import { SocketGateway } from 'src/socket/socket.gateway';
import { LoggerService } from 'src/logger/logger.service';

const GRID_WIDTH = 30;
const GRID_HEIGHT = 30;

const MOVE_INTERVAL_MS = 150;

const TICK_MS = 50;

const MAX_CATCHUP_STEPS = 3;

const FOOD_KINDS: { emoji: string }[] = [
	{ emoji: '🍒' },
	{ emoji: '🍓' },
	{ emoji: '🍐' },
	{ emoji: '🍎' },
	{ emoji: '🥭' },
	{ emoji: '🍉' },
];

function pickFoodKind(): number {
	return Math.floor(Math.random() * FOOD_KINDS.length);
}

function isOppositeDir(next: DirectionType | null, cur: DirectionType) : boolean{
	if (next === null)
		return true;
	if (next === 'DOWN' && cur === 'UP')
		return true;
	if (next === 'UP' && cur === 'DOWN')
		return true;
	if (next === 'LEFT' && cur === 'RIGHT')
		return true;
	if (next === 'RIGHT' && cur === 'LEFT')
		return true;
	return false;
}

function comparePosition(a: PositionType, b: PositionType): boolean{
	return (a.x === b.x && a.y === b.y);
}

function spawnFood(state: GameStateType){
	let ok : boolean = false;
	let pos : PositionType = {x: 0, y: 0};
	while (!ok){
		pos = {
 			x : Math.floor(Math.random() * state.gridWidth),
			y : Math.floor(Math.random() * state.gridHeight),
		};
		ok = true;
		for (const food of state.food){
			if (comparePosition(food.position, pos)){
				ok = false;
				break;
			}
		}
		if (!ok)
			continue;
		for (const snake of state.snakes){
			for (const body of snake.body)
				if (comparePosition(body, pos)){
					ok = false;
					break;
				}
		}
	}
	const kindIndex = pickFoodKind();
	state.food.push({position: pos, eaten: false, kindIndex, value: kindIndex + 1});
}

function newHeadPosition(state: GameStateType){
	for (const snake of state.snakes){
		if (!snake.alive)
			continue;
		if (isOppositeDir(snake.newDirection, snake.direction))
			snake.newDirection = snake.direction;
		snake.newPosition = {x: snake.body[0].x, y: snake.body[0].y}; 
		if (snake.newDirection === 'UP')
			snake.newPosition.y--;
		else if (snake.newDirection === 'DOWN')
			snake.newPosition.y++;
		else if (snake.newDirection === 'LEFT')
			snake.newPosition.x--;		
		else if (snake.newDirection === 'RIGHT')
			snake.newPosition.x++;
	}
}

function checkFood(state: GameStateType){
	for (const snake of state.snakes){
		if (snake.alive === false)
			continue;
		if (snake.newPosition === null)
			continue;
		for (const food of state.food){
			if (comparePosition(snake.newPosition, food.position)){
				snake.willGrow = true;
				snake.pendingKindIndex = food.kindIndex;
				food.eaten = true;
			}
		}
	}
}

function checkCollision(state: GameStateType){
	for (const snake of state.snakes){
		if (snake.alive === false)
			continue;
		if (snake.newPosition === null)
			continue;
		let x = snake.newPosition.x;
		let y = snake.newPosition.y;
		if (x < 0 || x >= state.gridWidth)
			snake.alive = false;
		if (y < 0 || y >= state.gridHeight)
			snake.alive = false;
		for (const other of state.snakes){
			if (snake.alive === false)
				break;
			if (other !== snake){
				if (other.newPosition != null && comparePosition(other.newPosition, snake.newPosition)){
					other.alive = false;
					snake.alive = false;
					break;
				}
			}
			for (let i = 0; i < other.body.length; i++){
				const pos = other.body[i];
				const last = other.body.length - 1;
				if (comparePosition(pos, snake.newPosition)){
					if (i === last && !other.willGrow){
						continue;
					}
					snake.alive = false;
					break;
				}
			}
		}
	}
}

function updateFoodScore(state: GameStateType){
	for (let i = 0; i < state.food.length; i++){
		if (state.food[i].eaten){
			state.food.splice(i, 1);
			spawnFood(state);
			i--;
		}
	}
	for (const snake of state.snakes){
		if (!snake.alive)
			continue;
		if (snake.willGrow && snake.pendingKindIndex !== null)
			snake.score += snake.pendingKindIndex + 1;
		snake.pendingKindIndex = null;
	}
}

function moveSnake(state: GameStateType){
	for (const snake of state.snakes){
		if (!snake.alive)
			continue;
		if (snake.newPosition === null)
			continue;
		snake.body.unshift(snake.newPosition);
		if (!snake.willGrow)
			snake.body.pop();
		if (snake.newDirection !== null)
			snake.direction = snake.newDirection;
		snake.willGrow = false;
		snake.newDirection = null;
		snake.newPosition = null;
	}
}

function createSnake(user: PlayerType, index: number, color: string) : SnakeType{
	let pos: PositionType = {x: 2, y: 1};
	const body : PositionType[]  = [];
	let dir : DirectionType = 'RIGHT';
	if (index === 2)
		pos = {x: 2, y: GRID_HEIGHT - 2}
	if (index === 1)
		pos = {x: GRID_WIDTH - 3, y: 1}
	if (index === 3)
		pos = {x: GRID_WIDTH - 3, y: GRID_HEIGHT - 2}
	if (index === 4)
		pos = {x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2)}

	if (index === 0 || index === 2){
		body.push(pos);
		body.push({x: pos.x - 1, y: pos.y});
		body.push({x: pos.x - 1, y: pos.y + 1});
	}
	if (index === 1 || index === 3){
		dir = 'LEFT';
		body.push(pos);
		body.push({x: pos.x + 1, y: pos.y});
		body.push({x: pos.x + 1, y: pos.y + 1});
	}
	if (index === 4){
		dir = 'UP';
		body.push(pos);
		body.push({x: pos.x, y: pos.y + 1});
		body.push({x: pos.x - 1, y: pos.y + 1});
	}
	let player: PlayerRoleType = 'PLAYER';
	if (user.isBot)
		player = 'BOT';
	
	const snakes : SnakeType = {
		userId: user.id,
		body: body,
		direction: dir,
		newDirection: null,
		newPosition: null,
		willGrow: false,
		alive: true,
		score: 0,
		color: color,
		player: player,
		pendingKindIndex: null,
	};
	return snakes;
}

const SNAKE_COLOR_POOL = ['#22c55e', '#22d3ee', '#d946ef', '#f97316', '#fbbf24', '#ef4444', '#a3e635', '#f472b6'];

function isValidColor(color?: string | null): color is string {
	return !!color && /^#[0-9a-fA-F]{6}$/.test(color);
}

function shadeColor(hex: string, percent: number): string {
	const num = parseInt(hex.slice(1), 16);
	const clamp = (v: number) => Math.min(255, Math.max(0, v));
	const r = clamp(((num >> 16) & 0xff) + Math.round(255 * percent));
	const g = clamp(((num >> 8) & 0xff) + Math.round(255 * percent));
	const b = clamp((num & 0xff) + Math.round(255 * percent));
	return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function distinctShade(base: string, used: Set<string>): string {
	for (let step = 1; step <= 4; step++){
		for (const percent of [-0.15 * step, 0.15 * step]){
			const shaded = shadeColor(base, percent);
			if (!used.has(shaded.toLowerCase()))
				return shaded;
		}
	}
	return base;
}

function assignColors(users: PlayerType[]): string[] {
	const colors: (string | null)[] = new Array<string | null>(users.length).fill(null);
	const used = new Set<string>();

	users.forEach((user, i) => {
		if (user.isBot || !isValidColor(user.color))
			return;
		const key = user.color.toLowerCase();
		if (used.has(key)){
			const shaded = distinctShade(user.color, used);
			colors[i] = shaded;
			used.add(shaded.toLowerCase());
		} else {
			colors[i] = user.color;
			used.add(key);
		}
	});

	users.forEach((_user, i) => {
		if (colors[i] !== null)
			return;
		let candidate = SNAKE_COLOR_POOL.find(c => !used.has(c.toLowerCase()));
		if (!candidate)
			candidate = distinctShade(SNAKE_COLOR_POOL[i % SNAKE_COLOR_POOL.length], used);
		colors[i] = candidate;
		used.add(candidate.toLowerCase());
	});

	return colors as string[];
}

function initGame(id: string, users: PlayerType[]) : GameStateType{
	const snakes : SnakeType[] = [];
	let flag = false;
	const colors = assignColors(users);
	for (let i = 0; i < users.length; i++){
		snakes.push(createSnake(users[i], i, colors[i]));
		if (users[i].isBot)
			flag = true;
	}
	const foods : FoodType[] = [];
	const game : GameStateType = {
		roomId: id,
		snakes: snakes,
		food: foods,
		status: 'waiting',
		tick: 0,
		gridHeight: GRID_HEIGHT,
		gridWidth: GRID_WIDTH,
		winnerId: null,
		botPresent: flag,
		moveIntervalMs: MOVE_INTERVAL_MS,
	};
	for (let i = 0; i < users.length + 1; i++)
		spawnFood(game);
	return game;
}

function gameOver(game : GameStateType) : GameStateType{
	let alive : number = 0;
	let winners : number[] = [];
	if (game.botPresent){
		for (const snake of game.snakes){
			if (snake.alive && snake.player != 'BOT')
				alive++;
		}
		if (alive <= 0){
			game.status = 'finished';
			const bot = game.snakes.find(s => s.player === 'BOT');
			if (bot)
				game.winnerId = bot.userId;
			return game;
		}
		alive = 0;
	}
	for (const snake of game.snakes){
		if (snake.alive){
			alive++;
			winners.push(snake.userId);
		}
	}
	if (alive <= 1){
		game.status = 'finished';
		if (winners.length !== 0)
			game.winnerId = winners[0];
	}
	return game;
}

@Injectable()
export class GameEnginService {

	private readonly games = new Map<string, GameStateType>();
	private readonly pendingDirections = new Map<string, Map<number, DirectionType>>();
	private readonly logger = new LoggerService(GameEnginService.name);
	private readonly tickIntervals = new Map<string, ReturnType<typeof setInterval>>();
	private readonly moveAccumulators = new Map<string, number>();
	private readonly lastTickAt = new Map<string, number>();

	public constructor(
		private readonly prismaService: DatabaseService,
		private readonly aiBotService: AiOpponentService,
        @Inject(forwardRef(() => SocketGateway)) private readonly socketGateway: SocketGateway,
	) { };

	getGame(roomId: string): GameStateType | undefined {
		return this.games.get(roomId);
	}

	queueDirection(roomId: string, userId: number, direction: DirectionType){
		let room = this.pendingDirections.get(roomId);
		if (!room){
			room = new Map();
			this.pendingDirections.set(roomId, room);
		}
		room.set(userId, direction);
	}

	private popDirection(roomId: string, userId: number): DirectionType | undefined {
		const room = this.pendingDirections.get(roomId);
		const direction = room?.get(userId);
		if (direction !== undefined)
			room!.delete(userId);
		return direction;
	}

	async storeResults(game: GameStateType){
		try {
			await this.prismaService.gameResults.create({
				data: {
					roomId: game.roomId,
					winnerId: game.winnerId,
					ticks: game.tick,
					participants: {
						create: game.snakes.map( s => ({
							userId: s.userId,
							score: s.score,
							alive: s.alive,
						}))
					}
				}
			})
			await Promise.all(
				game.snakes.filter(s => s.player !== 'BOT').map(s => {
					const won = s.userId === game.winnerId;
					return this.prismaService.users.update({
						where: { id: s.userId },
						data: {
							history: {
								upsert: {
									create: {
										gamesWon: won ? 1 : 0,
										gamesLost: won ? 0 : 1,
										totalScore: s.score,
									},
									update: {
										gamesWon: { increment: won ? 1 : 0 },
										gamesLost: { increment: won ? 0 : 1 },
										totalScore: { increment: s.score },
									},
								},
							},
						},
					}).catch(() => {});
				})
			);
			await this.prismaService.gameRoom.update({
				where: {
					id: game.roomId
				},
				data: {
					status: RoomStatus.FINISHED
				},
			});
			await this.socketGateway.refreshOnlineUsers(
				game.snakes.filter(s => s.player !== 'BOT').map(s => s.userId)
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.logger.error(`storeResults failed for room ${game.roomId}: ${message}`);
		} finally {
			this.games.delete(game.roomId);
			this.pendingDirections.delete(game.roomId);
			this.stopTicking(game.roomId);
			this.socketGateway.onGameFinished(game.roomId);
		}
	}

	// Wrapped in a function so TS doesn't narrow `game.status` at call sites -
	// stepGame() mutates it via a separate call the compiler can't see through.
	private isFinished(game: GameStateType): boolean {
		return game.status === 'finished';
	}

	private stopTicking(roomId: string) {
		const interval = this.tickIntervals.get(roomId);
		if (interval) {
			clearInterval(interval);
			this.tickIntervals.delete(roomId);
		}
		this.moveAccumulators.delete(roomId);
		this.lastTickAt.delete(roomId);
	}

	eliminatePlayer(roomId: string, userId: number){
		const game = this.games.get(roomId);
		if (!game || game.status === 'finished')
			return;
		const snake = game.snakes.find(s => s.userId === userId && s.alive);
		if (!snake)
			return;
		snake.alive = false;
	}

	async startGame(roomId: string){
		const room = await this.prismaService.gameRoom.findUnique({
			where: { id:roomId },
			include: {
				roomUsers: {
					include: {
						user: {
							select: {
								id:true, isBot: true, score: true, color: true,
							}
						}
					}
				}
			},
		});
		if (!room)
			throw new BadRequestException ('Room not found');
		const users = room.roomUsers.map((roomUser) => ({
			id: roomUser.user.id,
			isBot: roomUser.user.isBot,
			color: roomUser.user.color,
		}));
		const game : GameStateType = initGame(roomId, users);
		game.status = 'running';
		this.games.set(roomId, game);
		this.socketGateway.broadcastGameState(roomId, game);

		this.moveAccumulators.set(roomId, 0);
		this.lastTickAt.set(roomId, Date.now());
		this.tickIntervals.set(roomId, setInterval(() => {
			this.tick(roomId).catch((err) =>
				this.logger.error(`tick failed for room ${roomId}: ${err}`),
			);
		}, TICK_MS));
	}

	private stepGame(game: GameStateType){
		for (const snake of game.snakes){
			if (snake.alive && snake.player === 'PLAYER'){
				const pending = this.popDirection(game.roomId, snake.userId);
				if (pending)
					snake.newDirection = pending;
			}
		}
		if (game.botPresent){
			const map = this.aiBotService.createMap(game);
			for (const snake of game.snakes){
				if (snake.alive && snake.player === 'BOT')
					snake.newDirection = this.aiBotService.newBotDirection(snake, map);
			}
		}
		newHeadPosition(game);
		checkFood(game);
		checkCollision(game);
		updateFoodScore(game);
		moveSnake(game);
		game.tick++;
		gameOver(game);

		if (game.status === 'finished')
			game.snakes = game.snakes.filter(s => s.player !== 'BOT');
		else
			game.snakes = game.snakes.filter(s => s.player !== 'BOT' || s.alive);
	}

	async tick(roomId: string){
		const game = this.games.get(roomId);
		if (!game){
			this.stopTicking(roomId);
			return;
		}
		if (this.isFinished(game))
			return;

		const now = Date.now();
		const lastAt = this.lastTickAt.get(roomId) ?? now;
		this.lastTickAt.set(roomId, now);

		let accumulator = (this.moveAccumulators.get(roomId) ?? 0) + (now - lastAt);
		accumulator = Math.min(accumulator, game.moveIntervalMs * MAX_CATCHUP_STEPS);

		while (accumulator >= game.moveIntervalMs && game.status !== 'finished'){
			accumulator -= game.moveIntervalMs;
			this.stepGame(game);
			this.socketGateway.broadcastGameState(roomId, game);
		}
		this.moveAccumulators.set(roomId, accumulator);

		if (game.status === 'finished'){
			this.stopTicking(roomId);
			await this.storeResults(game);
		}
	}
}