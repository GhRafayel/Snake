"use client"

import { LanguageStore } from "../Store/LanguageStore";
import { useAuth } from "@/src/components/Provider/UserProvider"
import { UserSearchType } from "@/src/types/UserTypes/UserTypes";
import { useState, useEffect } from "react";
import { Lib } from "@/src/lib/lib"
import { FriendStore } from "@/src/components/Store/FriendStore";
import { useRouter } from "next/navigation";

export default function NavSearch ( ) {

    const [inputValue, setInputValue] = useState("");
    const Header = LanguageStore((state) => state.translations.Header);
    const {ChangingCallback, cntUser} = useAuth();
    const [filtered, setFiltered] = useState<UserSearchType[]>([]);
    const friendStore = FriendStore((set) => set.fetchFriends);
    const router = useRouter();

    useEffect(() => {
      document.documentElement.dataset.theme = cntUser?.theme? "dark" : "light";
    }, [cntUser?.theme]);

     useEffect(() => {
        if (inputValue === "") { setFiltered([]); return }
  
        const timer = setTimeout(async () => {
            const users: UserSearchType[] = await fetch( "/api/edit?path=/users/search/" + inputValue).then((r) => r.json());
            setFiltered (users);
            setTimeout(() => { setFiltered([]); setInputValue('') }, 5000);
        }, 500);
    
      return () => {
        clearTimeout(timer);
        setFiltered([]);
      };
    }, [inputValue]);
    
    return (
            <div className={`nav-search-div ${cntUser?.theme ?? true ? "bg-zinc-900/80 " : ""} `}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18" height="18"
                viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                className={`${cntUser?.theme ?? true ? "text-zinc-200" : "text-gray-700"}`}
                >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>

              <input onChange={(e) => setInputValue(e.currentTarget.value)}
                value={inputValue} type="text" 
                placeholder={Header.plaseholder}
                className={`nav-search-input ${cntUser?.theme ?? true ? " text-zinc-200  placeholder-zinc-400 " : "placeholder-zinc-800 "}`}
              />

              <button className="cursor-pointer" onClick={() => { 
                ChangingCallback({theme: !cntUser?.theme}, "change-theme");
                router.refresh();
              }}> 

              {cntUser?.theme ?? true ? "🌙 " : "☀️ "} </button>
                {filtered.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-blue-300 border rounded-lg shadow-lg z-50">
                    <div>
                      {filtered.map((item: { Username: string, id: number } ) => (
                        <div key={item.id} className="px-4 py-2 cursor-pointer flex items-center justify-between gap-2 max-sm:px-1" >
                          <div className="truncate min-w-0">{item.Username}</div>
                          <div>
                            <button id={String(item.id)} onClick={async (e) => {
                                await Lib.postRequest("/api/edit?path=/friends/request", {receiverId : Number(e.currentTarget.id)})
                                .then( strim => strim.json());
                                friendStore();
                            }}
                              type="button" className="border rounded-lg px-2 py-1 text-xs bg-neon-green cursor-pointer whitespace-nowrap shrink-0">{Header.invite}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>)
                }
            </div>
        )
}