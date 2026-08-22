import { io, Socket} from "socket.io-client";

const SOCKET_PORT = 2000;

let socket : Socket | null =  null;

function ensureSocket(): Socket | null {
  if (socket) return socket;
  if (typeof window === "undefined") return null;

  // I did this for having connection with other computers
  const url = `http://${window.location.hostname}:${SOCKET_PORT}`;
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
