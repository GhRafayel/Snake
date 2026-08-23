import { io, Socket} from "socket.io-client";

let socket : Socket | null =  null;

// TODO(temp): local dev fallback for when nginx isn't running in front of
// `next dev` (port 3000) — connects straight to the backend gateway on 2000
// instead of going through the nginx proxy. Delete once nginx is required.
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
