import { RefObject, useEffect } from "react";
import { useGameCanvasStore } from "@/src/components/Store/useGameCanvasStore";
import { drawGame } from "@/src/components/Arena/utils/drawGame";

const MAX_EXTRAPOLATION = 1;

interface UseAnimationLoopParamsType {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    myUserId: string | number | undefined;
}

export function useAnimationLoop({ canvasRef, myUserId }: UseAnimationLoopParamsType) {
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d') ?? null;
        if (!ctx) return;

        let rafId: number;

        const frame = (now: number) => {
            const store = useGameCanvasStore.getState();
            const elapsed = (now - store.stateTime) / 1000;
            const alpha = Math.min(elapsed / store.stepSeconds, MAX_EXTRAPOLATION);
            store.setAlpha(alpha);

            const { currGame, prevGame, screen, step } = useGameCanvasStore.getState();
            if (currGame) {
                drawGame({ ctx, curr: currGame, prev: prevGame, alpha, step, screen, myUserId });
            }

            rafId = requestAnimationFrame(frame);
        };

        rafId = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(rafId);
    }, [canvasRef, myUserId]);
}
