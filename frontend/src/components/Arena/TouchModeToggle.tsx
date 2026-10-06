'use client'

import { useEffect } from "react";
import { Joystick as JoystickIcon, Gamepad2 } from "lucide-react";
import { useAuth } from "../Provider/UserProvider";
import { useTouchControlStore, TouchModeType } from "@/src/components/Store/useTouchControlStore";

const MODES: { mode: TouchModeType; Icon: typeof Gamepad2; label: string }[] = [
    { mode: 'joystick', Icon: JoystickIcon, label: 'Joystick' },
    { mode: 'buttons',  Icon: Gamepad2,     label: 'Buttons' },
];

// Joystick / buttons switch, styled like LevelSelector. Only shown on touch devices.
export default function TouchModeToggle() {
    const { cntUser } = useAuth();
    const mode = useTouchControlStore((s) => s.mode);
    const setMode = useTouchControlStore((s) => s.setMode);
    const dark = cntUser?.theme ?? true;

    useEffect(() => { useTouchControlStore.getState().loadSavedMode(); }, []);

    return (
        <div className={`hidden pointer-coarse:flex gap-1 rounded-full p-1 ${dark ? "bg-gray-700" : "bg-gray-300"}`}>
            {MODES.map(({ mode: m, Icon, label }) => {
                const active = mode === m;
                return (
                    <button
                        key={m}
                        type="button"
                        aria-pressed={active}
                        aria-label={label}
                        onClick={() => setMode(m)}
                        className={`flex items-center px-2.5 py-1 rounded-full transition-colors ${
                            active
                                ? dark ? "bg-green-600 text-white" : "bg-blue-400 text-gray-800"
                                : dark ? "text-gray-300" : "text-gray-700"
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                    </button>
                );
            })}
        </div>
    );
}
