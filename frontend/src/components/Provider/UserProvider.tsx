"use client"

import { createContext, useCallback, useContext, useEffect, useState} from "react"
import { UserType,  UserContextType} from "@/src/types/UserTypes/UserTypes"
import { LanguageStore } from "@/src/components/Store/LanguageStore"
import { Lib } from "@/src/lib/lib"

const UserContext = createContext<UserContextType | null>(null);
type Props = {
    children: React.ReactNode,
    initialUser: UserType | null,
}

export default function UserProvider ({ children,  initialUser,} : Props ) {

    const [ cntUser, setCntUser ] = useState<UserType | null>(initialUser);
  
    useEffect(() => {
        if (!cntUser) { ChangingCallback(undefined, "refreshUser"); return; }
        LanguageStore.getState().setLanguage(cntUser.language)
    },[cntUser]);

    const ChangingCallback = useCallback( async (body: Object | undefined, funName: string) => {
        if (body === undefined)
        {
            try {
                const res = await fetch("/api/edit?path=/users/me").then(r => r.json());
                return setCntUser(res);
            }
            catch { return setCntUser(null) };
        }
        const res = await Lib.patchRequest(`/api/edit?path=/users/`+ funName, body).then(r => r.json());
        setCntUser({...res})
    },[]);


    return (
        <UserContext.Provider value={{cntUser, ChangingCallback}}>
            {children}
        </UserContext.Provider>
    )
}

export function useAuth () {
    const ctx = useContext(UserContext);
    if (!ctx)
        throw new Error("useAuth must be used inside UserProvider");
    return ctx;
}

