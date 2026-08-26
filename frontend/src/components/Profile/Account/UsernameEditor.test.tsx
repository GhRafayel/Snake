import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UsernameEditor from "./UsernameEditor";
import * as UserProviderModule from "@/src/components/Provider/UserProvider";
import { UserType } from "@/src/types/UserTypes/UserTypes";
import { TranslationType } from "@/src/types/StoreTypes/StoreTypes";

const user: UserType = {
    id: 1,
    Username: "alice",
    language: "en",
    role: "PLAYER",
    color: null,
    avatar: "",
    theme: false,
    termsAcceptedAt: null,
    history: { gamesLost: 0, gamesWon: 0, totalScore: 0 },
};

const translations = {
    Profile: {
        sub: "submit",
        settings: {
            username: { label: "Username", edit: "Edit" },
            secure: { close: "Close" },
            message: "The request could not be completed",
        },
    },
} as unknown as TranslationType;

function mockAuth(cntUser: UserType, changingCallback = vi.fn().mockResolvedValue(undefined)) {
    vi.spyOn(UserProviderModule, "useAuth").mockReturnValue({
        cntUser,
        LENUAGE: translations,
        ChangingCallback: changingCallback,
    });
    return changingCallback;
}

describe("UsernameEditor", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("renders the current username in view mode with an Edit button", () => {
        mockAuth(user);
        render(<UsernameEditor />);

        expect(screen.getByText("alice")).toBeInTheDocument();
        expect(screen.getByText("Edit")).toBeInTheDocument();
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("enters edit mode with the current username pre-filled when Edit is clicked", async () => {
        mockAuth(user);
        const u = userEvent.setup();
        render(<UsernameEditor />);

        await u.click(screen.getByText("Edit"));

        const input = screen.getByRole("textbox") as HTMLInputElement;
        expect(input.value).toBe("alice");
        expect(screen.getByText("submit")).toBeInTheDocument();
        expect(screen.getByText("Close")).toBeInTheDocument();
    });

    it("Close button exits edit mode without saving", async () => {
        const changingCallback = mockAuth(user);
        const u = userEvent.setup();
        render(<UsernameEditor />);

        await u.click(screen.getByText("Edit"));
        await u.clear(screen.getByRole("textbox"));
        await u.type(screen.getByRole("textbox"), "newname");
        await u.click(screen.getByText("Close"));

        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
        expect(screen.getByText("alice")).toBeInTheDocument();
        expect(changingCallback).not.toHaveBeenCalled();
    });

    it("submitting the form calls ChangingCallback with the trimmed username (refreshing the shared user context) and exits edit mode on success", async () => {
        const changingCallback = mockAuth(user);
        const u = userEvent.setup();
        render(<UsernameEditor />);

        await u.click(screen.getByText("Edit"));
        await u.clear(screen.getByRole("textbox"));
        await u.type(screen.getByRole("textbox"), "  newname  ");
        await u.click(screen.getByText("submit"));

        expect(changingCallback).toHaveBeenCalledWith({ Username: "newname" }, "change-username");
        expect(await screen.findByText("Edit")).toBeInTheDocument();
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("shows an error message and stays in edit mode when ChangingCallback rejects", async () => {
        const changingCallback = mockAuth(user, vi.fn().mockRejectedValue(new Error("failed")));
        const u = userEvent.setup();
        render(<UsernameEditor />);

        await u.click(screen.getByText("Edit"));
        await u.clear(screen.getByRole("textbox"));
        await u.type(screen.getByRole("textbox"), "newname");
        await u.click(screen.getByText("submit"));

        expect(await screen.findByText("The request could not be completed")).toBeInTheDocument();
        expect(screen.getByRole("textbox")).toBeInTheDocument();
        expect(changingCallback).toHaveBeenCalledWith({ Username: "newname" }, "change-username");
    });
});
