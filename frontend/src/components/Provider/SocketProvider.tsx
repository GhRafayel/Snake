"use client";

import { useEffect }                        from "react";
import { useAuth }                          from "./UserProvider";
import { useSocket as getSocket }           from "@/src/components/Socket/Socket";
import { useInviteStore }                   from "@/src/components/Store/useInviteStore";
import { RoomInviteType }                   from "@/src/types/GameTypes/GameTypes";
import { useArenaStore }                    from "../Store/useArenaStore";
import { useUserStore }                     from "../Store/useUserStore";
import { RoomStateType, RoomCountdownType } from "@/src/types/GameTypes/GameTypes";
import { OnlineUsersType }                  from "@/src/types/UserTypes/UserTypes";

export default function SocketProvider({ children }: { children: React.ReactNode }) {
    const { cntUser } = useAuth();

    useEffect(() => {
      if (!cntUser?.id) return;
      const userId = cntUser.id;

      const socket = getSocket();
      if (!socket) return;

      const handleConnection = () => {
        console.log("✅ Socket connected!", socket.id)
      };
      
      const handleDisconnect = (reason: string) => {
        console.log("❌ Socket disconnected:", reason)
      };

      const handleConnectError = (err: Error) => {
        console.log("⚠️ Socket connect_error:", err.message)
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
        if (invite.from.id === userId) return;
        useInviteStore.getState().addInvite(invite);
    };

      socket.on("connect", handleConnection );
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      socket.on("online-users", handleOnlineUsers);
      socket.on("room-update", handleRoomUpdate);
      socket.on("room-countdown", handleRoomCountdown);
      socket.on("room-invite", handleRoomInvite);

      if (!socket.connected)  socket.connect();

      return () => {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error", handleConnectError);
        socket.off("online-users", handleOnlineUsers);
        socket.off("room-update", handleRoomUpdate);
        socket.off("room-countdown", handleRoomCountdown);
        socket.off("room-invite", handleRoomInvite);
        socket.disconnect();
      };

    },[cntUser?.id])

    return children;
}
