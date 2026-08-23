
export type DirectionType = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;
export type GameStateType = 'START' | 'PAUSE' | 'END' | 'WIN' | 'OVER' | null;


export interface RoomStateType  {
	players: number;
	roomId: string;
	roomStatus: string;
};

export interface RoomCountdownType {
	roomId: string;
	seconds: number;
};

export interface PositionType {
    x: number;
    y: number;
}

export interface SnakeType {
	userId: number;
	body: PositionType[];
	direction: DirectionType;
	newDirection: DirectionType | null;
	newPosition: PositionType | null;
	willGrow: boolean;
	alive: boolean;
	score: number;
	color: string;
	player: 'human' | 'bot';
}

export interface FoodType {
	position: PositionType;
	eaten: boolean;
	kindIndex: number;
	value: number;
}

export interface GameType {
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

export interface RoomInviteType {
  roomId: string;
  from: {
    id: number;
    Username: string;
  };
}
export interface DrawGameParamsType {
    ctx: CanvasRenderingContext2D;
    curr: GameType;
    prev: GameType | null;
    alpha: number;
    step: boolean;
    screen: {
        width: number;
        height: number;
    };
    myUserId: string | number | undefined;
}

export interface ArenaBoardType  {
    "WAITING": string;
    "PLAYING": string;
    "STARTING": string;
    "FINISHED": string;
    "connecting": string;
}