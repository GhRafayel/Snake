'use client'

import { useEffect }                        from "react";
import { useAuth }                          from "@/src/components/Provider/UserProvider";
import { useArenaStore, ArenaModeType }     from "@/src/components/Store/useArenaStore";
import { useDifficultyStore }               from "@/src/components/Store/useDifficultyStore";
import { useSocket }                        from "@/src/components/Socket/Socket";
import ArenaHeader                          from "./ArenaHeader/ArenaHeader";
import GameBoard                            from "./AremaBoard/GameBoard";
import Sidebar                              from "./ArenaSidebar/Sidebar";
import LevelSelector                        from "./LevelSelector";


export default function Arena({ initialMode }: { initialMode: ArenaModeType }) {

    const {cntUser} = useAuth()
    const socket = useSocket()
    const AR_STORE = useArenaStore();
    const mode = initialMode;
    const level = useDifficultyStore((s) => s.level);

    useEffect(() => {
        const arena = useArenaStore.getState();
        arena.setMode(mode);
        arena.resetArena();
        if (!socket) return;

        socket.emit("get-online-users");
        if (mode === "AI")
            socket.emit("play-AI", { level });
        else {
            const rematchRoomId = arena.rematchRoomId;
            if (rematchRoomId) {
                socket.emit("rematch", { roomId: rematchRoomId });
                arena.setRematchRoomId(null);
            } else {
                const pendingRoomId = arena.pendingRoomId;
                socket.emit("join-room", pendingRoomId ? { roomId: pendingRoomId } : undefined);
                if (pendingRoomId) arena.setPendingRoomId(null);
            }
        }

        return () => {
            if (!socket) return;
            socket.emit("leave-room");
        };
    }, [mode, level, socket]);

    return (
        <div className={`relative min-h-screen w-full ${cntUser?.theme ?? true ?  "bg text-gray-200 " : "bg-gray-200 text-black"} p-2`}>
            {AR_STORE.sidebarOpen ? (<div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"  onClick={() => AR_STORE.setSidebarOpen(false)}  /> ) : (null)}

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] w-full min-h-screen">
                <div className="min-w-0 flex flex-col p-4 lg:p-6 lg:pr-5 ">
                    <ArenaHeader />
                    {mode === "AI" && <LevelSelector />}
                    <GameBoard />
                </div>
                 <div className={`${cntUser?.theme ?? true ? " lg:bg-gray-900/95 lg:border-gray-800" : ""}`}>
                    <Sidebar />
                 </div>
            </div>
        </div>
    );
}