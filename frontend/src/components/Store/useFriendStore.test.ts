import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useFriendStore } from "./useFriendStore";
import { useArenaStore } from "./useArenaStore";
import { Lib } from "@/src/lib/lib";
import { FriendType } from "@/src/types/FriendTypes/FriendTypes";

vi.mock("@/src/lib/lib", () => ({
    Lib: {
        patchRequest: vi.fn(),
    },
}));

const initialState = useFriendStore.getState();

function makeFriend(overrides: Partial<FriendType> = {}): FriendType {
    return {
        id: 1,
        Username: "alice",
        score: 0,
        requestId: 100,
        status: "PENDING",
        senderId: 1,
        isOnline: false,
        ...overrides,
    };
}

describe("useFriendStore", () => {
    beforeEach(() => {
        useFriendStore.setState(initialState, true);
        vi.mocked(Lib.patchRequest).mockReset().mockResolvedValue({ ok: true } as Response);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it("starts with empty friends and invited lists", () => {
        const state = useFriendStore.getState();
        expect(state.friends).toEqual([]);
        expect(state.invited).toEqual([]);
    });

    describe("fetchFriends", () => {
        it("populates friends on a successful response", async () => {
            const friends = [makeFriend()];
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => friends }));

            await useFriendStore.getState().fetchFriends();

            expect(useFriendStore.getState().friends).toEqual(friends);
        });

        it("leaves friends untouched when the response is not ok", async () => {
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

            await useFriendStore.getState().fetchFriends();

            expect(useFriendStore.getState().friends).toEqual([]);
        });

        it("does not throw when fetch rejects", async () => {
            vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

            await expect(useFriendStore.getState().fetchFriends()).resolves.toBeUndefined();
            expect(useFriendStore.getState().friends).toEqual([]);
        });
    });

    describe("deleteFriend", () => {
        it("removes the friend from state when the API confirms deletion", async () => {
            const friend = makeFriend({ id: 1 });
            const other = makeFriend({ id: 2 });
            useFriendStore.setState({ friends: [friend, other] });
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => true }));

            await useFriendStore.getState().deleteFriend(1);

            expect(useFriendStore.getState().friends).toEqual([other]);
        });

        it("leaves friends untouched when the API returns a falsy result", async () => {
            const friend = makeFriend({ id: 1 });
            useFriendStore.setState({ friends: [friend] });
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => false }));

            await useFriendStore.getState().deleteFriend(1);

            expect(useFriendStore.getState().friends).toEqual([friend]);
        });
    });

    describe("acceptFriend", () => {
        it("marks the friend with matching requestId as ACCEPTED", async () => {
            const friend = makeFriend({ requestId: 5, status: "PENDING" });
            const other = makeFriend({ id: 2, requestId: 6, status: "PENDING" });
            useFriendStore.setState({ friends: [friend, other] });

            await useFriendStore.getState().acceptFriend(5);

            const state = useFriendStore.getState();
            expect(state.friends.find((f) => f.requestId === 5)?.status).toBe("ACCEPTED");
            expect(state.friends.find((f) => f.requestId === 6)?.status).toBe("PENDING");
            expect(Lib.patchRequest).toHaveBeenCalledWith(
                expect.stringContaining("/friends/request/5/accept"),
                {}
            );
        });

        it("does not throw when patchRequest rejects", async () => {
            vi.mocked(Lib.patchRequest).mockRejectedValue(new Error("network"));
            await expect(useFriendStore.getState().acceptFriend(5)).resolves.toBeUndefined();
        });
    });

    describe("rejectFriend", () => {
        it("removes the friend with matching requestId", async () => {
            const friend = makeFriend({ requestId: 5 });
            const other = makeFriend({ id: 2, requestId: 6 });
            useFriendStore.setState({ friends: [friend, other] });

            await useFriendStore.getState().rejectFriend(5);

            expect(useFriendStore.getState().friends).toEqual([other]);
        });
    });

    describe("cancelRequest", () => {
        it("removes the friend by id when the API confirms cancellation", async () => {
            const friend = makeFriend({ id: 3 });
            useFriendStore.setState({ friends: [friend] });
            const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => true });
            vi.stubGlobal("fetch", fetchMock);

            await useFriendStore.getState().cancelRequest(3);

            expect(useFriendStore.getState().friends).toEqual([]);
            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining("/friends/request"),
                expect.objectContaining({
                    method: "DELETE",
                    body: JSON.stringify({ receiverId: 3 }),
                })
            );
        });

        it("leaves friends untouched when the API returns a falsy result", async () => {
            const friend = makeFriend({ id: 3 });
            useFriendStore.setState({ friends: [friend] });
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => false }));

            await useFriendStore.getState().cancelRequest(3);

            expect(useFriendStore.getState().friends).toEqual([friend]);
        });
    });

    describe("handleInvite", () => {
        it("adds the friendId to invited and calls arena's inviteFriend, then clears it after 10s", () => {
            vi.useFakeTimers();
            const inviteFriendSpy = vi.spyOn(useArenaStore.getState(), "inviteFriend").mockImplementation(() => {});

            useFriendStore.getState().handleInvite(9);

            expect(inviteFriendSpy).toHaveBeenCalledWith(9);
            expect(useFriendStore.getState().invited).toEqual([9]);

            vi.advanceTimersByTime(10000);

            expect(useFriendStore.getState().invited).toEqual([]);
        });

        it("does not remove other pending invited ids when one expires", () => {
            vi.useFakeTimers();
            vi.spyOn(useArenaStore.getState(), "inviteFriend").mockImplementation(() => {});

            useFriendStore.getState().handleInvite(1);
            vi.advanceTimersByTime(5000);
            useFriendStore.getState().handleInvite(2);

            vi.advanceTimersByTime(5000); // total 10s since invite 1, 5s since invite 2
            expect(useFriendStore.getState().invited).toEqual([2]);

            vi.advanceTimersByTime(5000); // total 10s since invite 2
            expect(useFriendStore.getState().invited).toEqual([]);
        });
    });
});
