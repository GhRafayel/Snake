import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Lib } from "@/src/lib/lib";

import type { Dispatch, SetStateAction } from "react";

type PropsType = {
    setShowChangePassword: Dispatch<SetStateAction<boolean>>;
    newPassword: string;
};

export default function ResetCodePage( { setShowChangePassword, newPassword } :  PropsType) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  return (
    <>
      <div className="pf-lbl pf-lblForm">
        <span className="pf-iconWrap">
          <KeyRound size={16} />
        </span>
        <form className="pf-form" onSubmit={async(e) => {
            e.preventDefault();
            const res = await Lib.patchRequest("/api/edit?path=/auth/change-password-code", {newPassword, code})
            if (res.ok) {
              setShowChangePassword(true);
            } else {
              setError("Couldn't change password");
            }
        }} >
          <input type="text" autoFocus value={code} placeholder="Enter 6-digit code" maxLength={6}
                  className="pf-input text-center tracking-[0.5em]"
                  onChange={(e) => setCode(e.target.value)} />

          <button type="submit" disabled={code.length < 6} className="pf-btn pf-btnPrimary" >
            {"Verify Code"}
          </button>
        </form>
      </div>

      {error && <p className="pf-message w-full">{error}</p>}
    </>
  );
}