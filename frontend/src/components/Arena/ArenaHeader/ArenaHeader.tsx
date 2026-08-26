'use client'
import { Trophy, Copy, Check}   from "lucide-react";
import { Clock, Users }         from "lucide-react";
import { useState }             from "react";
import { useArenaStore }           from "@/src/components/Store/useArenaStore";
import { useAuth }              from "@/src/components/Provider/UserProvider";
import MobileFab                from "./MobileFab";
import Timer                    from "./Timer";

export default function ArenaHeader() {

    const {cntUser, LENUAGE} = useAuth();
    const roomState = useArenaStore((s) => s.roomState);
    const AR_LENG = LENUAGE.Arena.header;
    const [copied, setCopied] = useState(false);
    
    const stats: { icon: typeof Clock; value: React.ReactNode; label: string }[] = [
        { icon: Clock, value: <Timer />, label: AR_LENG.time },
        { icon: Users, value: roomState?.players ?? 0, label: AR_LENG.players },
        { icon: Trophy, value: cntUser?.history?.totalScore || 0, label: AR_LENG.score },
    ];

    const handleCopyRoomId = async () => {
        if (!roomState?.roomId) return;
        try {
            await navigator.clipboard.writeText(roomState.roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {}
    };

    return (
        <div className="relative flex flex-wrap items-center justify-start gap-x-3 gap-y-3 py-4 pr-14 lg:pr-0">
            <div
                className={`inline-flex min-w-0 max-w-full w-full sm:w-auto sm:max-w-[60%] items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-[11px] sm:text-xs font-medium ring-1 ${cntUser?.theme ?? true ? "bg-white/5 ring-white/10" : "bg-black/5 ring-black/10"}`}
            >
                <i className="ti tiCircleFilled shrink-0 text-green-500" aria-hidden="true"></i>
                <span className="flex min-w-0 items-baseline gap-1.5 truncate">
                    <span className={`${cntUser?.theme ?? true ? "text-gray-400" : "text-gray-500"} shrink-0`}>
                        {AR_LENG.match}
                    </span>
                    <span className={`truncate font-mono ${cntUser?.theme ?? true ? "text-gray-100" : "text-gray-900"}`}>
                        {roomState?.roomId ?? '—'}
                    </span>
                </span>

                {roomState?.roomId && (
                    <button type="button" onClick={handleCopyRoomId} aria-label={AR_LENG.copy} title={copied ? AR_LENG.copied : AR_LENG.copy}
                        className={`ml-1 flex shrink-0 items-center justify-center rounded-full p-1 transition-colors cursor-grab ${cntUser?.theme ?? true ? "text-gray-400 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-black/10 hover:text-gray-900"}`}
                    >
                        {copied ? (
                            <Check className="h-3 w-3 text-green-500" />
                        ) : (
                            <Copy className="h-3 w-3" />
                        )}
                    </button>
                )}
            </div>

            <div className="absolute right-0 top-1/2 -translate-y-1/2 lg:hidden">
                <MobileFab />
            </div>

            <div className="flex w-full lg:w-auto items-center gap-2 sm:gap-3 flex-wrap justify-start">
                {stats.map(({ icon: Icon, value, label }, i) => (
                    <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${cntUser?.theme ?? true ? "bg-white/5" : "bg-black/5"}`} >
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${cntUser?.theme ?? true ? "text-gray-500" : "text-gray-400"}`} />
                        <span className={`text-xs sm:text-sm font-semibold tabular-nums ${cntUser?.theme ?? true ? "text-gray-100" : "text-gray-900"}`}>
                            {value}
                        </span>
                        <span className={`text-[10px] sm:text-[11px] ${cntUser?.theme ?? true ? "text-gray-500" : "text-gray-500"}`}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
