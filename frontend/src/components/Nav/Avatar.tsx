"use client"

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/src/components/Provider/UserProvider"

export default function Avatar() {
    
    const {cntUser} = useAuth();
    const route = useRouter();

  return   (
     <div   onClick={() => route.push("/server/profile")}
            className="flex shrink-0 min-w-0 max-w-40 items-center gap-2 border rounded-3xl bg-blue-900 h-9.5 m-2 px-2 py-1 cursor-grab">
        <span className="truncate text-sm text-gray-100 max-sm:hidden">
            {cntUser?.Username}
        </span>
        <Image alt="Avatar" width={26} height={26} className="w-6.5 h-6.5 shrink-0 rounded-full bg-[#0095ff] text-(--color-info-text) flex items-center justify-center text-[12px] font-medium cursor-grab object-cover" src={`/avatar/${cntUser?.avatar || 'default.png'}`} />
    </div>
)
}