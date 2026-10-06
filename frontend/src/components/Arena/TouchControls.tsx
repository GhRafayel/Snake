'use client'

import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useArenaStore } from "@/src/components/Store/useArenaStore";
import { useTouchControlStore } from "@/src/components/Store/useTouchControlStore";
import { MoveDirectionType } from "./hooks/DirectionControl";
import Joystick from "./Joystick";

const BUTTONS: { dir: MoveDirectionType; Icon: typeof ChevronUp; area: string }[] = [
    { dir: 'UP',    Icon: ChevronUp,    area: 'col-start-2 row-start-1' },
    { dir: 'LEFT',  Icon: ChevronLeft,  area: 'col-start-1 row-start-2' },
    { dir: 'RIGHT', Icon: ChevronRight, area: 'col-start-3 row-start-2' },
    { dir: 'DOWN',  Icon: ChevronDown,  area: 'col-start-2 row-start-3' },
];

// On-screen controls, only rendered visible on touch devices (coarse pointer).
// The joystick / buttons choice is made with TouchModeToggle next to the level selector.
export default function TouchControls({ onDirection }: { onDirection: (dir: MoveDirectionType) => void }) {
    const gameDir = useArenaStore((s) => s.gameDir);
    const mode = useTouchControlStore((s) => s.mode);

    return (
        <div className="hidden pointer-coarse:flex justify-center w-full mt-3 touch-none select-none">
            {mode === 'joystick' ? (
                <Joystick onDirection={onDirection} />
            ) : (
                <div className="grid grid-cols-3 grid-rows-3 gap-2 w-40 h-40">
                    {BUTTONS.map(({ dir, Icon, area }) => (
                        <button
                            key={dir}
                            type="button"
                            aria-label={dir.toLowerCase()}
                            // pointerdown instead of click: reacts immediately, no 300ms tap delay.
                            onPointerDown={(e) => { e.preventDefault(); onDirection(dir); }}
                            onContextMenu={(e) => e.preventDefault()}
                            className={`${area} flex items-center justify-center rounded-xl border border-white/10 transition-transform active:scale-90
                                ${gameDir === dir ? 'bg-indigo-600 text-white' : 'bg-gray-800/80 text-gray-200'}`}
                        >
                            <Icon className="w-8 h-8" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
