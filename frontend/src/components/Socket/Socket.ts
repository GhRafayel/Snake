import { io, Socket} from "socket.io-client";

let socket : Socket | null =  null;


function isLocalWithoutNginx(): boolean {
  return window.location.port === "3000";
}

function localSocketUrl(): string {
  return `${window.location.protocol}//${window.location.hostname}:2000`;
}

function ensureSocket(): Socket | null {
  if (socket) return socket;
  if (typeof window === "undefined") return null;

  const url = isLocalWithoutNginx()
    ? localSocketUrl()
    : `${window.location.protocol}//${window.location.host}`;

  socket = io(url, {
        withCredentials: true,
        autoConnect: false,
        transports: ['websocket'],
    })
  return socket;
}

export function useSocket() {
    return ensureSocket();
}
