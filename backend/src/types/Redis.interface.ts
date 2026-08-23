export interface OnlineUsersDataType {
    id: number;
    Username: string;
    role: string;
    history: {
        gamesWon: number;
        gamesLost: number;
        totalScore: number;
    }
}