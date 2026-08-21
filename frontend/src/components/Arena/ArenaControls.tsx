'use client'
import { ArenaStore }       from "@/src/components/Store/ArenaStore";
import { LanguageStore }    from "@/src/components/Store/LanguageStore";

export default function ArenaControls() {
    const AR_STORE = ArenaStore();
    const AR_LENG = LanguageStore((state) => state.translations.Arena.control);
    return (
        <div className={`flex items-center justify-center text-xs  py-4`}>
            <div className="w-full flex justify-around">
                <span className={`kbd ${AR_STORE.gameState === 'START' ? "text-(--color-accent-text)" : ""}`}>{AR_LENG.move}</span>
                <span className={`kbd ${AR_STORE.gameDir === 'LEFT' ? "text-(--color-warning-text)" : ""}`}>←</span>
                <span className={`kbd ${AR_STORE.gameDir === 'UP' ? "text-(--color-warning-text)" : ""}`}>↑</span>
                <span className={`kbd ${AR_STORE.gameDir === 'DOWN' ? "text-(--color-warning-text)" : ""}`}>↓</span>
                <span className={`kbd ${AR_STORE.gameDir === 'RIGHT' ? "text-(--color-warning-text)" : ""}`}>→</span>
                <span className={`kbd ${AR_STORE.gameState === 'PAUSE' ? "text-(--color-accent-text)" : ""}`}>{AR_LENG.pause}</span>
            </div>
        </div>
    );
}
