import { create } from 'zustand';
import { GameType, DirectionType, GameStateType } from '@/src/types/GameTypes/GameTypes';


interface ScreenSizeType {
  width: number;
  height: number;
}

interface GameStoreStateType {
  gameState: GameStateType;
  gameDir: DirectionType;
  currGame: GameType | null;
  prevGame: GameType | null;
  alpha: number;
  step: boolean;
  screen: ScreenSizeType;
  stateTime: number;
  
  setGameState: (state: GameStateType | ((prev: GameStateType) => GameStateType)) => void;
  setGameDir: (dir: DirectionType) => void;
  setCurrGame: (game: GameType | null) => void;
  setPrevGame: (game: GameType | null) => void;
  setAlpha: (alpha: number) => void;
  toggleStep: () => void;
  setScreen: (screen: ScreenSizeType) => void;
  setStateTime: (time: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStoreStateType>((set) => ({
  gameState: null,
  gameDir: null,
  currGame: null,
  prevGame: null,
  alpha: 0,
  step: false,
  screen: { width: 0, height: 0 },
  stateTime: 0,
  
  setGameState: (state) => set((s) => ({ 
    gameState: typeof state === 'function' ? (state as (prev: GameStateType) => GameStateType)(s.gameState) : state 
  })),
  setGameDir: (dir) => set({ gameDir: dir }),
  setCurrGame: (game) => set({ currGame: game }),
  setPrevGame: (game) => set({ prevGame: game }),
  setAlpha: (alpha) => set({ alpha }),
  toggleStep: () => set((s) => ({ step: !s.step })),
  setScreen: (screen) => set({ screen }),
  setStateTime: (time) => set({ stateTime: time }),
  resetGame: () => set({
    gameState: null,
    gameDir: null,
    currGame: null,
    prevGame: null,
    alpha: 0,
    step: false,
    stateTime: 0,
  }),
}));