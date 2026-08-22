'use client';

import { useEffect, useRef } from 'react';
import { useMusicStore } from '@/src/components/Store/useMusicStore';
import { MusicNameType } from '@/src/types/UserTypes/UserTypes';

interface MusicProps {
    musicName: MusicNameType;
}

export default function Music({ musicName }: MusicProps) {
    const { Musics, hydrate } = useMusicStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const music = Musics[musicName];

    useEffect(() => { hydrate(musicName);
    }, [hydrate, musicName]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !music) return;

        if (music.isMusicOn && music.volume > 0) {
            audio.play().catch(() => {});
        } else {
            audio.pause();
        }
    }, [music?.isMusicOn, music?.volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio && music) {
            audio.volume = music.volume;
        }
    }, [music?.volume]);

    if (!music) return null;
    return ( <audio ref={audioRef} src={music.src} loop preload="auto" /> );
}