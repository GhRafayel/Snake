import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { useArenaStore } from "@/src/components/Store/useArenaStore";
import { useGameCanvasStore } from "@/src/components/Store/useGameCanvasStore";
import { useSendDirection, MoveDirectionType } from "./DirectionControl";

interface KeyboardControlsParamsType {
    socket: Socket | null;
    myUserId: string | number | undefined;
}

const KEY_TO_DIR: Record<string, MoveDirectionType> = {
    ArrowUp: 'UP',
    ArrowDown: 'DOWN',
    ArrowLeft: 'LEFT',
    ArrowRight: 'RIGHT',
};

export function KeyboardControls({ socket, myUserId }: KeyboardControlsParamsType) {
    const setGameState = useArenaStore((s) => s.setGameState);
    const setGameDir = useArenaStore((s) => s.setGameDir);
    const sendDirection = useSendDirection({ socket, myUserId });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', ' '].includes(e.key)) return;
            e.preventDefault();

            const dir = KEY_TO_DIR[e.key];
            if (dir) {
                sendDirection(dir);
                return;
            }

            const state = useGameCanvasStore.getState().internalGameState;
            if (state === 'OVER' || state === 'WIN' || state === 'END') return;

            if (e.key === 'Escape') {
                setGameDir(null);
                useGameCanvasStore.getState().setInternalGameState('END');
                setGameState('END');
            } else if (useArenaStore.getState().gameState === 'PAUSE') {
                useGameCanvasStore.getState().setInternalGameState('START');
                setGameState('START');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sendDirection, setGameState, setGameDir]);
}
