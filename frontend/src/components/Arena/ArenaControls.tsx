'use client'
import { useArenaStore }       from "@/src/components/Store/useArenaStore";
import { useAuth } from "../Provider/UserProvider";

export default function ArenaControls() {
    const {LENUAGE} = useAuth();
    const AR_STORE = useArenaStore();
    const AR_LENG = LENUAGE.Arena.control;
    
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

