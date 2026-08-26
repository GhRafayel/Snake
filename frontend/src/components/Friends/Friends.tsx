"use client"

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/src/components/Provider/UserProvider";
import { useFriendStore } from "@/src/components/Store/useFriendStore";

export default function Friends() {

  const FR_STORE = useFriendStore();
  const fetchFriends = useFriendStore((s) => s.fetchFriends);
  const [open, setOpen] = useState(false);
  const { cntUser, LENUAGE } = useAuth();
  const FR_LENG = LENUAGE.Friends;

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return (
    <section className="pf-card">
      <div className="pf-cardBody">

        <header className="fr-header flex cursor-grab items-center justify-between" onClick={() => setOpen(!open)} >
            <div>
              <p className="pf-eyebrow">{FR_LENG.social}</p>
              <h3 className="pf-title">{FR_LENG.friends}</h3>
            </div>
            <ChevronDown size={18} className={`fr-chevron ${open ? 'fr-chevron-open' : ''}`} />
        </header>

        {open && (
          FR_STORE.friends.length > 0 ? (
            <div className="fr-list no-scrollbar ">
              {FR_STORE.friends.map((item, i) => {
                return (
                  <div className="fr-row" key={i}>
                    <span className={`fr-avatar fr-av-${i % 4}`}>
                      {item.Username.slice(0, 2).toUpperCase()}
                      <span className={`fr-dot ${item.isOnline ? 'fr-dot-active' : 'fr-dot-away'}`} />
                    </span>
                    <div className="fr-info">
                      <span className="fr-name">{item.Username}</span>

                      {item.status === 'PENDING' && !!cntUser && item.senderId !== cntUser.id ? (
                        <div className="fr-actions">

                          <button type="button" className="fr-actionBtn fr-actionAccept" onClick={async() => await FR_STORE.acceptFriend(item.requestId) } >
                            {FR_LENG.accept}
                          </button>
                          <button type="button" className="fr-actionBtn fr-actionReject"  onClick={async () => await FR_STORE.rejectFriend(item.requestId) } >
                            {FR_LENG.reject}
                          </button>
                        </div>
                      ) : item.status === 'PENDING' ? (
                        <div className="fr-actions">
                          <span className="fr-actionBtn"> {FR_LENG.pending} </span>
                           <button type="button" className="fr-actionBtn fr-actionAccept" onClick={async () => await FR_STORE.cancelRequest(item.id)} >
                              {FR_LENG.cancel}
                            </button>
                        </div>
                      ) : (
                         <div className="fr-actions">
                            <span> {FR_LENG.friends} </span>
                            <button type="button" className="fr-actionBtn fr-actionAccept"  onClick={async () => await FR_STORE.deleteFriend(item.id) } >
                              {FR_LENG.delete}
                            </button>
                          </div>
                      )}
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
  );
}
