import { useEffect } from "react";
import { ArenaStore } from "@/src/components/Store/ArenaStore";
import { GameCanvasStore } from "@/src/components/Store/GameCanvasStore";

export function WindowFocusPause() {
    const setGameState = ArenaStore((s) => s.setGameState);

    useEffect(() => {
        const handleWindowBlur = () => {
            if (ArenaStore.getState().gameState === 'START') {
                GameCanvasStore.getState().setInternalGameState('PAUSE');
                setGameState('PAUSE');
            }
        };

        const handleWindowFocus = () => {
            if (ArenaStore.getState().gameState === 'PAUSE') {
                GameCanvasStore.getState().setInternalGameState('START');
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
