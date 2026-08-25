import { describe, it, expect, beforeEach } from "vitest";
import { useUserStore } from "./useUserStore";
import { OnlineUsersType } from "@/src/types/UserTypes/UserTypes";

function makeUser(overrides: Partial<OnlineUsersType> = {}): OnlineUsersType {
    return {
        id: 1,
        Username: "alice",
        role: "PLAYER",
        history: { gamesWon: 0, gamesLost: 0, totalScore: 0 },
        ...overrides,
    };
}

describe("useUserStore", () => {
    beforeEach(() => {
        useUserStore.setState({ onlineUsers: [] });
    });

    it("starts with an empty onlineUsers list", () => {
        expect(useUserStore.getState().onlineUsers).toEqual([]);
    });

    it("setOnlineUsers replaces the whole list", () => {
        const users = [makeUser({ id: 1 }), makeUser({ id: 2 })];
        useUserStore.getState().setOnlineUsers(users);
        expect(useUserStore.getState().onlineUsers).toEqual(users);
    });

    it("addOnlineUser appends without touching existing entries", () => {
        const first = makeUser({ id: 1 });
        useUserStore.getState().setOnlineUsers([first]);

        const second = makeUser({ id: 2, Username: "bob" });
        useUserStore.getState().addOnlineUser(second);

        expect(useUserStore.getState().onlineUsers).toEqual([first, second]);
    });

    it("updateUser merges partial data into the matching user only", () => {
        const first = makeUser({ id: 1, Username: "alice" });
        const second = makeUser({ id: 2, Username: "bob" });
        useUserStore.getState().setOnlineUsers([first, second]);

        useUserStore.getState().updateUser(2, { Username: "bobby" });

        const state = useUserStore.getState().onlineUsers;
        expect(state.find((u) => u.id === 1)?.Username).toBe("alice");
        expect(state.find((u) => u.id === 2)?.Username).toBe("bobby");
    });

    it("updateUser is a no-op when no user matches the id", () => {
        const first = makeUser({ id: 1 });
        useUserStore.getState().setOnlineUsers([first]);

        useUserStore.getState().updateUser(999, { Username: "ghost" });

        expect(useUserStore.getState().onlineUsers).toEqual([first]);
    });
});
