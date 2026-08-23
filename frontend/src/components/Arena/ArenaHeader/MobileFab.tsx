'use client'

import { Users }        from "lucide-react";
import { useArenaStore }   from "@/src/components/Store/useArenaStore";
import { useUserStore }    from "@/src/components/Store/useUserStore";

export default function MobileFab() {
    const setSidebarOpen = useArenaStore((s) => s.setSidebarOpen);
    const onlineUsers = useUserStore((state) => state.onlineUsers);

    return (
        <button className="relative flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-110 active:scale-95 lg:hidden" aria-label="Open players sidebar" 
                onClick={() => setSidebarOpen(true)}
        >
            <Users className="h-6 w-6" />
            {onlineUsers.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-gray-950">
                    {onlineUsers.length}
                </span>
            )}
        </button>
    );
}
