"use client"

import { useEffect, useState } from "react";
import { MessageSquareText, X, Send } from "lucide-react";
import { useAuth } from "@/src/components/Provider/UserProvider";
import { Lib } from "@/src/lib/lib";
import { useFriendStore } from "@/src/components/Store/useFriendStore";

export default function Contact() {
    const [isOpen, setIsOpen] = useState(false);
    const { cntUser, LENUAGE } = useAuth();
    const contactData = LENUAGE.contact;
    const FR_LENG = LENUAGE.Friends;
    const FR_STORE = useFriendStore();
    const fetchFriends = useFriendStore((s) => s.fetchFriends);

    useEffect(() => {
        if (cntUser?.id) fetchFriends();
    }, [cntUser?.id, fetchFriends]);

    const pendingInvites = FR_STORE.friends.filter(
        (friend) => friend.status === "PENDING" && !!cntUser && friend.senderId !== cntUser.id
    );

    return (
        <div className="contact-container">

            <div
                className={`contact-panel 
                    ${isOpen ? "contact-panel-open" : "contact-panel-closed"} 
                    ${cntUser?.theme ? "contact-panel-dark" : "contact-panel-light"} `}
            >
                <div className={`contact-header ${cntUser?.theme ?? true ? "contact-border-dark" : "contact-border-light"}`}>
                    <div>
                        <h3 className={`contact-title ${cntUser?.theme ?? true ? "contact-title-dark" : "contact-title-light"}`}>
                            {contactData.contact}
                        </h3>
                        <p className={`contact-subtitle ${cntUser?.theme ?? true ? "contact-muted-dark" : "contact-muted-light"}`}>
                           {contactData.title}
                        </p>
                    </div>
                    <button className={`contact-close-btn ${cntUser?.theme ?? true ? "contact-close-btn-dark" : "contact-close-btn-light"}`}
                        onClick={() => setIsOpen(false)}
                        aria-label="Close contact panel"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {pendingInvites.length > 0 && (
                    <div className={`contact-invites ${cntUser?.theme ?? true ? "contact-border-dark" : "contact-border-light"}`}>
                        <p className={`contact-invites-label ${cntUser?.theme ?? true ? "contact-muted-dark" : "contact-muted-light"}`}>
                            {(contactData.invites ?? "Pending Invites")} ({pendingInvites.length})
                        </p>
                        <div className="fr-list no-scrollbar contact-invites-list">
                            {pendingInvites.map((item, i) => (
                                <div className="fr-row" key={item.requestId}>
                                    <span className={`fr-avatar fr-av-${i % 4}`}>
                                        {item.Username.slice(0, 2).toUpperCase()}
                                    </span>
                                    <div className="fr-info">
                                        <span className="fr-name">{item.Username}</span>
                                        <div className="fr-actions">
                                            <button type="button" className="fr-actionBtn fr-actionAccept" onClick={async () => await FR_STORE.acceptFriend(item.requestId)}>
                                                {FR_LENG.accept}
                                            </button>
                                            <button type="button" className="fr-actionBtn fr-actionReject" onClick={async () => await FR_STORE.rejectFriend(item.requestId)}>
                                                {FR_LENG.reject}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <form className="contact-form" suppressHydrationWarning onSubmit={async (e) => { e.preventDefault();
                        const message = new FormData(e.currentTarget).get("message") as string;
                        try {
                            const res = await Lib.postRequest(`/api/edit?path=/users/contact`, {message});
                            if (res.ok) setIsOpen(false);
                        } catch (err) {
                            console.error("Failed to send contact message", err);
                        }
                    }}>
                    <div className="contact-input-row">
                        <span className={`contact-divider ${cntUser?.theme ?? true ? "contact-divider-dark" : "contact-divider-light"}`} />
                        <textarea  className={`contact-textarea ${cntUser?.theme ?? true ? "contact-textarea-dark" : "contact-textarea-light"}`}
                                   name="message" rows={6} placeholder={contactData.des} suppressHydrationWarning
                        />
                    </div>

                    <button type="submit" className={`contact-submit-btn ${cntUser?.theme ? "contact-submit-btn-dark" : "contact-submit-btn-light"}`}>
                        {contactData.send}
                        <Send className="h-4 w-4" />
                    </button>
                </form>
            </div>

            <button className={` contact-fab ${cntUser?.theme ? "contact-fab-dark" : "contact-fab-light"} ${isOpen ? "contact-fab-rotated" : ""} `}
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label="Toggle contact panel"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquareText className="h-6 w-6" />}

                {!isOpen && (
                    <span className={`contact-fab-ping ${cntUser?.theme ?? true ? "contact-fab-ping-dark" : "contact-fab-ping-light"}`} />
                )}

                {pendingInvites.length > 0 && (
                    <span className={`contact-badge ${cntUser?.theme ?? true ? "contact-badge-dark" : "contact-badge-light"}`}>
                        {pendingInvites.length > 9 ? "9+" : pendingInvites.length}
                    </span>
                )}
            </button>
        </div>
    );
}
