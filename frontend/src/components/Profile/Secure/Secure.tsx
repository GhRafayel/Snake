'use client';
import { Dispatch, SetStateAction } from 'react';
import { KeyRound } from 'lucide-react';
import { LanguageStore } from "@/src/components/Store/LanguageStore";
import ChangePasswordForm from './ChangePasswordForm';

interface ChangePasswordSectionProps {
  showChangePassword: boolean;
  setShowChangePassword: Dispatch<SetStateAction<boolean>>;
}

export default function Secure({ showChangePassword, setShowChangePassword }: ChangePasswordSectionProps) {
  const PF_LENG = LanguageStore((state) => state.translations.Profile);

  return (
    <div className="pf-row pf-rowStack">
      {showChangePassword ? (
        <>
          <div className="pf-lbl">
            <span className="pf-iconWrap">
              <KeyRound size={16} />
            </span>
            {PF_LENG.settings.secure.label2}
          </div>
          <div className="pf-val">
            <button className="pf-btn pf-btnPrimary" type="button" onClick={() => setShowChangePassword(false)} >
              {PF_LENG.settings.secure.changePassword}
            </button>
          </div>
        </>
      ) : (
        <ChangePasswordForm setShowChangePassword={setShowChangePassword} />
      )}
    </div>
  );
}