import { LanguageType } from "../StoreTypes/StoreTypes";

export type RoleType = "ADMIN" | "PLAYER" | "BOT";

export type MusicNameType = "game_sfx_on" | "snake_music_on";

export interface AuthType {
    accessToken: string, refreshToken: string
}

export interface UserSearchType {
    Username: string,
    id: number
}

export type UserContextType = {
    cntUser: UserType | null,
    ChangingCallback: (value: Object | undefined, funName: string) => Promise<void>;
}

export type UserType = {
    id: number;
    Username: string;
    language: LanguageType;
    role: RoleType;
    color: string | null;
    avatar: string;
    theme: boolean;
    history: {
        gamesLost: number;
        gamesWon: number;
        totalScore: number;
    }
} | null

export interface OnlineUsersType {
    id: number;
    Username: string;
    role: RoleType;
    history: {
        gamesWon: number;
        gamesLost: number;
        totalScore: number;
    }
}

export interface MusicType {
    isMusicOn: boolean;
    volume: number;
    key : MusicNameType;
    keyVolume : string;
    src : string;
}

export interface CardsType  {
	title: string;
	description: string;
	button: string;
	wait: string;
	mode: "AI" | "online";
}

export interface FormType {
	id: string,
	type: string,
	name: string,
	src : string,
	value: string,
	bol: Boolean,
}





