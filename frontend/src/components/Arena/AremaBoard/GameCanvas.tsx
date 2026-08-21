'use client';

import { useEffect, useRef }    from "react";
import { useSocket }            from '@/src/components/Socket/Socket';
import { useAuth }              from "@/src/components/Provider/UserProvider";
import { ArenaStore }           from "@/src/components/Store/ArenaStore";
import { GameCanvasStore }      from "@/src/components/Store/GameCanvasStore";
import { GameSocket }           from "../hooks/GameSocket";
import { KeyboardControls }     from "../hooks/KeyboardControls";
import { WindowFocusPause }     from "../hooks/WindowFocusPause";
import { CanvasResize }         from "../hooks/CanvasResize";
import { AnimationLoop }        from "../hooks/AnimationLoop";
import GameOverlay              from "./GameOverlay";

export default function GameCanvas() {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const socket = useSocket();
    const { cntUser } = useAuth();
    const setGameState = ArenaStore((s) => s.setGameState);

    useEffect(() => {
        GameCanvasStore.getState().resetGameCanvas();
        setGameState('START');
    }, [setGameState]);

    GameSocket({ socket, myUserId: cntUser?.id });
    KeyboardControls({ socket, myUserId: cntUser?.id });
    WindowFocusPause();
    CanvasResize(canvasRef, 'canvas-container');
    AnimationLoop({ canvasRef, myUserId: cntUser?.id });

    return (
        <div style={{ position: 'relative' }}>
            <canvas ref={canvasRef} className="rounded-xl border border-white/5 bg-[#1e2224]" />
            <GameOverlay />
        </div>
    );
}
