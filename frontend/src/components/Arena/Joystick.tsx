'use client'

import { useRef, useState } from "react";
import { MoveDirectionType } from "./hooks/DirectionControl";

const BASE_SIZE = 150;
const KNOB_SIZE = 60;
const MAX_TRAVEL = (BASE_SIZE - KNOB_SIZE) / 2;
// Finger must move this far from the center before a direction is picked.
const DEAD_ZONE = 18;

// Virtual analog stick: drag the knob, the dominant axis becomes the snake's direction.
export default function Joystick({ onDirection }: { onDirection: (dir: MoveDirectionType) => void }) {
    const baseRef = useRef<HTMLDivElement>(null);
    const lastDir = useRef<MoveDirectionType | null>(null);
    const [knob, setKnob] = useState({ x: 0, y: 0 });
    const [active, setActive] = useState(false);

    const handleMove = (clientX: number, clientY: number) => {
        const rect = baseRef.current?.getBoundingClientRect();
        if (!rect) return;
        const dx = clientX - (rect.left + rect.width / 2);
        const dy = clientY - (rect.top + rect.height / 2);
        const dist = Math.hypot(dx, dy);

        const scale = dist > MAX_TRAVEL ? MAX_TRAVEL / dist : 1;
        setKnob({ x: dx * scale, y: dy * scale });

        if (dist < DEAD_ZONE) return;
        const dir: MoveDirectionType = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 'RIGHT' : 'LEFT')
            : (dy > 0 ? 'DOWN' : 'UP');
        // Only emit on change, otherwise every pointermove would spam the socket.
        if (dir !== lastDir.current) {
            lastDir.current = dir;
            onDirection(dir);
        }
    };

    const release = () => {
        setActive(false);
        setKnob({ x: 0, y: 0 });
        lastDir.current = null;
    };

    return (
        <div
            ref={baseRef}
            onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                setActive(true);
                handleMove(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => { if (active) handleMove(e.clientX, e.clientY); }}
            onPointerUp={release}
            onPointerCancel={release}
            onContextMenu={(e) => e.preventDefault()}
            style={{ width: BASE_SIZE, height: BASE_SIZE }}
            className="relative rounded-full bg-gray-800/70 border-2 border-white/10 touch-none select-none"
        >
            <div
                style={{
                    width: KNOB_SIZE,
                    height: KNOB_SIZE,
                    transform: `translate(${knob.x}px, ${knob.y}px)`,
                    left: (BASE_SIZE - KNOB_SIZE) / 2 - 2,
                    top: (BASE_SIZE - KNOB_SIZE) / 2 - 2,
                }}
                className={`absolute rounded-full shadow-lg pointer-events-none
                    ${active ? 'bg-indigo-500' : 'bg-indigo-600/80 transition-transform duration-150'}`}
            />
        </div>
    );
}
