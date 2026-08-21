import { Injectable } from '@nestjs/common';
@Injectable()
export class SocketService {
  formatRoomUpdata(roomId: string, players: number) {
    return { roomId, players, timestamp: new Date() };
  }
  
}

