import { SnakeType } from "@/src/types/GameTypes/GameTypes";

const MIN_CROWN_LENGTH = 3;

export function getLeaderSnake(snakes: SnakeType[]): SnakeType | null {
    const aliveSnakes = snakes.filter(s => s.alive);
    const maxLen = Math.max(0, ...aliveSnakes.map(s => s.body.length));
    let leaders = aliveSnakes.filter(s => s.body.length === maxLen);
    if (leaders.length > 1) {
        const maxScore = Math.max(...leaders.map(s => s.score));
        leaders = leaders.filter(s => s.score === maxScore);
    }
    return maxLen > MIN_CROWN_LENGTH && leaders.length === 1 ? leaders[0] : null;
}

export function getRankedSnakes(snakes: SnakeType[]): SnakeType[] {
    return [...snakes].sort((a, b) => b.score - a.score);
}
