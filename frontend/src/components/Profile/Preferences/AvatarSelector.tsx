'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/src/components/Provider/UserProvider';

export default function AvatarSelector() {
  const { cntUser , ChangingCallback} = useAuth();
  const [avatars, setAvatars] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/avatars')
      .then((res) => res.json())
      .then((data: string[]) => setAvatars(data.filter((png) => png !== "default.png")))
      .catch(() => setAvatars([]));
  }, []);

  return (
    <div className="pf-avatarGrid">
      {avatars.map((avatar) => (
        <button key={avatar} type="button" aria-label={avatar}
          className={`pf-avatarOption ${cntUser?.avatar === avatar ? 'pf-avatarOptionActive' : ''}`}
          onClick={async () => ChangingCallback({avatar}, "change-avatar") }>
          <Image src={`/avatar/${avatar}`} alt={avatar} width={44} height={44} className="pf-avatarOptionImg" />
        </button>
      ))}
    </div>
  );
}
