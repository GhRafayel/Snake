import { describe, it, expect, beforeEach, vi } from "vitest";
import { useArenaStore } from "./useArenaStore";
import { useSocket } from "@/src/components/Socket/Socket";

vi.mock("@/src/components/Socket/Socket", () => ({
    useSocket: vi.fn(),
}));

const initialState = useArenaStore.getState();

describe("useArenaStore", () => {
    beforeEach(() => {
        useArenaStore.setState(initialState, true);
        vi.mocked(useSocket).mockReset();
    });

    it("has the expected initial state", () => {
        const state = useArenaStore.getState();
        expect(state.mode).toBe("AI");
        expect(state.gameState).toBeNull();
        expect(state.gameDir).toBeNull();
        expect(state.sidebarOpen).toBe(false);
        expect(state.roomState).toBeUndefined();
        expect(state.countdownSeconds).toBeNull();
        expect(state.pendingRoomId).toBeNull();
        expect(state.rematchRoomId).toBeNull();
    });

    it("setMode, setGameDir, setSidebarOpen, setRoomState set values directly", () => {
        useArenaStore.getState().setMode("online");
        useArenaStore.getState().setGameDir("RIGHT");
        useArenaStore.getState().setSidebarOpen(true);
        useArenaStore.getState().setRoomState({ players: 2, roomId: "room-1", roomStatus: "PLAYING" });

        const state = useArenaStore.getState();
        expect(state.mode).toBe("online");
        expect(state.gameDir).toBe("RIGHT");
        expect(state.sidebarOpen).toBe(true);
        expect(state.roomState).toEqual({ players: 2, roomId: "room-1", roomStatus: "PLAYING" });
    });

    it("setGameState accepts a direct value or an updater function", () => {
        useArenaStore.getState().setGameState("PAUSE");
        expect(useArenaStore.getState().gameState).toBe("PAUSE");

        useArenaStore.getState().setGameState((prev) => (prev === "PAUSE" ? "END" : prev));
        expect(useArenaStore.getState().gameState).toBe("END");
    });

    it("setCountdownSeconds accepts a direct value or an updater function", () => {
        useArenaStore.getState().setCountdownSeconds(5);
        expect(useArenaStore.getState().countdownSeconds).toBe(5);

        useArenaStore.getState().setCountdownSeconds((prev) => (prev ?? 0) - 1);
        expect(useArenaStore.getState().countdownSeconds).toBe(4);

        useArenaStore.getState().setCountdownSeconds(null);
        expect(useArenaStore.getState().countdownSeconds).toBeNull();
    });

    it("setPendingRoomId and setRematchRoomId update independently", () => {
        useArenaStore.getState().setPendingRoomId("room-pending");
        useArenaStore.getState().setRematchRoomId("room-rematch");

        const state = useArenaStore.getState();
        expect(state.pendingRoomId).toBe("room-pending");
        expect(state.rematchRoomId).toBe("room-rematch");
    });

    describe("inviteFriend", () => {
        it("emits a room-invite event with the current roomId when a socket and room are present", () => {
            const emit = vi.fn();
            vi.mocked(useSocket).mockReturnValue({ emit } as never);
            useArenaStore.setState({ roomState: { players: 2, roomId: "room-42", roomStatus: "PLAYING" } });

            useArenaStore.getState().inviteFriend(7);

            expect(emit).toHaveBeenCalledWith("room-invite", { roomId: "room-42", toUserId: 7 });
        });

        it("does nothing when there is no active room", () => {
            const emit = vi.fn();
            vi.mocked(useSocket).mockReturnValue({ emit } as never);
            useArenaStore.setState({ roomState: undefined });

            useArenaStore.getState().inviteFriend(7);

            expect(emit).not.toHaveBeenCalled();
        });

        it("does nothing when the socket is unavailable", () => {
            vi.mocked(useSocket).mockReturnValue(null);
            useArenaStore.setState({ roomState: { players: 2, roomId: "room-42", roomStatus: "PLAYING" } });

            expect(() => useArenaStore.getState().inviteFriend(7)).not.toThrow();
        });
    });

    it("resetArena clears game-related fields but preserves the mode", () => {
        useArenaStore.setState({
            mode: "online",
            gameState: "WIN",
            gameDir: "UP",
            sidebarOpen: true,
            roomState: { players: 2, roomId: "room-1", roomStatus: "PLAYING" },
            countdownSeconds: 3,
            pendingRoomId: "pending",
            rematchRoomId: "rematch",
        });

        useArenaStore.getState().resetArena();

        const state = useArenaStore.getState();
        expect(state.gameState).toBeNull();
        expect(state.gameDir).toBeNull();
        expect(state.sidebarOpen).toBe(false);
        expect(state.roomState).toBeUndefined();
        expect(state.countdownSeconds).toBeNull();
        expect(state.mode).toBe("online");
        expect(state.pendingRoomId).toBe("pending");
        expect(state.rematchRoomId).toBe("rematch");
    });
});
