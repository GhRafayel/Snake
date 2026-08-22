"use client"

import { useState } from "react";
import { User, Mail, KeyRound, Shield, Lock, Save, X, Trash2, TriangleAlert } from "lucide-react";
import { useAdminStore } from "@/src/components/Store/useAdminStore";
import { useAuth } from "@/src/components/Provider/UserProvider";
import { AdminUserType, AdminUpdateType} from "@/src/types/StoreTypes/StoreTypes";
import { RoleType } from "@/src/types/UserTypes/UserTypes";

const ROLES: RoleType[] = ["PLAYER", "ADMIN", "BOT"];

export default function AdminUserForm({ user, onCancel }: { user: AdminUserType; onCancel: () => void }) {

  const { cntUser, LENUAGE } = useAuth();
  const A_LENG = LENUAGE.Admin.form;
  const A_STORE = useAdminStore();

  const [form, setForm] = useState<AdminUpdateType>({Username: user.Username, Email: user.Email, role: user.role, Password: ""})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isSelf = cntUser?.id === user.id;

  const handleSave = async () => {
    const body: AdminUpdateType = { Username: form.Username, Email: form.Email, role: form.role };
    if (form.Password?.trim()) body.Password = form.Password;
    await A_STORE.saveUser(user.id, body);
  };

  return (
    <div className="flex flex-col">
      <div className="adm-formGrid">
        <div className="adm-field">
          <label className="adm-fieldLabel">
            <User size={12} /> {A_LENG.username}
          </label>
          <input  className="adm-input" value={form.Username}
                  onChange={(e) => setForm({...form, Username: e.currentTarget.value})}
          />
        </div>

        <div className="adm-field">
          <label className="adm-fieldLabel">
            <Mail size={12} />
            {A_LENG.email}
          </label>
          <input className="adm-input" type="email" value={form.Email}
            onChange={(e) => setForm({...form, Email: e.currentTarget.value})}
          />
        </div>

        <div className="adm-field">
          <label className="adm-fieldLabel">
            <KeyRound size={12} />
            {A_LENG.password}
          </label>
          <input className="adm-input" type="password" value={form.Password}
            onChange={(e) => setForm({...form, Password: e.currentTarget.value})}
          />
          
        </div>

        <div className="adm-field">
          <label className="adm-fieldLabel">
            <Shield size={12} />
            {A_LENG.role}
            {isSelf && <Lock size={11} className="text-(--color-text-tertiary)" />}
          </label>
          <select className="adm-input" value={form.role} disabled={isSelf}
                  title={isSelf ? A_LENG.cannotChangeOwnRole : undefined}
                  onChange={(e) => setForm({...form, role: e.currentTarget.value as RoleType})}
          >
            {ROLES.map((r) => ( <option key={r} value={r}>{r}</option> ))}
          </select>
        </div>
        <span className="text-red-500 text-lg">{A_LENG.newPassword}</span>
      </div>

      {A_STORE.saveError &&
        <div className="adm-message pt-3">
          <TriangleAlert size={13} />
          {A_LENG.errors[A_STORE.saveError]}
        </div>
      }

      <div className="adm-actions">
        <button className="adm-btn adm-btnPrimary" disabled={A_STORE.saving} 
          onClick={handleSave} >
          <Save size={13} />
          {A_STORE.saving ? A_LENG.saving : A_LENG.save}
        </button>
        <button className="adm-btn adm-btnGhost" onClick={onCancel} disabled={A_STORE.saving}>
          <X size={13} />
          {A_LENG.cancel}
        </button>

        {!showDeleteConfirm && (
          <button className="adm-btn adm-btnDanger ml-auto" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={13} />
            {A_LENG.delete}
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="adm-dangerBox">
          <p className="adm-dangerText">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-(--color-danger)" />
            {A_LENG.deleteConfirmText}
          </p>
          <div className="flex gap-2">
            <button className="adm-btn adm-btnDanger" onClick={async () => await A_STORE.deleteUser(user.id)} disabled={A_STORE.deleting}>
              <Trash2 size={13} />
              {A_STORE.deleting ? A_LENG.deleting : A_LENG.yesDelete}
            </button>
            <button className="adm-btn adm-btnGhost" onClick={() => setShowDeleteConfirm(false)} disabled={A_STORE.deleting}>
              {A_LENG.no}
            </button>
          </div>
        </div>
      )}

      {A_STORE.deleteError &&
        <div className="adm-message pt-3">
          <TriangleAlert size={13} />
          {A_LENG.errors[A_STORE.deleteError]}
        </div>
      }
    </div>
  );
}
