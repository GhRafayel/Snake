'use client';
import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { MusicStore } from '@/src/components/Store/MusicStore';
import { MusicNameType } from '@/src/types/UserTypes/UserTypes';
import { useAuth } from '@/src/components/Provider/UserProvider';

export default function VolumeControl({musicName} : {musicName : MusicNameType}) {

  const { Musics, toggleMusic, setVolume, setMusicOn } = MusicStore();
  const muted = !Musics[musicName].isMusicOn || Musics[musicName].volume === 0;
  const Icon = muted ? VolumeX : Musics[musicName].volume < 0.5 ? Volume1 : Volume2;
  const {cntUser} = useAuth();

  return (
    <div className={`pf-volume ${cntUser?.theme ?? true ? "" : " p-2 border rounded-2xl "}`}>
      <button type="button" className="pf-volumeIconBtn" onClick={() => toggleMusic(musicName)} aria-label="Toggle sound">
        <Icon size={16} />
      </button>
      <input type="range" className={`pf-volumeRange ${cntUser?.theme ?? true ? "bg-(--color-border-secondary)" : "text-black bg-blue-700"}`} min={0} max={1} step={0.05} value={Musics[musicName].volume}
        onChange={(e) => {
          const value = Number(e.target.value);
          setVolume(value, musicName);
          if (!Musics[musicName].isMusicOn) setMusicOn(true, musicName);
        }}
        aria-label="Music volume"
      />
    </div>
  );
}
