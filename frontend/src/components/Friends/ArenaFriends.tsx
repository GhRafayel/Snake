import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { LanguageStore } from "../Store/LanguageStore";
import { FriendStore } from "../Store/FriendStore";

export function ArenaFriends () {
    const [F_list, setF_list] = useState(true);
    const FR_LENG = LanguageStore((state) => state.translations.Friends);
    const AR_LENG = LanguageStore((state) => state.translations.Arena.saidBar);
    const FR_STORE = FriendStore();
    const acceptedFriends = FR_STORE.friends.filter((friend) => friend.status === "ACCEPTED");

    useEffect(() => {FR_STORE.fetchFriends()},[]);


    return (
        <section className="pf-card ">
            <div className="pf-cardBody">

                <header className="fr-header flex cursor-pointer items-center justify-between" onClick={() => setF_list(!F_list)} >
                    <div>
                        <h3 className="pf-title">{FR_LENG.friends}</h3>
                    </div>
                    <ChevronDown size={18} className={`fr-chevron ${F_list ? 'fr-chevron-open' : ''}`} />
                </header>

                {F_list && (
                    acceptedFriends.length > 0 ? (
                        <div className="fr-list no-scrollbar ">
                        {acceptedFriends.map((item, i) => {
                            const isInvited = FR_STORE.invited.includes(item.id);
                            return (
                            <div className="fr-row" key={i}>
                                <span className={`fr-avatar fr-av-${i % 4}`}>
                                    {item.Username.slice(0, 2).toUpperCase()}
                                    <span className={`fr-dot ${item.isOnline ? 'fr-dot-active' : 'fr-dot-away'}`} />
                                </span>
                                <div className="fr-info">
                                    <button type="button" className="fr-actionBtn fr-actionAccept" disabled={!item.isOnline || isInvited}
                                        onClick={() => FR_STORE.handleInvite(item.id)}
                                    >
                                        {isInvited ? AR_LENG.invited : AR_LENG.position.join}
                                    </button>
                                </div>
                                <span className="fr-rank">{item.score}</span>
                            </div>
                            );
                        })}
                        </div>
                    ) : ( <div className="fr-empty">{FR_LENG.empty}</div> )
                )}
            </div>
        </section>
    )
}