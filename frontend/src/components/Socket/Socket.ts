import { io, Socket} from "socket.io-client";

let socket : Socket | null =  null;

export function createSoket(url: string)
{
  if (!socket)
  {
    socket = io(url, {
          withCredentials: true,
          autoConnect: false,
          transports: ['websocket'],
      })
  }
  return socket;
}

export function useSocket() {
    return socket;
}
