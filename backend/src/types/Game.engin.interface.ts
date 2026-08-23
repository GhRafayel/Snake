export type DirectionType = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type PlayerRoleType = 'BOT' | 'PLAYER' ;


export interface PositionType {
	x: number;
	y: number;
}

export interface SnakeType {
	userId: number; //user id
	body: PositionType[]; //first position
	direction: DirectionType;
	newDirection: DirectionType | null;
	newPosition: PositionType | null;
	willGrow: boolean;
	alive: boolean;
	score: number;
	color: string;
	player: PlayerRoleType;
	pendingKindIndex: number | null;
}

export interface FoodType {
	position: PositionType;
	kindIndex: number;
	value: number;
	eaten: boolean;
}

export interface PlayerType{
	id: number;
	isBot: boolean;
	color?: string | null;
}

export interface GameStateType {
	roomId: string;
	snakes: SnakeType[];
	food: FoodType[];
	status: 'waiting' | 'running' | 'finished';
	tick: number;
	gridWidth: number;
	gridHeight: number;
	winnerId: number | null;
	botPresent: boolean;
	moveIntervalMs: number;
}

