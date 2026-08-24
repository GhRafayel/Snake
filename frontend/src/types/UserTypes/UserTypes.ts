import { LanguageType, TranslationType } from "../StoreTypes/StoreTypes";

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
    cntUser: UserType | null;
    LENUAGE: TranslationType;
    ChangingCallback: (value: object | undefined, endpoint: string) => Promise<void>;
}

export type UserType = {
    id: number;
    Username: string;
    language: LanguageType;
    role: RoleType;
    color: string | null;
    avatar: string;
    theme: boolean;
    termsAcceptedAt: string | null;
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

export interface FormType {
	id: string,
	type: string,
	name: string,
	src : string,
	value: string,
	bol: boolean,
}





