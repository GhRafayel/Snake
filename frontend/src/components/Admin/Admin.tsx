"use client"

import { useEffect } from "react";
import { Search, ShieldCheck, ChevronRight, TriangleAlert } from "lucide-react";
import { useAuth } from "@/src/components/Provider/UserProvider";
import { useAdminStore } from "@/src/components/Store/useAdminStore";
import AdminUserForm from "./AdminUserForm";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function Admin() {

  const { cntUser, LENUAGE } = useAuth();
  const A_LENG = LENUAGE.Admin; 
  const A_STORE = useAdminStore();
  const searchUsers = useAdminStore((s) => s.searchUsers);

  useEffect(() => {
    if (cntUser?.role === "ADMIN") searchUsers("");
  }, [cntUser, searchUsers]);

  if (!cntUser || cntUser.role !== "ADMIN") return null;

  return (
    <div className={`adm-page ${cntUser.theme ? "bg text-white" : "adm-light bg-gray-200 text-black"}`}>
      <div className="grid justify-center items-center"></div>
      <div className="adm-shell">
        <div className="adm-card">
          <div className="adm-cardHead">
            <div className="adm-titleRow">
              <span className="adm-iconBadge"> <ShieldCheck size={20} /> </span>
              <div>
                <h3 className="adm-title">{A_LENG.title}</h3>
                {A_STORE.results.length > 0 && <p className="adm-subtitle">{A_STORE.results.length}</p>}
              </div>
            </div>
          </div>

          <div className="adm-cardBody">
            <form className="adm-searchBar" onSubmit={(e) => { e.preventDefault(); A_STORE.searchUsers(A_STORE.query); }}
            >
              <div className="adm-searchWrap">
                <Search size={16} className="adm-searchIcon" />
                <input className="adm-input adm-searchInput" placeholder={A_LENG.searchPlaceholder} value={A_STORE.query}
                  onChange={(e) => A_STORE.setQuery(e.currentTarget.value)}
                />
              </div>
              <button className="adm-btn adm-btnPrimary" type="submit" disabled={A_STORE.listLoading}>
                {A_STORE.listLoading ? A_LENG.searching : A_LENG.search}
              </button>
            </form>

            {A_STORE.listError && (
              <div className="adm-alert">
                <TriangleAlert size={14} />
                {A_LENG.errors[A_STORE.listError]}
              </div>
            )}

            <div className="adm-resultsList">
              {!A_STORE.listLoading && A_STORE.results.length === 0 && !A_STORE.listError && (
                <div className="adm-empty">{A_LENG.noUsersFound}</div>
              )}
              {A_STORE.results.map((user) => (
                <div key={user.id} className="adm-resultRow group" onClick={() => A_STORE.selectUser(user.id)}>
                  <span className="adm-avatar">{getInitials(user.Username)}</span>
                  <div className="adm-userInfo">
                    <span className="adm-username">{user.Username}</span>
                    <span className="adm-userEmail">{user.Email}</span>
                  </div>
                  <div className="adm-resultMeta">
                    <span className={`adm-badge ${user.role === "ADMIN" ? "adm-badgeAdmin" : "adm-badgePlayer"}`}>
                      {user.role}
                    </span>
                    <ChevronRight size={16} className="adm-chevron" />
                  </div>
                </div>
              ))}
            </div>

            {A_STORE.detailLoading && <div className="adm-empty">{A_LENG.loadingUser}</div>}

            {A_STORE.detailError && (
              <div className="adm-alert">
                <TriangleAlert size={14} />
                {A_LENG.errors[A_STORE.detailError]}
              </div>
            )}
          </div>
        </div>

        {A_STORE.selectedUser && !A_STORE.detailLoading && (
          <div className="adm-card">
            <div className="adm-cardBody">
              <div className="adm-detailHead">
                <div className="adm-detailUser">
                  <span className="adm-avatar">{getInitials(A_STORE.selectedUser.Username)}</span>
                  <div>
                    <div className="adm-detailName">
                      {A_LENG.edit} {A_STORE.selectedUser.Username}
                    </div>
                    <div className="adm-detailSub">{A_STORE.selectedUser.Email}</div>
                  </div>
                </div>
              </div>
              <AdminUserForm user={A_STORE.selectedUser} onCancel={A_STORE.clearSelectedUser} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
