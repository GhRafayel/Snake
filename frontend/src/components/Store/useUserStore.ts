import { create } from 'zustand'
import { OnlineUsersType } from '@/src/types/UserTypes/UserTypes';

interface UserStoreType {
  onlineUsers: OnlineUsersType[];
  setOnlineUsers: (onlineUsers: OnlineUsersType[]) => void;
  addOnlineUser: (user: OnlineUsersType) => void;
  updateUser: ( id: number, data: Partial<OnlineUsersType>) => void;
}

export const useUserStore = create<UserStoreType>((set) => ({
    onlineUsers: [],

    setOnlineUsers: (onlineUsers) => set({ onlineUsers }),

    addOnlineUser: (user) => set((state) => ({ onlineUsers: [...state.onlineUsers, user] })),
    updateUser: (id, data) => set((state) => ({
        onlineUsers: state.onlineUsers.map((user) =>
          user.id === id ? { ...user, ...data } : user
        ),
    })),
}));
