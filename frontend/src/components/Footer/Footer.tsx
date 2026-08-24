"use client"

import Link from "next/link";
import { useAuth } from "@/src/components/Provider/UserProvider";

export default function Footer() {
    const { cntUser, LENUAGE } = useAuth();
    const FT = LENUAGE.Footer;
    const dark = cntUser?.theme ?? true;

    return (
        <footer className={`w-full h-10 text-center py-5 pb-20 ${dark ? "ft-footer-dark" : "ft-footer-light"}`}>
            <span className="text-xs text-text-muted ">© {new Date().getFullYear()} Snake — {FT?.rights ?? "All rights reserved."}</span>
            <div>
                <Link href="/server/privacy" className={dark ? "ft-link" : "ft-link-light"}>{FT?.privacy ?? "Privacy Policy"}</Link>
                <Link href="/server/terms" className={dark ? "ft-link" : "ft-link-light"}>{FT?.terms ?? "Terms of Service"}</Link>
            </div>
        </footer>
    );
}
