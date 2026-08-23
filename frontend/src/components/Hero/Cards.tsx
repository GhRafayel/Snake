"use client";
import { Cpu, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { useState } from "react";
import { CardsType } from "@/src/types/StoreTypes/StoreTypes";
import { useArenaStore } from "@/src/components/Store/useArenaStore";
import { useAuth } from "@/src/components/Provider/UserProvider";

type PropsType = {  card: CardsType; }

export default function Cards({ card } : PropsType) {

    const [state, setState] = useState(false);
    const router = useRouter();
    const { cntUser } = useAuth();
    
    return (cntUser &&
        <li className={` match-card ${ cntUser?.theme ?? true ? "backdrop-blur-[9.5px] border-border-subtle  hover:border-neon-green" : "text-black"}`} >

            {card.mode === "AI" ? <Cpu className="h-6 w-6"/> : <Globe className="h-6 w-6"/>}

            <h3 className=" text-base font-semibold "> {card.title}  </h3>

            <p className="flex-1  text-sm "> {card.description} </p>

            <span className={`text-xs font-medium ${cntUser?.theme ?? true ? "text-emerald-400" : "text-green-700"}`}> {card.wait} </span>

            {state ? (
                    <div className="flex justify-center py-2">
                        <Loader className="h-5 w-5 animate-spin" />
                    </div>
                ) : (
                <button disabled={state}
                    onClick={async () => {
                        setState(true);
                        await new Promise((r) => setTimeout(r, 2000));
                        useArenaStore.getState().setMode(card.mode);
                        router.push(`/server/arena?mode=${card.mode}&r=${Date.now()}`);
                    }}
                    className={`match-card-button ${cntUser?.theme ?? true ? "border-border-subtle  hover:text-blue-200" : ""}`}>
                    {card.button} 
                </button>
            )}
        </li>
    );
}

