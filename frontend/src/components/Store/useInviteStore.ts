import { create } from "zustand";
import { RoomInviteType } from "@/src/types/GameTypes/GameTypes";

interface InviteStoreType {
  invites: RoomInviteType[];
  addInvite: (invite: RoomInviteType) => void;
  removeInvite: (roomId: string, fromId: number) => void;
  clearInvites: () => void;
}

export const useInviteStore = create<InviteStoreType>((set) => ({
  invites: [],

  addInvite: (invite) =>
    set((state) => ({
      invites: state.invites.some(
        (i) => i.roomId === invite.roomId && i.from.id === invite.from.id
      )
        ? state.invites
        : [...state.invites, invite],
    })),

  removeInvite: (roomId, fromId) =>
    set((state) => ({
      invites: state.invites.filter(
        (i) => !(i.roomId === roomId && i.from.id === fromId)
      ),
    })),

  clearInvites: () => set({ invites: [] }),
}));
