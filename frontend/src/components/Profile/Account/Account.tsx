"use client"

import { useState } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { useAuth } from '@/src/components/Provider/UserProvider';
import { useRouter } from "next/navigation";
import UsernameEditor from './UsernameEditor';

type WindowStateType = { request: boolean, prefsOpen: boolean, secureOpen: boolean, accountOpen: boolean };
type propsType = {
    setWindow: React.Dispatch<React.SetStateAction<WindowStateType>>;
    window: WindowStateType;
}

export default function Account ({ setWindow, window } : propsType) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const {LENUAGE} = useAuth();
    const profil = LENUAGE.Profile;
    const {ChangingCallback} = useAuth();
    const router = useRouter();
    
    return (
        <div className="pf-rows">
            <UsernameEditor />
            
            <div className="pf-row">
                <div className="pf-lbl">
                    <span className="pf-iconWrap"><LogOut size={16} /></span>
                    {profil.settings.lo}
                </div>
                <div className="pf-val">
                    <button className="pf-btn pf-btnGhost"
                        onClick={ async () => {
                            const res = await fetch("/api/auth?path=/auth/logout",{method: "DELETE"});
                            if (res.ok ) { ChangingCallback(undefined, "me"); router.refresh() } else setWindow({...window, request: !window.request});
                            }}
                        >
                        {profil.settings.lo}
                    </button>
                </div>
            </div>

            <div className={`pf-row ${showDeleteConfirm ? 'pf-rowStack' : ''}`}>
                {!showDeleteConfirm ? (
                    <>
                        <div className="pf-lbl">
                            <span className="pf-iconWrap pf-iconWrapDanger">
                                <Trash2 size={16} />
                            </span>
                            {profil.settings.da}
                        </div>
                        <div className="pf-val">
                            <button className="pf-btn pf-btnDanger"
                                    onClick={() => setShowDeleteConfirm(true)}>
                                {profil.settings.da}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="pf-dangerBox">
                        <p className="pf-dangerText">
                            {profil.settings.account.text}
                        </p>

                        <div className="pf-dangerActions">
                            <button className="pf-btn pf-btnGhost"
                                    onClick={() => setShowDeleteConfirm(false)} >
                                {profil.settings.account.no}
                            </button>

                            <button className="pf-btn pf-btnDanger"
                                onClick={ async () => {
                                    const res = await fetch("/api/auth?path=/auth/delete", {method: "DELETE"})
                                    if (res.ok ) { ChangingCallback(undefined,"me"); router.refresh() } else setWindow({...window, request: true});
                                }} >
                                {profil.settings.account.yes}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {window.request && (
                <div className="pf-row pf-rowMessage">
                    <span className="pf-message">{profil.settings.message}</span>
                </div>
            )}
        </div>
    )

}
