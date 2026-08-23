'use client'

import { useDifficultyStore, MIN_BOT_LEVEL, MAX_BOT_LEVEL }    from "@/src/components/Store/useDifficultyStore";
import { useAuth }                                          from "../Provider/UserProvider";

const LEVELS = Array.from({ length: MAX_BOT_LEVEL - MIN_BOT_LEVEL + 1 }, (_, i) => MIN_BOT_LEVEL + i);

export default function LevelSelector() {

    const {cntUser, LENUAGE} = useAuth()
    const level = useDifficultyStore((s) => s.level);
    const setLevel = useDifficultyStore((s) => s.setLevel);
    const AR_LENG = LENUAGE.Arena.header;

    return (
        <div className="flex items-center gap-2 py-2">
            <span className={`text-[11px] sm:text-xs ${cntUser?.theme ?? true ? "text-gray-300" : "text-gray-700"}`}>
                {AR_LENG.difficulty}
            </span>
            <div className={`flex gap-1 rounded-full p-1 ${cntUser?.theme ?? true ? "bg-gray-700" : "bg-gray-300"}`}>
                {LEVELS.map((lvl) => {
                    const active = level === lvl;
                    return (
                        <button
                            key={lvl}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setLevel(lvl)}
                            className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium transition-colors ${
                                active
                                    ? cntUser?.theme
                                        ? "bg-green-600 text-white"
                                        : "bg-blue-400 text-gray-800"
                                    : cntUser?.theme
                                        ? "text-gray-300 hover:text-white"
                                        : "text-gray-700 hover:text-black"
                            }`}
                        >
                            Lvl {lvl}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
