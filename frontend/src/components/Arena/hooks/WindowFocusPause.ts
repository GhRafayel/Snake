import { useEffect } from "react";
import { useArenaStore } from "@/src/components/Store/useArenaStore";
import { useGameCanvasStore } from "@/src/components/Store/useGameCanvasStore";

export function WindowFocusPause() {
    const setGameState = useArenaStore((s) => s.setGameState);

    useEffect(() => {
        const handleWindowBlur = () => {
            if (useArenaStore.getState().gameState === 'START') {
                useGameCanvasStore.getState().setInternalGameState('PAUSE');
                setGameState('PAUSE');
            }
        };

        const handleWindowFocus = () => {
            if (useArenaStore.getState().gameState === 'PAUSE') {
                useGameCanvasStore.getState().setInternalGameState('START');
                setGameState('START');
            }
        };

        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [setGameState]);
}
