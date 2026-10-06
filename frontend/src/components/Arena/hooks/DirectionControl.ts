import { useCallback } from "react";
import { Socket } from "socket.io-client";
import { useArenaStore } from "@/src/components/Store/useArenaStore";
import { useGameCanvasStore } from "@/src/components/Store/useGameCanvasStore";

export type MoveDirectionType = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface DirectionControlParamsType {
    socket: Socket | null;
    myUserId: string | number | undefined;
}

// Shared by keyboard, swipe and on-screen buttons so every input behaves the same.
export function useSendDirection({ socket, myUserId }: DirectionControlParamsType) {
    const setGameState = useArenaStore((s) => s.setGameState);
    const setGameDir = useArenaStore((s) => s.setGameDir);

    return useCallback((dir: MoveDirectionType) => {
        const state = useGameCanvasStore.getState().internalGameState;
        if (state === 'OVER' || state === 'WIN' || state === 'END') return;

        if (useArenaStore.getState().gameState === 'PAUSE') {
            useGameCanvasStore.getState().setInternalGameState('START');
            setGameState('START');
        }

        setGameDir(dir);
        const room = useGameCanvasStore.getState().currGame?.roomId ?? useArenaStore.getState().roomState?.roomId;
        if (!room || !socket) return;
        socket.emit('change-direction', { direction: dir, roomId: room, userId: myUserId });
    }, [socket, myUserId, setGameState, setGameDir]);
}
