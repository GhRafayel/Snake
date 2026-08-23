'use client';
import { Dispatch, SetStateAction, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Lib } from '@/src/lib/lib';
import ResetCodePage from './ResetCodePage';
import { useAuth } from '../../Provider/UserProvider';
interface ChangePasswordFormPropsType {
  setShowChangePassword: Dispatch<SetStateAction<boolean>>;
}

export default function ChangePasswordForm({ setShowChangePassword }: ChangePasswordFormPropsType) {
  
  const profil = useAuth().LENUAGE.Profile.settings.secure;
  const [code , setCode] = useState(false);
  const [newPassword, setNewPass] = useState("");

  return (code ? (<ResetCodePage newPassword={newPassword} setShowChangePassword={setShowChangePassword}/>) :
    (
         <>
          <div className="pf-lbl pf-lblForm">
            <span className="pf-iconWrap">
              <KeyRound size={16} />
            </span>
            <form className="pf-form" onSubmit={async (e) => {
                e.preventDefault();
                const form = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));
                setNewPass(String(form.New));
                const res = await Lib.patchRequest('/api/edit?path=/auth/change-password', {
                  OldPassword: form.Old, NewPassword: form.New,
                });
                setCode(res.ok);
              }}
            >
              <input type="password" autoComplete="current-password" name="Old" placeholder={profil.oldPassword} className="pf-input"/>
              <input type="password" autoComplete="new-password" name="New" placeholder={profil.newPassword} className="pf-input" />
              
              <button type="submit" className="pf-btn pf-btnPrimary">
                {profil.changePassword}
              </button>
            </form>
          </div>

          <div className="pf-val">
            <button className="pf-btn pf-btnGhost" type="button" onClick={() => setShowChangePassword(true)}>
              {profil.close}
            </button>
          </div>
        </>
    )
 
  );
}