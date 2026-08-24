'use client';
import { useAuth } from '@/src/components/Provider/UserProvider';
import { useState } from 'react';
import Image from 'next/image';

import Friends from '@/src/components/Friends/Friends';
import Account from './Account/Account';
import Secure from './Secure/Secure';
import Preferences from './Preferences/Preferences';
import ProfilHeader from './ProfilHeaders';

export default function Profile() {

  const { cntUser, LENUAGE } = useAuth();
  const profil = LENUAGE.Profile;
  const [showChangePassword, setShowChangePassword] = useState(true);
  const [window, setWindow] = useState({request: false, prefsOpen: true, secureOpen: false, accountOpen: false});

  return (
    <div className={`pf-page ${cntUser?.theme ?? true ? "bg text-white" : "pf-light bg-gray-200 text-black"}`}>
      <div className="pf-shell">
        <div className="pf-main">

          <div className="pf-header">
            <Image src={`/avatar/${cntUser?.avatar || 'default.png'}`} alt={cntUser?.Username || 'Avatar'} width={64} height={64} className="pf-avatarLg object-cover"
            />
            <div className="pf-headerInfo">
              <h2 className="pf-headerName">{cntUser?.Username || '—'}</h2>
              {cntUser?.role && (
                <span className="pf-roleBadge">{cntUser.role}</span>
              )}
            </div>
          </div>

          <div className="pf-card">
            <div className="pf-cardBody">

              <section className="pf-section">
                <ProfilHeader title={profil.preferences} setWindow={setWindow} name="prefsOpen" value={window.prefsOpen} />
                {window.prefsOpen && ( <Preferences /> )}
              </section>

              <div className="pf-divider" />
              <section className="pf-section">
                  <ProfilHeader title={profil.settings.secure.label1} setWindow={setWindow} name="secureOpen" value={window.secureOpen} />
                  {window.secureOpen && (
                    <div className="pf-rows">
                      <Secure showChangePassword={showChangePassword} setShowChangePassword={setShowChangePassword} />
                    </div>
                  )}
              </section>

              <div className="pf-divider" />

              <section className="pf-section">
                <ProfilHeader title={profil.settings.account.account} setWindow={setWindow} name="accountOpen" value={window.accountOpen} />
                {window.accountOpen && <Account setWindow={setWindow} window={window}/>}
              </section>

            </div>
          </div>

        </div>
        <div className="pf-aside"> <Friends /> </div>
      </div>
    </div>
  );
}
