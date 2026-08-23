import { create } from 'zustand';
import { RoomStateType, GameStateType, DirectionType } from "@/src/types/GameTypes/GameTypes"
import { useSocket as getSocket } from "@/src/components/Socket/Socket";

export type ArenaModeType = "AI" | "online";

interface ArenaStoreType {
    mode: ArenaModeType;
    gameState: GameStateType;
    gameDir: DirectionType;
    sidebarOpen: boolean;
    roomState: RoomStateType | undefined;
    countdownSeconds: number | null;
    pendingRoomId: string | null;
    rematchRoomId: string | null;

    setMode: (mode: ArenaModeType) => void;
    setGameState: (value: GameStateType | ((current: GameStateType) => GameStateType)) => void;
    setGameDir: (dir: DirectionType) => void;
    setSidebarOpen: (open: boolean) => void;
    setRoomState: (room: RoomStateType) => void;
    setCountdownSeconds: (value: number | null | ((current: number | null) => number | null)) => void;
    setPendingRoomId: (roomId: string | null) => void;
    setRematchRoomId: (roomId: string | null) => void;
    inviteFriend: (toUserId: number) => void;
    resetArena: () => void;
}

export const useArenaStore = create<ArenaStoreType>((set, get) => ({
    mode: "AI",
    gameState: null,
    gameDir: null,
    sidebarOpen: false,
    roomState: undefined,
    countdownSeconds: null,
    pendingRoomId: null,
    rematchRoomId: null,

    setMode: (mode) => set({ mode }),

    setGameState: (value) =>
        set((state) => ({
            gameState:
                typeof value === 'function'
                    ? (value as (current: GameStateType) => GameStateType)(state.gameState)
                    : value,
        })),

    setGameDir: (dir) => set({ gameDir: dir }),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setRoomState: (room) => set({ roomState: room }),

    setCountdownSeconds: (value) =>
        set((state) => ({
            countdownSeconds:
                typeof value === 'function'
                    ? (value as (current: number | null) => number | null)(state.countdownSeconds)
                    : value,
        })),

    setPendingRoomId: (roomId) => set({ pendingRoomId: roomId }),
    setRematchRoomId: (roomId) => set({ rematchRoomId: roomId }),

    inviteFriend: (toUserId) => {
        const roomId = get().roomState?.roomId;
        const socket = getSocket();
        if (!roomId || !socket) return;
        socket.emit('room-invite', { roomId, toUserId });
    },

    resetArena: () =>
        set({
            gameState: null,
            gameDir: null,
            sidebarOpen: false,
            roomState: undefined,
            countdownSeconds: null,
        }),
}));
