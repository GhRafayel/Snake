'use client'

import { useEffect }        from "react";
import { useRouter }        from "next/navigation";
import { ArenaStore }       from "@/src/components/Store/ArenaStore";
import { GameCanvasStore }  from "@/src/components/Store/GameCanvasStore";
import { useAuth }          from "@/src/components/Provider/UserProvider";
import { LanguageStore }    from "@/src/components/Store/LanguageStore";

export default function GameOverlay() {
    const gameState = ArenaStore((s) => s.gameState);
    const router = useRouter();
    const {ChangingCallback} = useAuth()
    const AR_LENG = LanguageStore((state) => state.translations.Arena.overlay);

    const showOver = gameState === 'OVER' || gameState === 'END';
    const showWin = gameState === 'WIN';

    useEffect(() => {
        if (showOver || showWin) ChangingCallback(undefined,"refreshUser");
    }, [showOver, showWin]);

    if (!showOver && !showWin) return null;

    function handleRestart() {
        const arena = ArenaStore.getState();
        if (arena.mode === 'online' && arena.roomState?.roomId) {
            arena.setRematchRoomId(arena.roomState.roomId);
        }
        GameCanvasStore.getState().setInternalGameState('END');
        arena.setGameState('END');
        router.push(`/server/arena?r=${Date.now()}`);
        ChangingCallback(undefined,"refreshUser");
        router.refresh();
    }

    return (
        <div
            style={{ position: 'absolute', inset: 0 }}
            className="flex flex-col items-center justify-center bg-black/60 rounded-xl"
        >
            <h2 className={`text-3xl font-bold mb-4 ${showWin ? 'text-green-400' : 'text-red-500'}`}>
                {showWin ? AR_LENG.win : AR_LENG.over}
            </h2>
            <button
                onClick={handleRestart}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
                {AR_LENG.tryAgain}
            </button>
        </div>
    );
}
