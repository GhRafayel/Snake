"use client";

import { useEffect } from "react";
import { useAuth } from "./UserProvider";
import { createSoket} from "@/src/components/Socket/Socket";
import { InviteStore } from "@/src/components/Store/InviteStore";
import { RoomInviteType } from "@/src/types/GameTypes/GameTypes";

export default function SocketProvider({ children }: { children: React.ReactNode }) {
    const { cntUser } = useAuth();
    const SOCKET_PORT = 2000;

    useEffect(() => {
      if (!cntUser) return;

      // I did this for having connection with other computers
      const url = `http://${window.location.hostname}:${SOCKET_PORT}`;
      //const url = process.env.NEXT_PUBLIC_SOCKET_URL;
      const socketref = createSoket(url);

      socketref.on("connect",  () =>  console.log("✅ Socket connected!", socketref.id));
      socketref.on("disconnect", () => console.log("❌ Socket disconnected"));

      const handleRoomInvite = (invite: RoomInviteType) => {
        if (invite.from.id === cntUser.id) return;
        InviteStore.getState().addInvite(invite);
      };
      socketref.on("room-invite", handleRoomInvite);

      if (!socketref.connected)  socketref.connect();
      return () => {
        socketref.off("connect");
        socketref.off("disconnect");
        socketref.off("room-invite", handleRoomInvite);
      };

    },[cntUser?.id])
    return children;
}
