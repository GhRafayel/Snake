import { describe, it, expect, beforeEach } from "vitest";
import { useGameCanvasStore } from "./useGameCanvasStore";
import { DEFAULT_STEP } from "@/src/components/Arena/utils/drawGame";
import { GameType } from "@/src/types/GameTypes/GameTypes";

const initialState = useGameCanvasStore.getState();

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

describe("useGameCanvasStore", () => {
    beforeEach(() => {
        useGameCanvasStore.setState(initialState, true);
    });

    it("has the expected initial state", () => {
        const state = useGameCanvasStore.getState();
        expect(state.prevGame).toBeNull();
        expect(state.currGame).toBeNull();
        expect(state.stateTime).toBe(0);
        expect(state.alpha).toBe(0);
        expect(state.step).toBe(false);
        expect(state.stepSeconds).toBe(DEFAULT_STEP);
        expect(state.screen).toEqual({ width: 0, height: 0 });
        expect(state.internalGameState).toBe("START");
    });

    it("setGames shifts currGame into prevGame and stores the new currGame", () => {
        const first = makeGame({ tick: 1 });
        useGameCanvasStore.getState().setGames(first);
        expect(useGameCanvasStore.getState()).toMatchObject({ prevGame: null, currGame: first });

        const second = makeGame({ tick: 2 });
        useGameCanvasStore.getState().setGames(second);
        expect(useGameCanvasStore.getState()).toMatchObject({ prevGame: first, currGame: second });
    });

    it("setStateTime, setAlpha, setStepSeconds and setScreen update independently", () => {
        useGameCanvasStore.getState().setStateTime(100);
        useGameCanvasStore.getState().setAlpha(0.3);
        useGameCanvasStore.getState().setStepSeconds(0.2);
        useGameCanvasStore.getState().setScreen({ width: 500, height: 500 });

        const state = useGameCanvasStore.getState();
        expect(state.stateTime).toBe(100);
        expect(state.alpha).toBe(0.3);
        expect(state.stepSeconds).toBe(0.2);
        expect(state.screen).toEqual({ width: 500, height: 500 });
    });

    it("toggleStep flips the boolean each call", () => {
        useGameCanvasStore.getState().toggleStep();
        expect(useGameCanvasStore.getState().step).toBe(true);
        useGameCanvasStore.getState().toggleStep();
        expect(useGameCanvasStore.getState().step).toBe(false);
    });

    it("setInternalGameState updates internalGameState", () => {
        useGameCanvasStore.getState().setInternalGameState("END");
        expect(useGameCanvasStore.getState().internalGameState).toBe("END");
    });

    it("resetGameCanvas restores every field to its initial value", () => {
        useGameCanvasStore.setState({
            prevGame: makeGame(),
            currGame: makeGame(),
            stateTime: 999,
            alpha: 1,
            step: true,
            stepSeconds: 0.9,
            screen: { width: 1000, height: 1000 },
            internalGameState: "WIN",
        });

        useGameCanvasStore.getState().resetGameCanvas();

        expect(useGameCanvasStore.getState()).toMatchObject({
            prevGame: null,
            currGame: null,
            stateTime: 0,
            alpha: 0,
            step: false,
            stepSeconds: DEFAULT_STEP,
            screen: { width: 0, height: 0 },
            internalGameState: "START",
        });
    });
});
