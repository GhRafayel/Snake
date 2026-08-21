'use client'

import { useEffect }                        from "react";
import { UserStore }                        from "@/src/components/Store/UserStore";
import { ArenaStore }                       from "@/src/components/Store/ArenaStore";
import { DifficultyStore }                  from "@/src/components/Store/DifficultyStore";
import { LanguageStore }                    from "@/src/components/Store/LanguageStore";
import { GameCanvasStore }                  from "@/src/components/Store/GameCanvasStore";
import { OnlineUsersType }                  from "@/src/types/UserTypes/UserTypes";
import { ArenaFriends }                     from "@/src/components/Friends/ArenaFriends";
import { useSocket }                        from "@/src/components/Socket/Socket";
import { RoomStateType, RoomCountdownType } from "@/src/types/GameTypes/GameTypes";
import { getLeaderSnake, getRankedSnakes }  from "./utils/leaderboard";
import ArenaHeader                          from "./ArenaHeader/ArenaHeader";
import ArenaControls                        from "./ArenaControls";
import GameBoard                            from "./AremaBoard/GameBoard";
import Sidebar                              from "./ArenaSidebar/Sidebar";
import LevelSelector                        from "./LevelSelector";
import { useAuth } from "../Provider/UserProvider";


function Arena() {

    const socketRef = useSocket()
    const HD_LENG = LanguageStore((state) => state.translations.Header);
    const AR_STORE = ArenaStore();
    const mode = AR_STORE.mode;
    const {cntUser} = useAuth()
    const level = DifficultyStore((s) => s.level);
    const gameData = GameCanvasStore((state) => state.currGame);
    const {onlineUsers} = UserStore();
    const snakes = gameData?.snakes ?? [];
    const leader = getLeaderSnake(snakes);
    const ranked = getRankedSnakes(snakes);
    const nameFor = (userId: number) =>
        onlineUsers.find((u) => u.id === userId)?.Username ?? `${HD_LENG.plaseholder} ${userId}`;
    
    useEffect(() => {
        AR_STORE.resetArena();
        if (!socketRef) return;

        const handleOnlineUsers = (gameData: OnlineUsersType[]) => {
            UserStore.setState({ onlineUsers: gameData });
        };
        const handleRoomUpdate = (gameData: RoomStateType) => {
            AR_STORE.setRoomState({ ...gameData });
            if (gameData.roomStatus !== "STARTING")
                AR_STORE.setCountdownSeconds(null);
        };
        const handleRoomCountdown = (gameData: RoomCountdownType) => {
            AR_STORE.setCountdownSeconds(gameData.seconds);
        };

        socketRef.on("online-users", handleOnlineUsers);
        socketRef.on("room-update", handleRoomUpdate);
        socketRef.on("room-countdown", handleRoomCountdown);

        socketRef.emit("get-online-users");
        if (mode === "AI")
            socketRef.emit("play-AI", { level });
        else {
            const rematchRoomId = AR_STORE.rematchRoomId;
            if (rematchRoomId) {
                socketRef.emit("rematch", { roomId: rematchRoomId });
                AR_STORE.setRematchRoomId(null);
            } else {
                const pendingRoomId = AR_STORE.pendingRoomId;
                socketRef.emit("join-room", pendingRoomId ? { roomId: pendingRoomId } : undefined);
                if (pendingRoomId) AR_STORE.setPendingRoomId(null);
            }
        }

        return () => {
            if (!socketRef) return;
            socketRef.off("online-users", handleOnlineUsers);
            socketRef.off("room-update", handleRoomUpdate);
            socketRef.off("room-countdown", handleRoomCountdown);
            socketRef.emit("leave-room");
        };
    }, [AR_STORE.setRoomState, mode, level]);

    return (
        <div className={`relative min-h-screen w-full ${cntUser?.theme ?? true ?  "bg text-gray-200 " : "bg-gray-200 text-black"} p-2`}>
            {AR_STORE.sidebarOpen ? (<div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"  onClick={() => AR_STORE.setSidebarOpen(false)}  /> ) : (null)}

            <div className="grid grid-cols-1 lg:grid-cols-5 w-full min-h-screen">
                <div className="col-span-1 lg:col-span-4 flex flex-col p-4 lg:p-6 lg:pr-5 ">
                    <ArenaHeader />
                    {mode === "AI" && <LevelSelector />}
                    <GameBoard />
                    <ArenaControls />
                </div>
                 <div className={`${cntUser?.theme ?? true ? " border-white/10 bg-gray-900/95 lg:border-gray-800" : ""}`}>
                    <Sidebar />
                    
                    <div className="p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-sm opacity-70">
                            <span>{HD_LENG.plaseholder}</span>
                            <span>{snakes.length}</span>
                        </div>

                        {leader && (
                            <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-sm font-semibold text-yellow-500">
                                <span>👑</span>
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: leader.color }}
                                />
                                <span className="truncate">{nameFor(leader.userId)}</span>
                                <span className="ml-auto tabular-nums">{leader.score}</span>
                            </div>
                        )}

                        <ul className="flex flex-col gap-1.5">
                            {ranked.map((snake) => (
                                <li key={snake.userId} className={`flex items-center gap-2 text-sm ${snake.alive ? "" : "opacity-40 line-through"}`} >
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: snake.color }} />
                                    <span className="truncate">{nameFor(snake.userId)}</span>
                                    <span className="ml-auto tabular-nums">{snake.score}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {mode === "online"  && <ArenaFriends />}
                            
                </div>
            </div>
        </div>
    );
}

export default Arena;
