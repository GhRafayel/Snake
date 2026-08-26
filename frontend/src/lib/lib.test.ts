import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Lib, language } from "./lib";

function mockFetchOnce(response: Partial<Response> & { ok: boolean; status?: number; json?: () => Promise<unknown> }) {
    const fetchMock = vi.fn().mockResolvedValue(response as Response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

describe("Lib.postRequest", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("calls fetch with POST method, JSON content-type header, and stringified body", async () => {
        const fetchMock = mockFetchOnce({ ok: true });
        const body = { foo: "bar" };

        await Lib.postRequest("/api/thing", body);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith("/api/thing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    });

    it("resolves with the fetch response when the request succeeds (ok)", async () => {
        const fakeResponse = { ok: true, status: 200 };
        mockFetchOnce(fakeResponse);

        const res = await Lib.postRequest("/api/thing", {});

        expect(res).toMatchObject({ ok: true, status: 200 });
    });

    it("resolves with the fetch response even when it is a non-ok response (no throw)", async () => {
        const fakeResponse = { ok: false, status: 400 };
        mockFetchOnce(fakeResponse);

        const res = await Lib.postRequest("/api/thing", {});

        expect(res).toMatchObject({ ok: false, status: 400 });
    });

    it("throws a bare Error when fetch itself rejects (network failure)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

        await expect(Lib.postRequest("/api/thing", {})).rejects.toThrow(Error);
    });
});

describe("Lib.patchRequest", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("calls fetch with PATCH method, JSON content-type header, and stringified body", async () => {
        const fetchMock = mockFetchOnce({ ok: true });
        const body = { name: "new name" };

        await Lib.patchRequest("/api/thing/1", body);

        expect(fetchMock).toHaveBeenCalledWith("/api/thing/1", {
            method: "PATCH",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify(body),
        });
    });

    it("returns the response as-is on both ok and non-ok status", async () => {
        mockFetchOnce({ ok: false, status: 403 });
        const res = await Lib.patchRequest("/api/thing/1", {});
        expect(res).toMatchObject({ ok: false, status: 403 });
    });

    it("throws a bare Error when fetch rejects", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
        await expect(Lib.patchRequest("/api/thing/1", {})).rejects.toThrow(Error);
    });
});

describe("Lib.putRequest", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("calls fetch with PUT method, JSON content-type header, and stringified body", async () => {
        const fetchMock = mockFetchOnce({ ok: true });
        const body = { role: "ADMIN" };

        await Lib.putRequest("/api/admin/users/1", body);

        expect(fetchMock).toHaveBeenCalledWith("/api/admin/users/1", {
            method: "PUT",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify(body),
        });
    });

    it("returns the response as-is on both ok and non-ok status", async () => {
        mockFetchOnce({ ok: true, status: 200 });
        const res = await Lib.putRequest("/api/admin/users/1", {});
        expect(res).toMatchObject({ ok: true, status: 200 });
    });

    it("throws a bare Error when fetch rejects", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
        await expect(Lib.putRequest("/api/admin/users/1", {})).rejects.toThrow(Error);
    });
});

describe("Lib.getUser", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        process.env = { ...OLD_ENV, INTERNAL_API_URL: "http://internal-api" };
    });

    afterEach(() => {
        process.env = OLD_ENV;
        vi.unstubAllGlobals();
    });

    it("returns null immediately without calling fetch when accessToken is undefined", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        const result = await Lib.getUser(undefined);

        expect(result).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("fetches the current user with a Bearer auth header when token is provided", async () => {
        const user = { id: 1, Username: "test" };
        const fetchMock = mockFetchOnce({ ok: true, json: async () => user });

        const result = await Lib.getUser("token-123");

        expect(fetchMock).toHaveBeenCalledWith("http://internal-api/users/me", {
            method: "GET",
            headers: { Authorization: "Bearer token-123" },
        });
        expect(result).toEqual(user);
    });

    it("returns null when the response is not ok", async () => {
        mockFetchOnce({ ok: false, status: 401 });

        const result = await Lib.getUser("token-123");

        expect(result).toBeNull();
    });

    it("returns null (not throw) when fetch rejects", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

        const result = await Lib.getUser("token-123");

        expect(result).toBeNull();
    });
});

describe("Lib.getLanguage", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns the default language fallback immediately without calling fetch when key is null", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        const result = await Lib.getLanguage(null);

        expect(result).toBe(language);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("fetches translations for the given language key when ok", async () => {
        const translations = { Header: { a: "Arene" } };
        const fetchMock = mockFetchOnce({ ok: true, json: async () => translations });

        const result = await Lib.getLanguage("fr");

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining("/users/language/fr")
        );
        expect(result).toEqual(translations);
    });

    it("falls back to the default language when the response is not ok", async () => {
        mockFetchOnce({ ok: false, status: 404 });

        const result = await Lib.getLanguage("xx");

        expect(result).toBe(language);
    });

    it("falls back to the default language when fetch rejects", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

        const result = await Lib.getLanguage("fr");

        expect(result).toBe(language);
    });
});
