'use client';
import { LanguageStore } from "@/src/components/Store/LanguageStore";
import { LanguageType } from "@/src/types/StoreTypes/StoreTypes";
import { useAuth } from "../../Provider/UserProvider";

export default function LanguageSelector() {
  const PR_LNGU = LanguageStore((state) => state.translations.Profile);
  const { cntUser, ChangingCallback} = useAuth();

  return (
    <div className="pf-chipGroup">
      {PR_LNGU.language.map((item: LanguageType, i: number) => {
        const active = cntUser?.language === item;
        return (
          <button key={i} type="button" name={item}
            className={`pf-chip ${active ? 'pf-chipActive' : ''}`}
            onClick={(e) => { ChangingCallback({language: e.currentTarget.name}, "change-language") }} >
            {item.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}