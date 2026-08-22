"use client";

import { useEffect } from "react";
import { useAuth } from "./UserProvider";
import { createSoket} from "@/src/components/Socket/Socket";
import { useInviteStore } from "@/src/components/Store/useInviteStore";
import { RoomInviteType } from "@/src/types/GameTypes/GameTypes";
import { useArenaStore } from "../Store/useArenaStore";
import { useUserStore } from "../Store/useUserStore";
import { RoomStateType, RoomCountdownType } from "@/src/types/GameTypes/GameTypes";
import { OnlineUsersType }                  from "@/src/types/UserTypes/UserTypes";

export default function SocketProvider({ children }: { children: React.ReactNode }) {
    const { cntUser } = useAuth();

    useEffect(() => {
      if (!cntUser) return;

      const socket = createSoket();
      if (!socket) return;

      const handleConnection = () => {
        console.log("✅ Socket connected!", socket.id)
      };
      
      const handleDisconnect = () => {
        console.log("❌ Socket disconnected")
      };

      const handleOnlineUsers = (gameData: OnlineUsersType[]) => {
          useUserStore.setState({ onlineUsers: gameData });
      };

      const handleRoomUpdate = (gameData: RoomStateType) => {
          useArenaStore.getState().setRoomState({ ...gameData });
          if (gameData.roomStatus !== "STARTING")
              useArenaStore.getState().setCountdownSeconds(null);
      };

      const handleRoomCountdown = (gameData: RoomCountdownType) => {
          useArenaStore.getState().setCountdownSeconds(gameData.seconds);
      };

      const handleRoomInvite = (invite: RoomInviteType) => {
        if (invite.from.id === cntUser.id) return;
        useInviteStore.getState().addInvite(invite);
    };

      socket.on("connect", handleConnection );
      socket.on("disconnect", handleDisconnect);
      socket.on("online-users", handleOnlineUsers);
      socket.on("room-update", handleRoomUpdate);
      socket.on("room-countdown", handleRoomCountdown);
      socket.on("room-invite", handleRoomInvite);

      if (!socket.connected)  socket.connect();

      return () => {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("online-users", handleOnlineUsers);
        socket.off("room-update", handleRoomUpdate);
        socket.off("room-countdown", handleRoomCountdown);
        socket.off("room-invite", handleRoomInvite);
        socket.disconnect();
      };

    },[cntUser?.id])

    return children;
}
