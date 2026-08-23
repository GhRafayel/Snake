import { create } from 'zustand';
import { Lib } from '@/src/lib/lib';
import { AdminUserType,  } from '@/src/types/StoreTypes/StoreTypes'; 
import { ListErrorKeyType } from '@/src/types/StoreTypes/StoreTypes';
import { DetailErrorKeyType } from '@/src/types/StoreTypes/StoreTypes';
import { SaveErrorKeyType } from '@/src/types/StoreTypes/StoreTypes';
import { DeleteErrorKeyType } from '@/src/types/StoreTypes/StoreTypes';
import { AdminUpdateType } from '@/src/types/StoreTypes/StoreTypes';
export interface AdminStoreType {
  query: string;
  results: AdminUserType[];
  listLoading: boolean;
  listError: ListErrorKeyType;

  selectedUser: AdminUserType | null;
  detailLoading: boolean;
  detailError: DetailErrorKeyType;

  saving: boolean;
  saveError: SaveErrorKeyType;

  deleting: boolean;
  deleteError: DeleteErrorKeyType;

  setQuery: (query: string) => void;
  searchUsers: (q: string) => Promise<void>;
  selectUser: (id: number) => Promise<void>;
  clearSelectedUser: () => void;
  saveUser: (id: number, body: AdminUpdateType) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
}

export const useAdminStore = create<AdminStoreType>((set) => ({
  query: '',
  results: [],
  listLoading: false,
  listError: '',

  selectedUser: null,
  detailLoading: false,
  detailError: '',

  saving: false,
  saveError: '',

  deleting: false,
  deleteError: '',

  setQuery: (query) => set({ query }),

  searchUsers: async (q) => {
    set({ listLoading: true, listError: '' });
    try {
      const res = await fetch(`/api/edit?path=/admin/users?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        set({ listError: res.status === 403 ? 'forbidden' : 'loadUsersFailed', results: [] });
        return;
      }
      const users: AdminUserType[] = await res.json();
      set({ results: users });
    } catch {
      set({ listError: 'loadUsersFailed', results: [] });
    } finally {
      set({ listLoading: false });
    }
  },
  selectUser: async (id) => {
    set({ selectedUser: null, detailLoading: true, detailError: '' });
    try {
      const res = await fetch(`/api/edit?path=/admin/users/${id}`);
      if (!res.ok) {
        set({ detailError: res.status === 403 ? 'forbidden' : 'loadUserFailed' });
        return;
      }
      const user: AdminUserType = await res.json();
      set({ selectedUser: user });
    } catch {
      set({ detailError: 'loadUserFailed' });
    } finally {
      set({ detailLoading: false });
    }
  },

  clearSelectedUser: () => set({ selectedUser: null, detailError: '', saveError: '', deleteError: '' }),
  
  saveUser: async (id, body) => {
    set({ saving: true, saveError: '' });
    try {
      const res = await Lib.putRequest(`/api/edit?path=/admin/users/${id}`, body);
      if (!res.ok) {
        set({ saveError: res.status === 403 ? 'forbidden' : 'saveFailed' });
        return false;
      }
      const updated: AdminUserType = await res.json();
      set((state) => ({ 
          selectedUser: updated,
          results: state.results.map((item) => (item.id === updated.id ? updated : item)),
        }
      ));
      return true;
    } catch {
      set({ saveError: 'saveFailed' });
      return false;
    } finally {
      set({ saving: false });
    }
  },

  deleteUser: async (id) => {
    set({ deleting: true, deleteError: '' });

    try {
      const res = await fetch(`/api/edit?path=/admin/users/${id}`, {method: "DELETE"});
      if (!res.ok) {
        set({ deleteError: res.status === 403 ? 'forbidden' : 'deleteFailed' });
        return false;
      }
      set((state) => ({
        selectedUser: null,
        results: state.results.filter((item) => item.id !== id),
      }));
      return true;
    } catch {
      set({ deleteError: 'deleteFailed' });
      return false;
    } finally {
      set({ deleting: false });
    }
  },
}));
