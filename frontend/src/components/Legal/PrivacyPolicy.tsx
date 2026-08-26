"use client"

import Link from "next/link";
import { useAuth } from "@/src/components/Provider/UserProvider";
import Content from "@/src/components/Legal/Content"


export default function PrivacyPolicy({ embedded = false }: { embedded?: boolean }) {
    const { cntUser } = useAuth();
    const dark = cntUser?.theme ?? true;
    

    if (embedded) {
        return <div className="legal-embedded">
            <Content nameKey="privacyPolicy"/>
        </div>;
    }

    return (

        <div className={`legal-page ${dark ? "bg text-white" : "legal-light bg-gray-200 text-black"}`}>
            <div className="legal-shell">
                <Link href="/" className="legal-back">&larr; Back to Snake</Link>

                <div className="legal-card">
                    <div className="legal-cardBody">
                         <Content nameKey="privacyPolicy"/>
                    </div>
                </div>
            </div>
        </div>
    );
}
