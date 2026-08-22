import { create } from 'zustand';
import { MusicNameType, MusicType } from '@/src/types/UserTypes/UserTypes';

interface MusicStoreType {
    Musics: {
        game_sfx_on: MusicType;
        snake_music_on: MusicType;
    };
    hydrate: (name: MusicNameType) => void;
    toggleMusic: (name: MusicNameType) => void;
    setMusicOn: (value: boolean, name: MusicNameType) => void;
    setVolume: (value: number, name: MusicNameType) => void;
}

function readStoredOn(name: MusicNameType): boolean {
    const stored = window.localStorage.getItem(name);
    return stored === null ? true : stored === 'true';
}

function readStoredVolume(name: string): number {
    const stored = window.localStorage.getItem(name);
    if (stored === null) return 0.5;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.5;
}

export const useMusicStore = create<MusicStoreType>((set) => ({
    Musics: {
        game_sfx_on: {
            isMusicOn: true,
            volume: 0.5,
            key: "game_sfx_on",
            keyVolume: "game_sfx_volume",
            src: "/audio/gameMusic.mp3",
        },
        snake_music_on: {
            isMusicOn: true,
            volume: 0.5,
            key: "snake_music_on",
            keyVolume: "snake_music_volume",
            src: "/audio/gameMusic.mp3",
        },
    },

    hydrate: (name) => set((state) => ({
        Musics: {
            ...state.Musics,
            [name]: {
                ...state.Musics[name],
                isMusicOn: readStoredOn(state.Musics[name].key),
                volume: readStoredVolume(state.Musics[name].keyVolume),
            },
        },
    })),


    toggleMusic: (name) => set((state) => {
        const next = !state.Musics[name].isMusicOn;
        window.localStorage.setItem(state.Musics[name].key, String(next));
        return {
            Musics: { 
                ...state.Musics,
                [name]: {
                    ...state.Musics[name],
                    isMusicOn: next,
                },
            },
        };
    }),

    setMusicOn: (value, name) => set((state) => {
        window.localStorage.setItem( state.Musics[name].key, String(value));
        return {
            Musics: {
                ...state.Musics,
                [name]: {
                    ...state.Musics[name],
                    isMusicOn: value,
                },
            },
        };
    }),

    setVolume: (value, name) => set((state) => {
        const clamped = Math.min(1, Math.max(0, value));
        window.localStorage.setItem( state.Musics[name].keyVolume, String(clamped) );
        return {
            Musics: {
                ...state.Musics,
                [name]: {
                    ...state.Musics[name],
                    volume: clamped,
                },
            },
        };
    }),
}));