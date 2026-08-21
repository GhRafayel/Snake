'use client'

import { useEffect }        from "react";
import { Loader }           from "lucide-react";
import { ArenaStore }       from "@/src/components/Store/ArenaStore";
import { useAuth }          from "@/src/components/Provider/UserProvider";
import { LanguageStore }    from "@/src/components/Store/LanguageStore";
import { ArenaBoardType }   from "@/src/types/GameTypes/GameTypes";
import GameCanvas           from "./GameCanvas";

type RoomStatus = keyof ArenaBoardType;

export default function GameBoard() {

    const roomState = ArenaStore((s) => s.roomState);
    const countdownSeconds = ArenaStore((s) => s.countdownSeconds);
    const gameState = ArenaStore((s) => s.gameState);
    const AR_LENG : ArenaBoardType = LanguageStore((state) => state.translations.Arena.board);
    const {cntUser } = useAuth();
    const rawStatus = roomState?.roomStatus;
    const status = roomState ? AR_LENG[roomState.roomStatus as RoomStatus] : AR_LENG.connecting;
    const isGameOver = gameState === "WIN" || gameState === "OVER" || gameState === "END";

    useEffect(() => {
        if (rawStatus !== "STARTING") return;
        const id = setInterval(() => {
            ArenaStore.getState().setCountdownSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
        }, 1000);
        return () => clearInterval(id);
    }, [rawStatus]);

    return (
        <div id="canvas-container" className="col-span-4 h-[calc(100vh-250px)] flex flex-col items-center justify-start mt-2">
            {
                (rawStatus === "PLAYING" || isGameOver) ?
                (
                    <GameCanvas />
                ) :
                (
                    <div className={`flex flex-col items-center justify-center gap-3 w-full h-full ${cntUser?.theme ?? true ? "bg-gray-700 " : "bg-gray-300"} rounded-xl border border-white/5 ${cntUser?.theme ?? true ? "text-green-400" : "text-blue-600"}`}>
                        <Loader className="w-15 h-15 animate-spin" />
                        <span>{status}</span>
                        {rawStatus === "STARTING" && countdownSeconds !== null && (
                            <span className="text-2xl font-bold tabular-nums">{countdownSeconds}s</span>
                        )}
                    </div>
                )
            }
        </div>
    );
}
