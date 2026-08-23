import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { useArenaStore } from "@/src/components/Store/useArenaStore";
import { useGameCanvasStore } from "@/src/components/Store/useGameCanvasStore";

interface KeyboardControlsParamsType {
    socket: Socket | null;
    myUserId: string | number | undefined;
}

export function KeyboardControls({ socket, myUserId }: KeyboardControlsParamsType) {
    const setGameState = useArenaStore((s) => s.setGameState);
    const setGameDir = useArenaStore((s) => s.setGameDir);

    useEffect(() => {
        const isEnded = () => {
            const state = useGameCanvasStore.getState().internalGameState;
            return state === 'OVER' || state === 'WIN' || state === 'END';
        };

        const advanceSnake = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
            const room = useGameCanvasStore.getState().currGame?.roomId ?? useArenaStore.getState().roomState?.roomId;
            if (!room || !socket) return;
            socket.emit('change-direction', { direction: dir, roomId: room, userId: myUserId });
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', ' '].includes(e.key)) return;
            e.preventDefault();

            if (isEnded()) return;

            if (useArenaStore.getState().gameState === 'PAUSE') {
                useGameCanvasStore.getState().setInternalGameState('START');
                setGameState('START');
            }

            if (e.key === 'ArrowUp') {
                setGameDir('UP');
                advanceSnake('UP');
            } else if (e.key === 'ArrowDown') {
                setGameDir('DOWN');
                advanceSnake('DOWN');
            } else if (e.key === 'ArrowLeft') {
                setGameDir('LEFT');
                advanceSnake('LEFT');
            } else if (e.key === 'ArrowRight') {
                setGameDir('RIGHT');
                advanceSnake('RIGHT');
            } else if (e.key === 'Escape') {
                setGameDir(null);
                useGameCanvasStore.getState().setInternalGameState('END');
                setGameState('END');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [socket, myUserId, setGameState, setGameDir]);
}
