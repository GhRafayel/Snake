import { describe, it, expect, beforeEach } from "vitest";
import { useDifficultyStore, MIN_BOT_LEVEL, MAX_BOT_LEVEL } from "./useDifficultyStore";

describe("useDifficultyStore", () => {
    beforeEach(() => {
        useDifficultyStore.setState({ level: MIN_BOT_LEVEL });
    });

    it("starts at the minimum bot level", () => {
        expect(useDifficultyStore.getState().level).toBe(MIN_BOT_LEVEL);
    });

    it("sets the level when within bounds", () => {
        useDifficultyStore.getState().setLevel(2);
        expect(useDifficultyStore.getState().level).toBe(2);
    });

    it("clamps to MAX_BOT_LEVEL when given a level above the max", () => {
        useDifficultyStore.getState().setLevel(999);
        expect(useDifficultyStore.getState().level).toBe(MAX_BOT_LEVEL);
    });

    it("clamps to MIN_BOT_LEVEL when given a level below the min", () => {
        useDifficultyStore.getState().setLevel(-5);
        expect(useDifficultyStore.getState().level).toBe(MIN_BOT_LEVEL);
    });

    it("clamps to MIN_BOT_LEVEL for zero", () => {
        useDifficultyStore.getState().setLevel(0);
        expect(useDifficultyStore.getState().level).toBe(MIN_BOT_LEVEL);
    });
});
