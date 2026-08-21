import { RefObject, useEffect } from "react";
import { GameCanvasStore } from "@/src/components/Store/GameCanvasStore";
import { drawGame } from "@/src/components/Arena/utils/drawGame";

const MAX_EXTRAPOLATION = 1;

interface UseAnimationLoopParams {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    myUserId: string | number | undefined;
}

export function AnimationLoop({ canvasRef, myUserId }: UseAnimationLoopParams) {
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d') ?? null;
        if (!ctx) return;

        let rafId: number;

        const frame = (now: number) => {
            const store = GameCanvasStore.getState();
            const elapsed = (now - store.stateTime) / 1000;
            const alpha = Math.min(elapsed / store.stepSeconds, MAX_EXTRAPOLATION);
            store.setAlpha(alpha);

            const { currGame, prevGame, screen, step } = GameCanvasStore.getState();
            if (currGame) {
                drawGame({ ctx, curr: currGame, prev: prevGame, alpha, step, screen, myUserId });
            }

            rafId = requestAnimationFrame(frame);
        };

        rafId = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(rafId);
    }, [canvasRef, myUserId]);
}
