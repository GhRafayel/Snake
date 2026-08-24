import { ChevronDown, CheckCircle, UsersRound, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useFriendStore } from "../Store/useFriendStore";
import { useAuth } from "../Provider/UserProvider";

export default function ArenaFriends () {
    const {LENUAGE, cntUser} = useAuth()
    const [F_list, setF_list] = useState(true);
    const FR_LENG = LENUAGE.Friends;
    const FR_STORE = useFriendStore();
    const fetchFriends = useFriendStore((s) => s.fetchFriends);
    const acceptedFriends = FR_STORE.friends.filter((friend) => friend.status === "ACCEPTED");
    useEffect(() => {fetchFriends()},[fetchFriends]);


    return (
        <section className={`flex flex-col gap-6 p-5 sm:p-6 `}>

                <header className={`fr-header flex cursor-grab items-center justify-between ` }onClick={() => setF_list(!F_list)} >
                    <div>
                        <h3 className={`text-lg font-semibold tracking-tight ${cntUser?.theme ?? true ? "text-gray-300" : "text-gray-700"}`}>{FR_LENG.friends}</h3>
                    </div>
                    <ChevronDown size={18} className={`fr-chevron ${F_list ? 'fr-chevron-open' : ''}`} />
                </header>

                {F_list && (
                    acceptedFriends.length > 0 ? (
                        <div className="fr-list no-scrollbar ">
                        {acceptedFriends.map((item, i) => {
                            const isInvited = FR_STORE.invited.includes(item.id);
                            return (
                            <div className="flex w-full min-w-0 items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-all duration-150 border pt-2  border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20" key={i}>

                                <div className="flex  gap-6 items-center  justify-between ">
                                    <span className={`fr-avatar fr-av-${i % 4}`}>
                                        {item.Username.slice(0, 2).toUpperCase()}
                                        <span className={`fr-dot ${item.isOnline ? 'fr-dot-active' : 'fr-dot-away'}`} />
                                    </span>
                                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg" onClick={() => FR_STORE.handleInvite(item.id)}>
                                        {isInvited ? <CheckCircle size={30} className="text-green-500 cursor-grab" /> : <UsersRound size={30} className="text-green-500 cursor-grab"/>}
                                    </button>
                                </div>

                                <div className=" shrink-0  text-center p-1 ">
                                    <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${cntUser?.theme ?? true ? "bg-white/5" : "bg-black/5"}`} >
                                        <Trophy className={`h-3.5 w-3.5 shrink-0 ${cntUser?.theme ?? true ? "text-gray-500" : "text-gray-400"}`} />
                                        <span className={`text-xs sm:text-sm font-semibold tabular-nums ${cntUser?.theme ?? true ? "text-gray-100" : "text-gray-900"}`}>
                                            {LENUAGE.History.pts}
                                        </span>
                                        <span className={`text-[10px] sm:text-[11px] ${cntUser?.theme ?? true ? "text-gray-500" : "text-gray-500"}`}>
                                           {item.score}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                        </div>
                    ) : ( <div className="fr-empty">{FR_LENG.empty}</div> )
                )}
         </section>
    )
}