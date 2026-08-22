"use client";

import { useRouter } from "next/navigation";
import { useInviteStore } from "@/src/components/Store/useInviteStore";
import { useArenaStore } from "@/src/components/Store/useArenaStore";
import { useAuth } from "@/src/components/Provider/UserProvider";

export default function RoomInviteToast() {
    const router = useRouter();
    const invites = useInviteStore((s) => s.invites);
    const { cntUser, LENUAGE } = useAuth();
    const AR_LENG = LENUAGE.Arena;

    if (invites.length === 0) return null;

    return (
        <div className="fixed top-30 right-6 z-50 flex flex-col gap-3 pointer-events-none">
            {invites.map((invite) => (
                <div key={`${invite.roomId}-${invite.from.id}`}
                    className={`pointer-events-auto w-[calc(100vw-3rem)] max-w-xs rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
                        cntUser?.theme
                            ? "bg-bg-void/90 border-neon-green/20 shadow-[0_0_40px_var(--neon-green-glow)]"
                            : "bg-white/90 border-gray-200"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span className="fr-avatar fr-av-0">
                            {invite.from.Username.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${cntUser?.theme ?? true ? "text-neon-green" : "text-green-600"}`}>
                                {AR_LENG.invite.title}
                            </p>
                            <p className={`text-xs truncate ${cntUser?.theme ?? true ? "text-text-muted" : "text-gray-500"}`}>
                                {invite.from.Username} {AR_LENG.invite.subtitle}
                            </p>
                        </div>
                    </div>
                    <div className="fr-actions mt-3">
                        <button type="button" className="fr-actionBtn fr-actionAccept"
                            onClick={() => {
                                useInviteStore.getState().removeInvite(invite.roomId, invite.from.id);
                                useArenaStore.getState().setPendingRoomId(invite.roomId);
                                useArenaStore.getState().setMode("online");
                                router.push(`/server/arena?mode=online&r=${Date.now()}`);
                            }}>
                            {AR_LENG.saidBar.position.join}
                        </button>
                        <button type="button" className="fr-actionBtn fr-actionReject"
                            onClick={() => useInviteStore.getState().removeInvite(invite.roomId, invite.from.id)}>
                            {AR_LENG.saidBar.position.ignore}
                            
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
