import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAnimationLoop } from "./useAnimationLoop";
import { useGameCanvasStore } from "@/src/components/Store/useGameCanvasStore";
import { drawGame, DEFAULT_STEP } from "@/src/components/Arena/utils/drawGame";
import { GameType } from "@/src/types/GameTypes/GameTypes";

vi.mock("@/src/components/Arena/utils/drawGame", () => ({
    drawGame: vi.fn(),
    DEFAULT_STEP: 150 / 1000,
}));

const initialCanvasStoreState = useGameCanvasStore.getState();

function makeGame(overrides: Partial<GameType> = {}): GameType {
    return {
        roomId: "room-1",
        snakes: [],
        food: [],
        status: "running",
        tick: 0,
        gridWidth: 20,
        gridHeight: 20,
        winnerId: null,
        botPresent: false,
        moveIntervalMs: 150,
        ...overrides,
    };
}

describe("useAnimationLoop", () => {
    let rafCallbacks: FrameRequestCallback[];
    let rafIdCounter: number;
    let rafMock: ReturnType<typeof vi.fn>;
    let cafMock: ReturnType<typeof vi.fn>;
    let fakeCtx: object;

    beforeEach(() => {
        useGameCanvasStore.setState(initialCanvasStoreState, true);
        vi.mocked(drawGame).mockReset();

        rafCallbacks = [];
        rafIdCounter = 0;
        rafMock = vi.fn((cb: FrameRequestCallback) => {
            rafCallbacks.push(cb);
            return ++rafIdCounter;
        });
        cafMock = vi.fn();
        vi.stubGlobal("requestAnimationFrame", rafMock);
        vi.stubGlobal("cancelAnimationFrame", cafMock);

        fakeCtx = {};
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fakeCtx as never);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    function runNextFrame(now: number) {
        const cb = rafCallbacks.shift();
        expect(cb).toBeDefined();
        cb!(now);
    }

    it("does nothing when the canvas has no 2d context", () => {
        vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
        const canvas = document.createElement("canvas");

        renderHook(() => useAnimationLoop({ canvasRef: { current: canvas }, myUserId: 1 }));

        expect(rafMock).not.toHaveBeenCalled();
    });

    it("schedules a frame via requestAnimationFrame on mount when context is available", () => {
        const canvas = document.createElement("canvas");

        renderHook(() => useAnimationLoop({ canvasRef: { current: canvas }, myUserId: 1 }));

        expect(rafMock).toHaveBeenCalledTimes(1);
    });

    it("computes alpha from elapsed time / stepSeconds and updates the store, capped at 1", () => {
        useGameCanvasStore.setState({ stateTime: 1000, stepSeconds: DEFAULT_STEP });
        const canvas = document.createElement("canvas");

        renderHook(() => useAnimationLoop({ canvasRef: { current: canvas }, myUserId: 1 }));

        runNextFrame(1050);
        expect(useGameCanvasStore.getState().alpha).toBeCloseTo(0.3333, 3);
    });

    it("caps alpha at MAX_EXTRAPOLATION (1) when elapsed time exceeds stepSeconds", () => {
        useGameCanvasStore.setState({ stateTime: 1000, stepSeconds: DEFAULT_STEP });
        const canvas = document.createElement("canvas");

        renderHook(() => useAnimationLoop({ canvasRef: { current: canvas }, myUserId: 1 }));

        runNextFrame(5000); // way more than a full step ahead
        expect(useGameCanvasStore.getState().alpha).toBe(1);
    });

    it("calls drawGame with the current game state when currGame is set", () => {
        const curr = makeGame({ tick: 2 });
        const prev = makeGame({ tick: 1 });
        useGameCanvasStore.setState({
            currGame: curr,
            prevGame: prev,
            screen: { width: 300, height: 300 },
            step: true,
            stateTime: 0,
        });
        const canvas = document.createElement("canvas");

        renderHook(() => useAnimationLoop({ canvasRef: { current: canvas }, myUserId: "42" }));
        runNextFrame(16);

        expect(drawGame).toHaveBeenCalledTimes(1);
        expect(drawGame).toHaveBeenCalledWith(
            expect.objectContaining({
                ctx: fakeCtx,
                curr,
                prev,
                step: true,
                screen: { width: 300, height: 300 },
                myUserId: "42",
            })
        );
    });

    it("does not call drawGame when there is no currGame", () => {
        useGameCanvasStore.setState({ currGame: null });
        const canvas = document.createElement("canvas");

        renderHook(() => useAnimationLoop({ canvasRef: { current: canvas }, myUserId: 1 }));
        runNextFrame(16);

        expect(drawGame).not.toHaveBeenCalled();
    });

    it("re-schedules another frame after each frame runs (continuous loop)", () => {
        const canvas = document.createElement("canvas");
        renderHook(() => useAnimationLoop({ canvasRef: { current: canvas }, myUserId: 1 }));

        expect(rafMock).toHaveBeenCalledTimes(1);
        runNextFrame(16);
        expect(rafMock).toHaveBeenCalledTimes(2);
        runNextFrame(32);
        expect(rafMock).toHaveBeenCalledTimes(3);
    });

    it("cancels the scheduled frame on unmount", () => {
        const canvas = document.createElement("canvas");
        const { unmount } = renderHook(() => useAnimationLoop({ canvasRef: { current: canvas }, myUserId: 1 }));

        expect(rafMock).toHaveBeenCalledTimes(1);
        const scheduledId = rafMock.mock.results[0].value;

        unmount();

        expect(cafMock).toHaveBeenCalledWith(scheduledId);
    });
});
