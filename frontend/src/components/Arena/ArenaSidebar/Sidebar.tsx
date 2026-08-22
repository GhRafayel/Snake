'use client'

import { X }                                from "lucide-react";
import { useArenaStore }                       from "@/src/components/Store/useArenaStore";
import { useUserStore }                        from "@/src/components/Store/useUserStore";
import { useGameCanvasStore }                  from "@/src/components/Store/useGameCanvasStore";
import { useAuth }                          from "@/src/components/Provider/UserProvider";
import { getLeaderSnake, getRankedSnakes }  from "../utils/leaderboard";

import VolumeControl                        from "@/src/components/Music/VolumeControl";
import ArenaFriends                         from "@/src/components/Friends/ArenaFriends";
import OnlinePlayersList                    from "./OnlinePlayersList";


export default function Sidebar() {
    const sidebarOpen = useArenaStore((s) => s.sidebarOpen);
    const setSidebarOpen = useArenaStore((s) => s.setSidebarOpen);
    const mode = useArenaStore((s) => s.mode);
    const gameData = useGameCanvasStore((state) => state.currGame);
    const {onlineUsers} = useUserStore();
    const {cntUser, LENUAGE} = useAuth();
    const HD_LENG = LENUAGE.Header;
    const snakes = gameData?.snakes ?? [];
    const leader = getLeaderSnake(snakes);
    const ranked = getRankedSnakes(snakes);
    const nameFor = (userId: number) =>
        onlineUsers.find((u) => u.id === userId)?.Username ?? `${HD_LENG.plaseholder} ${userId}`;

    return (
            <aside className={`
                fixed inset-y-2 right-0 top-24 z-50 w-80 max-w-[85vw] transform overflow-y-auto
                border-l ${cntUser?.theme ?? true ? " border-white/10 bg-gray-900/95 lg:border-gray-800" : " border-gray-200 bg-white/95 lg:border-gray-200"} backdrop-blur-xl
                transition-transform duration-300 ease-out
                lg:static lg:z-auto lg:col-span-1 lg:w-full lg:translate-x-0
                lg:bg-transparent lg:backdrop-blur-none
                ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <button className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-lg p-2  transition-colors text-gray-400 ${cntUser?.theme ?? true ? " hover:bg-white/10 hover:text-white" : " hover:bg-green-600 hover:text-gray-200"} lg:hidden`}
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                >
                    <X className="h-10 w-10" />
                </button>

                <div className="flex flex-col gap-6 p-5 lg:p-4 lg:h-full">
                    <div className={`h-[0.5px] my-0.5 ${cntUser?.theme ?? true ? "bg-white/10" : "bg-gray-500"}`}/>
                    <OnlinePlayersList />
                    <div className={`h-[0.5px] my-0.5 ${cntUser?.theme ?? true ? "bg-white/10" : "bg-gray-500"}`}/>
                    <VolumeControl musicName="game_sfx_on"/>
                </div>
                {mode === "online" && <ArenaFriends />}

                <div className="p-4 flex flex-col gap-3 ">
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
                
            </aside>
    );
}
