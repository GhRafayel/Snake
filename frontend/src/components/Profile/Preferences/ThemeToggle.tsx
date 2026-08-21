'use client';
import { useAuth } from '@/src/components/Provider/UserProvider';
import { useRouter } from "next/navigation";

export default function ThemeToggle() {
  const { cntUser, ChangingCallback } = useAuth();
   const router = useRouter();

  return (
    <button type="button" className="pf-themeBtn"
      onClick={() => { ChangingCallback({theme: !cntUser?.theme}, "change-theme"); router.refresh(); }}
      aria-label="Toggle cntUser?.theme"
    >
      {cntUser?.theme ? '🌙' : '☀️'}
    </button>
  );
}