'use client'

import { Users }                from "lucide-react";
import {  useUserStore }           from "@/src/components/Store/useUserStore";
import { useAuth }              from "@/src/components/Provider/UserProvider";
import { OnlineUsersType }      from "@/src/types/UserTypes/UserTypes";
import OnlineUser               from "@/src/components/Arena/ArenaSidebar/OnlineUser";

export default function OnlinePlayersList() {

    const {cntUser, LENUAGE} = useAuth();
    const onlineUserList = LENUAGE.Arena.saidBar; 
    const {onlineUsers} = useUserStore();

    return (
        <div className="flex flex-col min-h-0 ">
            <div className="mb-3 flex items-center justify-between">
                <h3 className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${cntUser?.theme ?? true ? "text-gray-400" : "text-gray-500" }`}>
                    <Users className={`h-3.5 w-3.5 ${cntUser?.theme ?? true ? "text-emerald-400" : "text-emerald-600"}`} />
                    {onlineUserList.onlinePlayers}
                </h3>
                <span className={`rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold ${cntUser?.theme ?? true ? "text-emerald-400" : "text-emerald-600"} ring-1 ring-emerald-500/20`}>
                    {onlineUsers.length} {onlineUserList.online}
                </span>
            </div>

            <div className={`flex flex-col gap-2 overflow-y-auto pr-1 max-h-[50vh] lg:max-h-none scrollbar-thin scrollbar-track-transparent ${cntUser?.theme ?? true ? "scrollbar-thumb-white/10" : "scrollbar-thumb-gray-300"}`}>
                {onlineUsers.map((user: OnlineUsersType, i: number) => (
                    <OnlineUser key={user.id ?? i} obj={user} />
                ))}
            </div>
            
        </div>
    );
}
