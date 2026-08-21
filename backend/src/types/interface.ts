export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type PlayerType = 'BOT' | 'PLAYER' ;

export interface Position {
	x: number;
	y: number;
}

export interface OnlineUsersData {
	id: number;
	Username: string;
	role: string;
	history: {
		gamesWon: number;
		gamesLost: number;
		totalScore: number;
	}
}

export interface Snake {
	userId: number; //user id
	body: Position[]; //first position
	direction: Direction;
	newDirection: Direction | null;
	newPosition: Position | null;
	willGrow: boolean;
	alive: boolean;
	score: number;
	color: string;
	player: PlayerType;
	pendingKindIndex: number | null;
}

export interface Food {
	position: Position;
	kindIndex: number;
	value: number;
}

export interface User {
	id: number;
	Email: string;
	Password: string;
	Username: string;
	role: string;
}

export function CreateSnake (userId: number) {
	return {
		userId: userId,
		body: [],
		direction: 'LEFT',
		newDirection: null,
		newPosition: null,
		willGrow: false,
		alive: true,
		score: 0,
		color: "",
	}
}

export interface joinRoomPayload {
	roomId: string;
	userId: number;
}

export interface startGamePayload {
	roomId: string;
}

export interface changeDirectionPayload {
	direction: Direction;
	roomId: string;
	userId: number;
}


export interface Position {
	x: number;
	y: number;
}

export interface Player{
	id: number;
	isBot: boolean;
	color?: string | null;
}



export interface Food {
	position: Position;
	eaten: boolean;
}

export interface GameState {
	roomId: string;
	snakes: Snake[];
	food: Food[];
	status: 'waiting' | 'running' | 'finished';
	tick: number;
	gridWidth: number;
	gridHeight: number;
	winnerId: number | null;
	botPresent: boolean;
	moveIntervalMs: number;
}