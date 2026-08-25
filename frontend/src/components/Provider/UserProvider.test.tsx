import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserProvider, { useAuth } from "./UserProvider";
import { Lib } from "@/src/lib/lib";
import { UserType } from "@/src/types/UserTypes/UserTypes";
import { TranslationType } from "@/src/types/StoreTypes/StoreTypes";

vi.mock("@/src/lib/lib", () => ({
    Lib: {
        patchRequest: vi.fn(),
    },
}));

const baseUser = {
    id: 1,
    Username: "alice",
    language: "en",
    role: "PLAYER",
    color: null,
    avatar: "",
    theme: false,
    termsAcceptedAt: null,
    history: { gamesLost: 0, gamesWon: 0, totalScore: 0 },
} as unknown as UserType;

const baseTranslations = { Header: { a: "Arena" } } as unknown as TranslationType;

function Consumer() {
    const { cntUser, LENUAGE, ChangingCallback } = useAuth();
    return (
        <div>
            <span data-testid="username">{cntUser?.Username ?? "none"}</span>
            <span data-testid="header-a">{(LENUAGE as { Header: { a: string } }).Header.a}</span>
            <button onClick={() => ChangingCallback({ Username: "bob" }, "change-username")}>
                update
            </button>
            <button onClick={() => ChangingCallback(undefined, "me")}>refresh-me</button>
            <button onClick={() => ChangingCallback(undefined, "lang")}>refresh-lang</button>
        </div>
    );
}

describe("UserProvider / useAuth", () => {
    beforeEach(() => {
        vi.mocked(Lib.patchRequest).mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("throws when useAuth is used outside of the provider", () => {
        function Bare() {
            useAuth();
            return null;
        }
        // suppress React's expected error logging for this negative test
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => render(<Bare />)).toThrow("useAuth must be used inside UserProvider");
        spy.mockRestore();
    });

    it("exposes the initialUser and initialTranslations props as initial context state", () => {
        render(
            <UserProvider initialUser={baseUser} initialTranslations={baseTranslations}>
                <Consumer />
            </UserProvider>
        );

        expect(screen.getByTestId("username").textContent).toBe("alice");
        expect(screen.getByTestId("header-a").textContent).toBe("Arena");
    });

    it("supports a null initialUser", () => {
        render(
            <UserProvider initialUser={null} initialTranslations={baseTranslations}>
                <Consumer />
            </UserProvider>
        );

        expect(screen.getByTestId("username").textContent).toBe("none");
    });

    it("ChangingCallback with a body PATCHes the endpoint and replaces cntUser with the response", async () => {
        vi.mocked(Lib.patchRequest).mockResolvedValue({
            json: async () => ({ ...baseUser, Username: "bob" }),
        } as Response);

        const user = userEvent.setup();
        render(
            <UserProvider initialUser={baseUser} initialTranslations={baseTranslations}>
                <Consumer />
            </UserProvider>
        );

        await user.click(screen.getByText("update"));

        await waitFor(() => expect(screen.getByTestId("username").textContent).toBe("bob"));
        expect(Lib.patchRequest).toHaveBeenCalledWith(
            "/api/edit?path=/users/change-username",
            { Username: "bob" }
        );
    });

    it("ChangingCallback with no body and endpoint 'me' GETs the user and updates cntUser", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            json: async () => ({ ...baseUser, Username: "charlie" }),
        });
        vi.stubGlobal("fetch", fetchMock);

        const user = userEvent.setup();
        render(
            <UserProvider initialUser={baseUser} initialTranslations={baseTranslations}>
                <Consumer />
            </UserProvider>
        );

        await user.click(screen.getByText("refresh-me"));

        await waitFor(() => expect(screen.getByTestId("username").textContent).toBe("charlie"));
        expect(fetchMock).toHaveBeenCalledWith("/api/edit?path=/users/me");
    });

    it("ChangingCallback with no body and a non-'me' endpoint updates LENUAGE instead of cntUser", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            json: async () => ({ Header: { a: "Arene" } }),
        });
        vi.stubGlobal("fetch", fetchMock);

        const user = userEvent.setup();
        render(
            <UserProvider initialUser={baseUser} initialTranslations={baseTranslations}>
                <Consumer />
            </UserProvider>
        );

        await user.click(screen.getByText("refresh-lang"));

        await waitFor(() => expect(screen.getByTestId("header-a").textContent).toBe("Arene"));
        // username should be unaffected by a translations refresh
        expect(screen.getByTestId("username").textContent).toBe("alice");
    });

    it("sets cntUser to null when a no-body 'me' refresh fails", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

        const user = userEvent.setup();
        render(
            <UserProvider initialUser={baseUser} initialTranslations={baseTranslations}>
                <Consumer />
            </UserProvider>
        );

        await user.click(screen.getByText("refresh-me"));

        await waitFor(() => expect(screen.getByTestId("username").textContent).toBe("none"));
    });

    it("leaves LENUAGE untouched when a no-body non-'me' refresh fails", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

        const user = userEvent.setup();
        render(
            <UserProvider initialUser={baseUser} initialTranslations={baseTranslations}>
                <Consumer />
            </UserProvider>
        );

        await user.click(screen.getByText("refresh-lang"));

        // give any pending microtasks a chance to flush
        await waitFor(() => expect(screen.getByTestId("username").textContent).toBe("alice"));
        expect(screen.getByTestId("header-a").textContent).toBe("Arena");
    });
});
