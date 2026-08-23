import { create } from "zustand";
import { FriendType } from "@/src/types/FriendTypes/FriendTypes";
import { useArenaStore } from "./useArenaStore";

import { Lib } from "@/src/lib/lib";

interface FriendStoreType {
  friends: FriendType[];
  invited: number[];
  
  fetchFriends: () => Promise<void>;
  deleteFriend: (id: number) => Promise<void>;
  rejectFriend: (id: number) => Promise<void>;
  acceptFriend: (id: number) => Promise<void>;
  cancelRequest: (id: number) => Promise<void>;
  handleInvite: (friendId: number) => void;
}

export const useFriendStore = create<FriendStoreType>((set) => ( {
    friends: [],
    invited: [],

    fetchFriends: async () => {
      try {
          const res = await fetch("/api/edit?path=/friends");
          if (!res.ok) return;
          const data = await res.json();
          set({ friends: data });
      } catch {
          console.log("Fetch friends failed");
      }
    },

    deleteFriend : async (id: number) => {
      try {
          const res = await fetch(`/api/edit?path=/friends/${id}`, {method: "DELETE"});
          const ok = await res.json();
          if (!ok) throw new Error("Delete friend failed");
          set((state) => ({ friends: state.friends.filter((friend) => friend.id !== id)}))
      } catch {
          console.log("Delete friend failed");
      }
    },

    acceptFriend: async (id: number) => {
      try {
          await Lib.patchRequest(`/api/edit?path=/friends/request/${id}/accept`, {});
          set((state) => ({
              friends : state.friends
              .map((friend) => friend.requestId === id ? {...friend, status: "ACCEPTED"} : friend)
          }))
      } catch {
          console.log("Accept friend request failed");
      }
    },
    
    rejectFriend: async (id: number) => {
          await Lib.patchRequest(`/api/edit?path=/friends/request/${id}/reject`, {});
          set((state) => ({
              friends: state.friends.filter((friend) => friend.requestId !== id)
          }))
    },

    cancelRequest: async (id: number) => {
      try {
          const res = await fetch(`/api/edit?path=/friends/request`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ receiverId: id }),
          });
          const ok = await res.json();
          if (!ok) throw new Error("Cancel friend request failed");
          set((state) => ({
              friends: state.friends.filter((friend) => friend.id !== id),
          }))
      } catch {
          console.log("Cancel friend request failed");
      }
    },
    
    handleInvite: (friendId: number) => {
        useArenaStore.getState().inviteFriend(friendId);
        set((state) => ( {
          invited: [...state.invited, friendId]
        }));
        setTimeout(() => set((state) => ({
          invited: state.invited.filter((id) => id !== friendId)
        })), 10000)
    },
}));