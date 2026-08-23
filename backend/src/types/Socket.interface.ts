import { DirectionType } from "./Game.engin.interface";
import { UsersService } from "src/users/users.service";
import { Socket, DefaultEventsMap } from 'socket.io';

export type UserRecordType = NonNullable<Awaited<ReturnType<UsersService['findOne']>>>;
export type AppSocketType = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketDataType>;

export interface ChangeDirectionPayloadType {
    direction: DirectionType;
    roomId: string;
    userId: number;
}

export interface BotPayloadType { level?: number; }

export interface JoinRoomPayloadType { roomId?: string; }

export interface RematchPayloadType { roomId: string; }

export interface RoomInvitePayloadType {
    roomId: string;
    toUserId: number;
}


export interface SocketUserType extends Omit<UserRecordType, 'history'> {
    history: { gamesWon: number; gamesLost: number; totalScore: number };
}

export interface SocketDataType {
    user?: SocketUserType | null;
    roomId?: string;
}

