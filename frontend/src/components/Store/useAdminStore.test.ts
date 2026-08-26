import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useAdminStore } from "./useAdminStore";
import { Lib } from "@/src/lib/lib";
import { AdminUserType, AdminUpdateType } from "@/src/types/StoreTypes/StoreTypes";

vi.mock("@/src/lib/lib", () => ({
    Lib: {
        putRequest: vi.fn(),
    },
}));

const initialState = useAdminStore.getState();

function makeUser(overrides: Partial<AdminUserType> = {}): AdminUserType {
    return { id: 1, Username: "alice", Email: "alice@test.com", role: "PLAYER", ...overrides };
}

describe("useAdminStore", () => {
    beforeEach(() => {
        useAdminStore.setState(initialState, true);
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("has the expected initial state", () => {
        const state = useAdminStore.getState();
        expect(state.query).toBe("");
        expect(state.results).toEqual([]);
        expect(state.listLoading).toBe(false);
        expect(state.listError).toBe("");
        expect(state.selectedUser).toBeNull();
        expect(state.detailLoading).toBe(false);
        expect(state.saving).toBe(false);
        expect(state.deleting).toBe(false);
    });

    it("setQuery updates the query string", () => {
        useAdminStore.getState().setQuery("bob");
        expect(useAdminStore.getState().query).toBe("bob");
    });

    describe("searchUsers", () => {
        it("populates results on a successful response", async () => {
            const users = [makeUser()];
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => users }));

            await useAdminStore.getState().searchUsers("alice");

            const state = useAdminStore.getState();
            expect(state.results).toEqual(users);
            expect(state.listLoading).toBe(false);
            expect(state.listError).toBe("");
        });

        it("sets listError to 'forbidden' and clears results on a 403", async () => {
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));

            await useAdminStore.getState().searchUsers("alice");

            const state = useAdminStore.getState();
            expect(state.listError).toBe("forbidden");
            expect(state.results).toEqual([]);
        });

        it("sets listError to 'loadUsersFailed' on other non-ok statuses", async () => {
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

            await useAdminStore.getState().searchUsers("alice");

            expect(useAdminStore.getState().listError).toBe("loadUsersFailed");
        });

        it("sets listError to 'loadUsersFailed' when fetch throws", async () => {
            vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

            await useAdminStore.getState().searchUsers("alice");

            const state = useAdminStore.getState();
            expect(state.listError).toBe("loadUsersFailed");
            expect(state.results).toEqual([]);
            expect(state.listLoading).toBe(false);
        });
    });

    describe("selectUser", () => {
        it("loads and stores the selected user on success", async () => {
            const user = makeUser();
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => user }));

            await useAdminStore.getState().selectUser(1);

            const state = useAdminStore.getState();
            expect(state.selectedUser).toEqual(user);
            expect(state.detailLoading).toBe(false);
            expect(state.detailError).toBe("");
        });

        it("clears selectedUser and sets detailError to 'forbidden' on a 403", async () => {
            useAdminStore.setState({ selectedUser: makeUser() });
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));

            await useAdminStore.getState().selectUser(1);

            const state = useAdminStore.getState();
            expect(state.selectedUser).toBeNull();
            expect(state.detailError).toBe("forbidden");
        });

        it("sets detailError to 'loadUserFailed' when fetch throws", async () => {
            vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

            await useAdminStore.getState().selectUser(1);

            expect(useAdminStore.getState().detailError).toBe("loadUserFailed");
        });
    });

    it("clearSelectedUser resets selection and all error fields", () => {
        useAdminStore.setState({
            selectedUser: makeUser(),
            detailError: "forbidden",
            saveError: "saveFailed",
            deleteError: "deleteFailed",
        });

        useAdminStore.getState().clearSelectedUser();

        const state = useAdminStore.getState();
        expect(state.selectedUser).toBeNull();
        expect(state.detailError).toBe("");
        expect(state.saveError).toBe("");
        expect(state.deleteError).toBe("");
    });

    describe("saveUser", () => {
        const body: AdminUpdateType = { Username: "alice2", Email: "alice2@test.com" };

        it("updates selectedUser and the matching entry in results, returns true on success", async () => {
            const original = makeUser({ id: 1, Username: "alice" });
            const other = makeUser({ id: 2, Username: "bob" });
            const updated = makeUser({ id: 1, Username: "alice2" });
            useAdminStore.setState({ results: [original, other], selectedUser: original });

            vi.mocked(Lib.putRequest).mockResolvedValue({
                ok: true,
                json: async () => updated,
            } as Response);

            const result = await useAdminStore.getState().saveUser(1, body);

            expect(result).toBe(true);
            const state = useAdminStore.getState();
            expect(state.selectedUser).toEqual(updated);
            expect(state.results).toEqual([updated, other]);
            expect(state.saving).toBe(false);
        });

        it("returns false and sets 'forbidden' error on a 403 without mutating results", async () => {
            const original = makeUser({ id: 1 });
            useAdminStore.setState({ results: [original], selectedUser: original });
            vi.mocked(Lib.putRequest).mockResolvedValue({ ok: false, status: 403 } as Response);

            const result = await useAdminStore.getState().saveUser(1, body);

            expect(result).toBe(false);
            const state = useAdminStore.getState();
            expect(state.saveError).toBe("forbidden");
            expect(state.results).toEqual([original]);
        });

        it("returns false and sets 'saveFailed' when putRequest throws", async () => {
            vi.mocked(Lib.putRequest).mockRejectedValue(new Error("network"));

            const result = await useAdminStore.getState().saveUser(1, body);

            expect(result).toBe(false);
            expect(useAdminStore.getState().saveError).toBe("saveFailed");
            expect(useAdminStore.getState().saving).toBe(false);
        });
    });

    describe("deleteUser", () => {
        it("removes the user from results and clears selectedUser, returns true on success", async () => {
            const user = makeUser({ id: 1 });
            const other = makeUser({ id: 2 });
            useAdminStore.setState({ results: [user, other], selectedUser: user });
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

            const result = await useAdminStore.getState().deleteUser(1);

            expect(result).toBe(true);
            const state = useAdminStore.getState();
            expect(state.results).toEqual([other]);
            expect(state.selectedUser).toBeNull();
            expect(state.deleting).toBe(false);
        });

        it("returns false and sets 'forbidden' error on a 403 without mutating results", async () => {
            const user = makeUser({ id: 1 });
            useAdminStore.setState({ results: [user] });
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));

            const result = await useAdminStore.getState().deleteUser(1);

            expect(result).toBe(false);
            expect(useAdminStore.getState().deleteError).toBe("forbidden");
            expect(useAdminStore.getState().results).toEqual([user]);
        });

        it("returns false and sets 'deleteFailed' when fetch throws", async () => {
            vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

            const result = await useAdminStore.getState().deleteUser(1);

            expect(result).toBe(false);
            expect(useAdminStore.getState().deleteError).toBe("deleteFailed");
            expect(useAdminStore.getState().deleting).toBe(false);
        });

        it("calls fetch with the DELETE method", async () => {
            const fetchMock = vi.fn().mockResolvedValue({ ok: true });
            vi.stubGlobal("fetch", fetchMock);

            await useAdminStore.getState().deleteUser(42);

            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining("/admin/users/42"),
                { method: "DELETE" }
            );
        });
    });
});
