"use client"

import { useState } from "react";
import { MessageSquareText, X, Send } from "lucide-react";
import { useAuth } from "@/src/components/Provider/UserProvider";
import { LanguageStore } from "@/src/components/Store/LanguageStore";
import { Lib } from "@/src/lib/lib";

export default function Contact() {
    const [isOpen, setIsOpen] = useState(false);
    const { cntUser } = useAuth();
    const contactData = LanguageStore((state) => state.translations.contact);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">

            <div
                className={`
                    w-[calc(100vw-3rem)] max-w-sm origin-bottom-right
                    rounded-2xl border backdrop-blur-xl shadow-2xl
                    transition-all duration-300 ease-out
                    ${isOpen
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-90 translate-y-4 pointer-events-none"}
                    ${cntUser?.theme
                        ? "bg-bg-void/90 border-neon-green/20 shadow-[0_0_40px_var(--neon-green-glow)]"
                        : "bg-white/90 border-gray-200"}
                `}
            >
                <div className={`flex items-center justify-between px-5 py-4 border-b ${cntUser?.theme ?? true ? "border-neon-green/10" : "border-gray-200"}`}>
                    <div>
                        <h3 className={`font-bungee text-sm ${cntUser?.theme ?? true ? "text-neon-green" : "text-green-600"}`}>
                            {contactData.contact}
                        </h3>
                        <p className={`text-xs mt-1 ${cntUser?.theme ?? true ? "text-text-muted" : "text-gray-500"}`}>
                           {contactData.title}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className={`shrink-0 rounded-full p-1.5 transition-colors cursor-pointer ${cntUser?.theme ?? true ? "text-text-muted hover:text-neon-green hover:bg-white/5" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
                        aria-label="Close contact panel"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form className="flex flex-col gap-4 px-5 py-5" 
                    onSubmit={async (e) => {
                    e.preventDefault();
                    const message = new FormData(e.currentTarget).get("message") as string;
                    const res = await Lib.postRequest(`/api/edit?path=/users/contact`, {message});
                    if (res.ok)   setIsOpen(false);               
                }}>
                    <div className="flex gap-4">
                        <span className={`w-px shrink-0 rounded-full ${cntUser?.theme ?? true ? "bg-linear-to-b from-neon-green/60 via-neon-green/20 to-transparent" : "bg-linear-to-b from-green-500/60 via-green-500/20 to-transparent"}`} />
                        <textarea
                            name="message"
                            rows={6}
                            placeholder={contactData.des}
                            className={`
                                w-full resize-none bg-transparent outline-none text-sm leading-relaxed
                                placeholder:italic
                                ${cntUser?.theme ?? true ? "text-text-base placeholder:text-text-muted/60" : "text-gray-700 placeholder:text-gray-400"}
                            `}
                        />
                    </div>

                    <button
                        type="submit"
                        className={`
                            self-end inline-flex items-center gap-2 rounded-lg px-4 py-2
                            text-sm font-semibold tracking-wide cursor-pointer
                            transition-all duration-150
                            ${cntUser?.theme
                                ? "bg-neon-green text-black hover:shadow-[0_0_20px_var(--neon-green-glow)]"
                                : "bg-green-600 text-white hover:bg-green-700"}
                        `}
                    >
                        {contactData.send}
                        <Send className="h-4 w-4" />
                    </button>
                </form>
            </div>

            <button
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label="Toggle contact panel"
                className={`
                    relative flex h-14 w-14 items-center justify-center rounded-full
                    cursor-pointer transition-all duration-300 ease-out pointer-events-auto
                    hover:scale-110 active:scale-95
                    ${cntUser?.theme
                        ? "bg-neon-green text-black shadow-[0_0_25px_var(--neon-green-glow)]"
                        : "bg-green-600 text-white shadow-lg shadow-green-600/30"}
                    ${isOpen ? "rotate-90" : "rotate-0"}
                `}
            >
                {isOpen
                    ? <X className="h-6 w-6" />
                    : <MessageSquareText className="h-6 w-6" />}

                {!isOpen && (
                    <span className={`absolute inset-0 rounded-full animate-ping ${cntUser?.theme ?? true ? "bg-neon-green/40" : "bg-green-500/40"}`} />
                )}
            </button>
        </div>
    );
}
