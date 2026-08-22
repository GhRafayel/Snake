import { create } from 'zustand';
import { GameType, GameStateType } from "@/src/types/GameTypes/GameTypes";
import { DEFAULT_STEP } from '@/src/components/Arena/utils/drawGame';

interface GameCanvasStoreType {
    prevGame: GameType | null;
    currGame: GameType | null;
    stateTime: number;
    alpha: number;
    step: boolean;
    stepSeconds: number;
    screen: { width: number; height: number };
    internalGameState: GameStateType;

    setGames: (curr: GameType) => void;
    setStateTime: (time: number) => void;
    setAlpha: (alpha: number) => void;
    toggleStep: () => void;
    setStepSeconds: (seconds: number) => void;
    setScreen: (screen: { width: number; height: number }) => void;
    setInternalGameState: (state: GameStateType) => void;
    resetGameCanvas: () => void;
}

export const useGameCanvasStore = create<GameCanvasStoreType>((set) => ({
    prevGame: null,
    currGame: null,
    stateTime: 0,
    alpha: 0,
    step: false,
    stepSeconds: DEFAULT_STEP,
    screen: { width: 0, height: 0 },
    internalGameState: 'START',

    setGames: (curr) => set((state) => ({ prevGame: state.currGame, currGame: curr })),
    setStateTime: (time) => set({ stateTime: time }),
    setAlpha: (alpha) => set({ alpha }),
    toggleStep: () => set((state) => ({ step: !state.step })),
    setStepSeconds: (seconds) => set({ stepSeconds: seconds }),
    setScreen: (screen) => set({ screen }),
    setInternalGameState: (state) => set({ internalGameState: state }),

    resetGameCanvas: () =>
        set({
            prevGame: null,
            currGame: null,
            stateTime: 0,
            alpha: 0,
            step: false,
            stepSeconds: DEFAULT_STEP,
            screen: { width: 0, height: 0 },
            internalGameState: 'START',
        }),
}));
