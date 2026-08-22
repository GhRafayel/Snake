import { io, Socket} from "socket.io-client";

let socket : Socket | null =  null;

function ensureSocket(): Socket | null {
  if (socket) return socket;
  if (typeof window === "undefined") return null;

  // Go through nginx on the page's own origin (see nginx/nginx.conf's
  // /socket.io/ location) instead of hitting the backend's port 2000
  // directly — connecting to an insecure port from an https:// page is
  // blocked by browsers as mixed content.
  const url = `${window.location.protocol}//${window.location.host}`;
  socket = io(url, {
        withCredentials: true,
        autoConnect: false,
        transports: ['websocket'],
    })
  return socket;
}

export function createSoket()
{
  return ensureSocket();
}

export function useSocket() {
    return ensureSocket();
}
