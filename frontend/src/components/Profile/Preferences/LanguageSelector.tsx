'use client';
import { LanguageType } from "@/src/types/StoreTypes/StoreTypes";
import { useAuth } from "../../Provider/UserProvider";

export default function LanguageSelector() {

  const { cntUser, LENUAGE, ChangingCallback} = useAuth();
  const PR_LNGU = LENUAGE.Profile;

  return (
    <div className="pf-chipGroup">
      {PR_LNGU.language.map((item: LanguageType, i: number) => {
        const active = cntUser?.language === item;
        return (
          <button key={i} type="button" name={item}
            className={`pf-chip ${active ? 'pf-chipActive' : ''}`}
            onClick={(e) => { 
                ChangingCallback({language: e.currentTarget.name}, "change-language");
                ChangingCallback(undefined, `language/${e.currentTarget.name}`);
              }} >
            {item.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}