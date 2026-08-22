'use client'

import { useEffect }                        from "react";
import { useAuth }                          from "@/src/components/Provider/UserProvider";
import { ArenaStore, ArenaMode }            from "@/src/components/Store/ArenaStore";
import { DifficultyStore }                  from "@/src/components/Store/DifficultyStore";
import { useSocket }                        from "@/src/components/Socket/Socket";
import ArenaHeader                          from "./ArenaHeader/ArenaHeader";
import ArenaControls                        from "./ArenaControls";
import GameBoard                            from "./AremaBoard/GameBoard";
import Sidebar                              from "./ArenaSidebar/Sidebar";
import LevelSelector                        from "./LevelSelector";


export default function Arena({ initialMode }: { initialMode: ArenaMode }) {

    const {cntUser} = useAuth()
    const socket = useSocket()
    const AR_STORE = ArenaStore();
    const mode = initialMode;
    const level = DifficultyStore((s) => s.level);

    useEffect(() => {
        AR_STORE.setMode(mode);
        AR_STORE.resetArena();
        if (!socket) return;

        socket.emit("get-online-users");
        if (mode === "AI")
            socket.emit("play-AI", { level });
        else {
            const rematchRoomId = AR_STORE.rematchRoomId;
            if (rematchRoomId) {
                socket.emit("rematch", { roomId: rematchRoomId });
                AR_STORE.setRematchRoomId(null);
            } else {
                const pendingRoomId = AR_STORE.pendingRoomId;
                socket.emit("join-room", pendingRoomId ? { roomId: pendingRoomId } : undefined);
                if (pendingRoomId) AR_STORE.setPendingRoomId(null);
            }
        }

        return () => {
            if (!socket) return;
            socket.emit("leave-room");
        };
    }, [AR_STORE.setRoomState, mode, level]);

    return (
        <div className={`relative min-h-screen w-full ${cntUser?.theme ?? true ?  "bg text-gray-200 " : "bg-gray-200 text-black"} p-2`}>
            {AR_STORE.sidebarOpen ? (<div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"  onClick={() => AR_STORE.setSidebarOpen(false)}  /> ) : (null)}

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] w-full min-h-screen">
                <div className="min-w-0 flex flex-col p-4 lg:p-6 lg:pr-5 ">
                    <ArenaHeader />
                    {mode === "AI" && <LevelSelector />}
                    <GameBoard />
                    <ArenaControls />
                </div>
                 <div className={`${cntUser?.theme ?? true ? " lg:bg-gray-900/95 lg:border-gray-800" : ""}`}>
                    <Sidebar />
                 </div>
            </div>
        </div>
    );
}