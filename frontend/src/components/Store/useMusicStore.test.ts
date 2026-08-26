import { describe, it, expect, beforeEach } from "vitest";
import { useMusicStore } from "./useMusicStore";

const initialState = useMusicStore.getState();

describe("useMusicStore", () => {
    beforeEach(() => {
        useMusicStore.setState(initialState, true);
        window.localStorage.clear();
    });

    it("has the expected initial state for both music channels", () => {
        const { Musics } = useMusicStore.getState();
        expect(Musics.game_sfx_on).toMatchObject({
            isMusicOn: true,
            volume: 0.5,
            key: "game_sfx_on",
            keyVolume: "game_sfx_volume",
        });
        expect(Musics.snake_music_on).toMatchObject({
            isMusicOn: true,
            volume: 0.5,
            key: "snake_music_on",
            keyVolume: "snake_music_volume",
        });
    });

    describe("toggleMusic", () => {
        it("flips isMusicOn for the given channel only", () => {
            useMusicStore.getState().toggleMusic("game_sfx_on");

            const { Musics } = useMusicStore.getState();
            expect(Musics.game_sfx_on.isMusicOn).toBe(false);
            expect(Musics.snake_music_on.isMusicOn).toBe(true);
        });

        it("persists the new value to localStorage under the channel's key", () => {
            useMusicStore.getState().toggleMusic("snake_music_on");
            expect(window.localStorage.getItem("snake_music_on")).toBe("false");
        });
    });

    describe("setMusicOn", () => {
        it("sets isMusicOn to the given value and persists it", () => {
            useMusicStore.getState().setMusicOn(false, "game_sfx_on");
            expect(useMusicStore.getState().Musics.game_sfx_on.isMusicOn).toBe(false);
            expect(window.localStorage.getItem("game_sfx_on")).toBe("false");

            useMusicStore.getState().setMusicOn(true, "game_sfx_on");
            expect(useMusicStore.getState().Musics.game_sfx_on.isMusicOn).toBe(true);
            expect(window.localStorage.getItem("game_sfx_on")).toBe("true");
        });
    });

    describe("setVolume", () => {
        it("sets the volume and persists it", () => {
            useMusicStore.getState().setVolume(0.8, "game_sfx_on");
            expect(useMusicStore.getState().Musics.game_sfx_on.volume).toBe(0.8);
            expect(window.localStorage.getItem("game_sfx_volume")).toBe("0.8");
        });

        it("clamps values above 1 down to 1", () => {
            useMusicStore.getState().setVolume(5, "snake_music_on");
            expect(useMusicStore.getState().Musics.snake_music_on.volume).toBe(1);
            expect(window.localStorage.getItem("snake_music_volume")).toBe("1");
        });

        it("clamps values below 0 up to 0", () => {
            useMusicStore.getState().setVolume(-2, "snake_music_on");
            expect(useMusicStore.getState().Musics.snake_music_on.volume).toBe(0);
            expect(window.localStorage.getItem("snake_music_volume")).toBe("0");
        });
    });

    describe("hydrate", () => {
        it("reads isMusicOn=true default when nothing is stored", () => {
            useMusicStore.getState().hydrate("game_sfx_on");
            expect(useMusicStore.getState().Musics.game_sfx_on.isMusicOn).toBe(true);
        });

        it("reads a stored 'false' value for isMusicOn", () => {
            window.localStorage.setItem("game_sfx_on", "false");
            useMusicStore.getState().hydrate("game_sfx_on");
            expect(useMusicStore.getState().Musics.game_sfx_on.isMusicOn).toBe(false);
        });

        it("reads a stored volume and clamps it into [0,1]", () => {
            window.localStorage.setItem("game_sfx_volume", "0.9");
            useMusicStore.getState().hydrate("game_sfx_on");
            expect(useMusicStore.getState().Musics.game_sfx_on.volume).toBe(0.9);
        });

        it("falls back to volume 0.5 when the stored value is not a finite number", () => {
            window.localStorage.setItem("game_sfx_volume", "not-a-number");
            useMusicStore.getState().hydrate("game_sfx_on");
            expect(useMusicStore.getState().Musics.game_sfx_on.volume).toBe(0.5);
        });

        it("falls back to volume 0.5 when nothing is stored", () => {
            useMusicStore.getState().hydrate("snake_music_on");
            expect(useMusicStore.getState().Musics.snake_music_on.volume).toBe(0.5);
        });
    });
});
