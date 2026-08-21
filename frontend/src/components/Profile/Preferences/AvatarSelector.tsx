'use client';
import { useEffect, useState } from 'react';
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
          <img src={`/avatar/${avatar}`} alt={avatar} className="pf-avatarOptionImg" />
        </button>
      ))}
    </div>
  );
}
