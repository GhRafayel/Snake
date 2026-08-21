'use client'

import { X }                from "lucide-react";
import { ArenaStore }       from "@/src/components/Store/ArenaStore";
import { useAuth }          from "@/src/components/Provider/UserProvider";
import VolumeControl        from "@/src/components/Music/VolumeControl";
import OnlinePlayersList    from "./OnlinePlayersList";


export default function Sidebar() {
    const sidebarOpen = ArenaStore((s) => s.sidebarOpen);
    const setSidebarOpen = ArenaStore((s) => s.setSidebarOpen);
    const {cntUser} = useAuth();
    
    return (
        <aside className={`
            fixed inset-y-2 right-0 top-24 z-50 w-80 max-w-[85vw] transform overflow-y-auto
            border-l ${cntUser?.theme ?? true ? " border-white/10 bg-gray-900/95 lg:border-gray-800" : " border-gray-200 bg-white/95 lg:border-gray-200"} backdrop-blur-xl
            transition-transform duration-300 ease-out
            lg:static lg:z-auto lg:col-span-1 lg:w-auto lg:translate-x-0
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
        </aside>
    );
}
