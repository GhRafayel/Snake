'use client';
import { Dispatch, SetStateAction } from 'react';
import { KeyRound } from 'lucide-react';
import ChangePasswordForm from './ChangePasswordForm';
import { useAuth } from '../../Provider/UserProvider';

interface ChangePasswordSectionPropsType {
  showChangePassword: boolean;
  setShowChangePassword: Dispatch<SetStateAction<boolean>>;
}

export default function Secure({ showChangePassword, setShowChangePassword }: ChangePasswordSectionPropsType) {
  const PF_LENG = useAuth().LENUAGE.Profile;

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