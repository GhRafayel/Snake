import { create } from 'zustand';

export type TouchModeType = 'joystick' | 'buttons';

const MODE_STORAGE_KEY = 'snake-touch-mode';

interface TouchControlStoreType {
    mode: TouchModeType;
    setMode: (mode: TouchModeType) => void;
    loadSavedMode: () => void;
}

function readSavedMode(): TouchModeType {
    try {
        return localStorage.getItem(MODE_STORAGE_KEY) === 'buttons' ? 'buttons' : 'joystick';
    } catch {
        return 'joystick';
    }
}

export const useTouchControlStore = create<TouchControlStoreType>((set) => ({
    // Starts at the default so server and client render the same; the saved choice
    // is loaded after mount via loadSavedMode().
    mode: 'joystick',

    loadSavedMode: () => set({ mode: readSavedMode() }),

    setMode: (mode) => {
        set({ mode });
        try { localStorage.setItem(MODE_STORAGE_KEY, mode); } catch { /* storage unavailable */ }
    },
}));
