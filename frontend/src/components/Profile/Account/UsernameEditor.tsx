'use client';
import { useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '@/src/components/Provider/UserProvider';

export default function UsernameEditor() {

  const { cntUser, LENUAGE, ChangingCallback } = useAuth();
   const profil = LENUAGE.Profile;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(cntUser?.Username ?? '');
  const [error, setError] = useState(false);

  return (
    <div className={`pf-row ${editing ? 'pf-rowStack' : ''}`}>
      {!editing ? (
        <>
          <div className="pf-lbl">
            <span className="pf-iconWrap"><User size={16} /></span>
            {profil.settings.username.label}
          </div>
          <div className="pf-val min-w-0">
            <span className="pf-lbl min-w-0 truncate">{cntUser?.Username}</span>
            <button type="button" className="pf-btn pf-btnGhost shrink-0"
              onClick={() => { setValue(cntUser?.Username ?? ''); setError(false); setEditing(true); }}
            >
              {profil.settings.username.edit}
            </button>
          </div>
        </>
      ) : (
        <div className="pf-lbl pf-lblForm">
          <span className="pf-iconWrap"><User size={16} /></span>
          <form className="pf-form" onSubmit={async (e) => {
              e.preventDefault();
              const Username = value.trim();
              try {
                await ChangingCallback({ Username }, 'change-username');
                setEditing(false);
              } catch {
                setError(true);
              }
            }}
          >
            <input className="pf-input" value={value}  minLength={3} maxLength={40} required
              onChange={(e) => setValue(e.target.value)}
            />
            <button type="submit" className="pf-btn pf-btnPrimary">{profil.sub}</button>
            <button type="button" className="pf-btn pf-btnGhost" onClick={() => setEditing(false)}>
              {profil.settings.secure.close}
            </button>
          </form>
          {error && <span className="pf-message">{profil.settings.message}</span>}
        </div>
      )}
    </div>
  ); 
}
