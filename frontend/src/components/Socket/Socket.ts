import { io, Socket} from "socket.io-client";

let socket : Socket | null =  null;


function isLocalWithoutNginx(): boolean {
  return window.location.port === "3000";
}

function localSocketUrl(): string {
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

function ensureSocket(): Socket | null {
  if (socket) return socket;
  if (typeof window === "undefined") return null;

  const url = process.env.NEXT_PUBLIC_SOCKET_URL
    || (isLocalWithoutNginx() ? localSocketUrl() : `${window.location.protocol}//${window.location.host}`);

  socket = io(url, {
        withCredentials: true,
        autoConnect: false,
        transports: ['websocket'],
        auth: (cb) => {
          fetch("/api/socket-token")
            .then((res) => res.json())
            .then((data) => cb({ token: data.accessToken }))
            .catch(() => cb({ token: null }));
        },
    })
  return socket;
}

export function useSocket() {
    return ensureSocket();
}
