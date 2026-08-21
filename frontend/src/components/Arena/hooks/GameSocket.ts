import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { GameType } from "@/src/types/GameTypes/GameTypes";
import { GameCanvasStore } from "@/src/components/Store/GameCanvasStore";
import { ArenaStore } from "@/src/components/Store/ArenaStore";
import { playEatSound } from "@/src/components/Arena/utils/sound";

interface UseGameSocketParamsType {
    socket: Socket | null;
    myUserId: string | number | undefined;
}

export function GameSocket({ socket, myUserId }: UseGameSocketParamsType) {
    const setArenaGameState = ArenaStore((s) => s.setGameState);

    useEffect(() => {
        if (!socket) return;

        const handleGameState = (data: GameType) => {
            const store = GameCanvasStore.getState();
            const previousSnakes = store.currGame?.snakes;
            store.setGames(data);
            store.setStateTime(performance.now());
            store.toggleStep();
            if (data.moveIntervalMs) store.setStepSeconds(data.moveIntervalMs / 1000);

            
            const ateFood = previousSnakes?.some((prev: GameType["snakes"][number]) => {
                const curr = data.snakes.find((s) => s.userId === prev.userId);
                return curr !== undefined && curr.score > prev.score;
            });
            if (ateFood) playEatSound();

            if (data.status === 'finished') {
                const won = String(data.winnerId) === String(myUserId);
                const nextState = won ? 'WIN' : 'OVER';
                store.setInternalGameState(nextState);
                setArenaGameState(nextState);
            } else {
                const mySnake = data.snakes.find((s) => String(s.userId) === String(myUserId));
                if (mySnake && !mySnake.alive && store.internalGameState !== 'OVER') {
                    store.setInternalGameState('OVER');
                    setArenaGameState('OVER');
                }
            }
        };

        socket.on("game-state", handleGameState);

        return () => {
            socket.off("game-state", handleGameState);
        };
    }, [socket, myUserId, setArenaGameState]);
}
