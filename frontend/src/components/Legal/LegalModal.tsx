"use client"

import { useState } from "react";
import { useAuth } from "@/src/components/Provider/UserProvider";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import { useRouter } from "next/navigation";

export default function LegalModal() {
    const { cntUser, ChangingCallback } = useAuth();
    const dark = cntUser?.theme ?? true;
    const route = useRouter();
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const canAccept = agreePrivacy && agreeTerms;

    const handleAccept = async () => {
        if (!canAccept || submitting) return;
        setSubmitting(true);
        await ChangingCallback({}, "accept-terms");
        setSubmitting(false);
    };

    const handleRegect = async () => {
        if (submitting) return;
        await fetch("/api/auth?path=/auth/delete", {method: "DELETE"});
        await ChangingCallback(undefined, "me");
        route.push("/server/login");
    }

    if (!cntUser || cntUser.termsAcceptedAt) return null;

    return (
        <div className="legal-modalOverlay" role="dialog" aria-modal="true">
            <div className={`legal-modalBox ${dark ? "" : "legal-light"}`}>
                <div className="legal-modalHeader">
                    <h2 className="legal-modalTitle">Before you play</h2>
                    <p className="legal-modalSubtitle">Please read and agree to keep playing Snake.</p>
                </div>

                <div className="legal-modalScroll no-scrollbar">
                    <div className="legal-modalDoc">
                        <PrivacyPolicy embedded />
                    </div>
                    <div className="legal-modalDoc">
                        <TermsOfService embedded />
                    </div>
                </div>

                <div className="legal-modalFooter">
                    <div className="legal-modalChecks">
                        <label className="legal-checkRow">
                            <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} />
                            <span>I have read and agree to the Privacy Policy</span>
                        </label>
                        <label className="legal-checkRow">
                            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                            <span>I have read and agree to the Terms of Service</span>
                        </label>
                    </div>

                    <button type="button" className="legal-modalAcceptBtn cursor-grab" disabled={!canAccept || submitting} onClick={handleAccept}>
                        {submitting ? "Saving..." : "Accept & Continue"}
                    </button>
                    <button type="button" className="legal-modalAcceptBtn cursor-grab" onClick={handleRegect}>
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
}
