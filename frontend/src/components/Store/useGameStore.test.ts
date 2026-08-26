import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./useGameStore";
import { GameType } from "@/src/types/GameTypes/GameTypes";

const initialState = useGameStore.getState();

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

describe("useGameStore", () => {
    beforeEach(() => {
        useGameStore.setState(initialState, true);
    });

    it("has the expected initial state", () => {
        const state = useGameStore.getState();
        expect(state.gameState).toBeNull();
        expect(state.gameDir).toBeNull();
        expect(state.currGame).toBeNull();
        expect(state.prevGame).toBeNull();
        expect(state.alpha).toBe(0);
        expect(state.step).toBe(false);
        expect(state.screen).toEqual({ width: 0, height: 0 });
        expect(state.stateTime).toBe(0);
    });

    it("setGameState accepts a direct value", () => {
        useGameStore.getState().setGameState("PAUSE");
        expect(useGameStore.getState().gameState).toBe("PAUSE");
    });

    it("setGameState accepts an updater function based on current state", () => {
        useGameStore.setState({ gameState: "START" });
        useGameStore.getState().setGameState((prev) => (prev === "START" ? "END" : prev));
        expect(useGameStore.getState().gameState).toBe("END");
    });

    it("setGameDir updates the direction", () => {
        useGameStore.getState().setGameDir("UP");
        expect(useGameStore.getState().gameDir).toBe("UP");
    });

    it("setCurrGame and setPrevGame are independent", () => {
        const curr = makeGame({ tick: 5 });
        const prev = makeGame({ tick: 4 });
        useGameStore.getState().setCurrGame(curr);
        useGameStore.getState().setPrevGame(prev);

        expect(useGameStore.getState().currGame).toEqual(curr);
        expect(useGameStore.getState().prevGame).toEqual(prev);
    });

    it("toggleStep flips the boolean each call", () => {
        expect(useGameStore.getState().step).toBe(false);
        useGameStore.getState().toggleStep();
        expect(useGameStore.getState().step).toBe(true);
        useGameStore.getState().toggleStep();
        expect(useGameStore.getState().step).toBe(false);
    });

    it("setScreen and setAlpha and setStateTime update independently", () => {
        useGameStore.getState().setScreen({ width: 400, height: 300 });
        useGameStore.getState().setAlpha(0.75);
        useGameStore.getState().setStateTime(12345);

        const state = useGameStore.getState();
        expect(state.screen).toEqual({ width: 400, height: 300 });
        expect(state.alpha).toBe(0.75);
        expect(state.stateTime).toBe(12345);
    });

    it("resetGame restores defaults but preserves the current screen size", () => {
        useGameStore.setState({
            gameState: "WIN",
            gameDir: "LEFT",
            currGame: makeGame(),
            prevGame: makeGame(),
            alpha: 0.5,
            step: true,
            screen: { width: 800, height: 600 },
            stateTime: 999,
        });

        useGameStore.getState().resetGame();

        const state = useGameStore.getState();
        expect(state.gameState).toBeNull();
        expect(state.gameDir).toBeNull();
        expect(state.currGame).toBeNull();
        expect(state.prevGame).toBeNull();
        expect(state.alpha).toBe(0);
        expect(state.step).toBe(false);
        expect(state.stateTime).toBe(0);
        expect(state.screen).toEqual({ width: 800, height: 600 });
    });
});
