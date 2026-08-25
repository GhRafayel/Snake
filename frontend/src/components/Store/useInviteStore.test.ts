import { describe, it, expect, beforeEach } from "vitest";
import { useInviteStore } from "./useInviteStore";
import { RoomInviteType } from "@/src/types/GameTypes/GameTypes";

function makeInvite(overrides: Partial<RoomInviteType> = {}): RoomInviteType {
    return {
        roomId: "room-1",
        from: { id: 1, Username: "alice" },
        ...overrides,
    };
}

describe("useInviteStore", () => {
    beforeEach(() => {
        useInviteStore.setState({ invites: [] });
    });

    it("starts with no invites", () => {
        expect(useInviteStore.getState().invites).toEqual([]);
    });

    it("addInvite appends a new invite", () => {
        const invite = makeInvite();
        useInviteStore.getState().addInvite(invite);
        expect(useInviteStore.getState().invites).toEqual([invite]);
    });

    it("addInvite deduplicates on matching roomId + from.id", () => {
        const invite = makeInvite();
        useInviteStore.getState().addInvite(invite);
        useInviteStore.getState().addInvite(makeInvite());

        expect(useInviteStore.getState().invites).toHaveLength(1);
    });

    it("addInvite treats different roomId as a distinct invite", () => {
        useInviteStore.getState().addInvite(makeInvite({ roomId: "room-1" }));
        useInviteStore.getState().addInvite(makeInvite({ roomId: "room-2" }));

        expect(useInviteStore.getState().invites).toHaveLength(2);
    });

    it("addInvite treats different from.id as a distinct invite", () => {
        useInviteStore.getState().addInvite(makeInvite({ from: { id: 1, Username: "alice" } }));
        useInviteStore.getState().addInvite(makeInvite({ from: { id: 2, Username: "bob" } }));

        expect(useInviteStore.getState().invites).toHaveLength(2);
    });

    it("removeInvite removes only the matching roomId + fromId pair", () => {
        const a = makeInvite({ roomId: "room-1", from: { id: 1, Username: "alice" } });
        const b = makeInvite({ roomId: "room-2", from: { id: 2, Username: "bob" } });
        useInviteStore.setState({ invites: [a, b] });

        useInviteStore.getState().removeInvite("room-1", 1);

        expect(useInviteStore.getState().invites).toEqual([b]);
    });

    it("removeInvite is a no-op when nothing matches", () => {
        const a = makeInvite({ roomId: "room-1", from: { id: 1, Username: "alice" } });
        useInviteStore.setState({ invites: [a] });

        useInviteStore.getState().removeInvite("room-999", 999);

        expect(useInviteStore.getState().invites).toEqual([a]);
    });

    it("clearInvites empties the list", () => {
        useInviteStore.setState({ invites: [makeInvite(), makeInvite({ roomId: "room-2" })] });
        useInviteStore.getState().clearInvites();
        expect(useInviteStore.getState().invites).toEqual([]);
    });
});
