"use client"

import { createContext, useCallback, useContext, useMemo, useState} from "react"
import { UserType,  UserContextType} from "@/src/types/UserTypes/UserTypes"
import { TranslationType } from "@/src/types/StoreTypes/StoreTypes"
import { Lib } from "@/src/lib/lib"

const UserContext = createContext<UserContextType | null>(null);
type PropsType = {
    children: React.ReactNode,
    initialUser: UserType | null,
    initialTranslations: TranslationType,
}

export default function UserProvider ({ children,  initialUser, initialTranslations } : PropsType ) {

    const [ cntUser, setCntUser ] = useState<UserType | null>(initialUser);
    const [ LENUAGE, setLENUAGE] = useState<TranslationType>(initialTranslations);

    const ChangingCallback = useCallback( async (body: object | undefined, endpoint: string) => {
        if (body === undefined)
        {
            try {
                const res = await fetch("/api/edit?path=/users/" + endpoint).then(r => r.json());
                if (endpoint === "me")
                    return setCntUser(res);
                return setLENUAGE({...res});
            }
            catch {
                if (endpoint === "me")
                    return setCntUser(null)
                return;
            };
        }
        const res = await Lib.patchRequest("/api/edit?path=/users/" + endpoint, body).then(r => r.json());
        setCntUser({...res})
    },[]);

    const value = useMemo( () => ({ cntUser, LENUAGE, ChangingCallback }),
        [cntUser, LENUAGE, ChangingCallback]
    );

    return (
        <UserContext.Provider value={value}>
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

