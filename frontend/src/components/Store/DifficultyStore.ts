import { create } from 'zustand';

export const MIN_BOT_LEVEL = 1;
export const MAX_BOT_LEVEL = 3;

interface DifficultyStore {
    level: number;
    setLevel: (level: number) => void;
}

export const DifficultyStore = create<DifficultyStore>((set) => ({
    level: MIN_BOT_LEVEL,

    setLevel: (level) =>
        set({ level: Math.min(MAX_BOT_LEVEL, Math.max(MIN_BOT_LEVEL, level)) }),
}));
