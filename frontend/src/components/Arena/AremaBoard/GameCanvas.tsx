'use client';

import { useEffect, useRef }    from "react";
import { useSocket }            from '@/src/components/Socket/Socket';
import { useAuth }              from "@/src/components/Provider/UserProvider";
import { useArenaStore }           from "@/src/components/Store/useArenaStore";
import { useGameCanvasStore }      from "@/src/components/Store/useGameCanvasStore";
import { GameSocket }           from "../hooks/GameSocket";
import { KeyboardControls }     from "../hooks/KeyboardControls";
import { WindowFocusPause }     from "../hooks/WindowFocusPause";
import { useCanvasResize }         from "../hooks/useCanvasResize";
import { useAnimationLoop }        from "../hooks/useAnimationLoop";
import GameOverlay              from "./GameOverlay";
import ArenaControls from "../ArenaControls";
export default function GameCanvas() {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const socket = useSocket();
    const { cntUser } = useAuth();
    const setGameState = useArenaStore((s) => s.setGameState);

    useEffect(() => {
        useGameCanvasStore.getState().resetGameCanvas();
        setGameState('START');
    }, [setGameState]);

    GameSocket({ socket, myUserId: cntUser?.id });
    KeyboardControls({ socket, myUserId: cntUser?.id });
    WindowFocusPause();
    useCanvasResize(canvasRef, 'canvas-container');
    useAnimationLoop({ canvasRef, myUserId: cntUser?.id });

    return (
        <div style={{ position: 'relative' }}>
            <canvas ref={canvasRef} className="rounded-xl border border-white/5 bg-[#1e2224]" />
            

            <GameOverlay />
            <ArenaControls />
        </div>
    );
}
