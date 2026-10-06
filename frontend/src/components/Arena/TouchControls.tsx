'use client'

import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Joystick as JoystickIcon, Grid2x2 } from "lucide-react";
import { useArenaStore } from "@/src/components/Store/useArenaStore";
import { MoveDirectionType } from "./hooks/DirectionControl";
import Joystick from "./Joystick";

type ButtonType = { dir: MoveDirectionType; Icon: typeof ChevronUp };
type TouchModeType = 'joystick' | 'buttons';

const MODE_STORAGE_KEY = 'snake-touch-mode';

// Split for two-thumb play: left thumb turns left/up, right thumb turns down/right.
const LEFT_THUMB: ButtonType[] = [
    { dir: 'LEFT', Icon: ChevronLeft },
    { dir: 'UP',   Icon: ChevronUp },
];
const RIGHT_THUMB: ButtonType[] = [
    { dir: 'DOWN',  Icon: ChevronDown },
    { dir: 'RIGHT', Icon: ChevronRight },
];

function readSavedMode(): TouchModeType {
    try {
        return localStorage.getItem(MODE_STORAGE_KEY) === 'buttons' ? 'buttons' : 'joystick';
    } catch {
        return 'joystick';
    }
}

// On-screen controls, only rendered visible on touch devices (coarse pointer).
export default function TouchControls({ onDirection }: { onDirection: (dir: MoveDirectionType) => void }) {
    const gameDir = useArenaStore((s) => s.gameDir);
    const [mode, setMode] = useState<TouchModeType>(readSavedMode);

    const toggleMode = () => {
        const next = mode === 'joystick' ? 'buttons' : 'joystick';
        setMode(next);
        try { localStorage.setItem(MODE_STORAGE_KEY, next); } catch { /* storage unavailable */ }
    };

    const renderButton = ({ dir, Icon }: ButtonType) => (
        <button
            key={dir}
            type="button"
            aria-label={dir.toLowerCase()}
            // pointerdown instead of click: reacts immediately, no 300ms tap delay.
            onPointerDown={(e) => { e.preventDefault(); onDirection(dir); }}
            onContextMenu={(e) => e.preventDefault()}
            className={`flex items-center justify-center w-18 h-18 rounded-2xl border border-white/10 transition-transform active:scale-90
                ${gameDir === dir ? 'bg-indigo-600 text-white' : 'bg-gray-800/80 text-gray-200'}`}
        >
            <Icon className="w-9 h-9" />
        </button>
    );

    return (
        <div className="hidden pointer-coarse:flex flex-col items-center w-full mt-3 gap-2 touch-none select-none">
            {mode === 'joystick' ? (
                <Joystick onDirection={onDirection} />
            ) : (
                <div className="flex justify-between items-center w-full">
                    <div className="flex gap-3">{LEFT_THUMB.map(renderButton)}</div>
                    <div className="flex gap-3">{RIGHT_THUMB.map(renderButton)}</div>
                </div>
            )}
            <button
                type="button"
                onClick={toggleMode}
                aria-label={mode === 'joystick' ? 'Switch to buttons' : 'Switch to joystick'}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/80 border border-white/10 text-gray-300 active:scale-90"
            >
                {mode === 'joystick' ? <Grid2x2 className="w-5 h-5" /> : <JoystickIcon className="w-5 h-5" />}
            </button>
        </div>
    );
}
