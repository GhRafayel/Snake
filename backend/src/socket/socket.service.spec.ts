import { Test } from '@nestjs/testing';
import { SocketService } from './socket.service';

describe('SocketService', () => {
  let service: SocketService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [SocketService],
    }).compile();

    service = moduleRef.get(SocketService);
  });

  describe('formatRoomUpdata', () => {
    it('returns the roomId and players count unchanged', () => {
      const result = service.formatRoomUpdata('room-1', 3);

      expect(result.roomId).toBe('room-1');
      expect(result.players).toBe(3);
    });

    it('stamps the result with a Date timestamp close to now', () => {
      const before = Date.now();
      const result = service.formatRoomUpdata('room-2', 0);
      const after = Date.now();

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(after);
    });

    it('produces a fresh timestamp on every call', () => {
      const first = service.formatRoomUpdata('room-3', 1);
      const second = service.formatRoomUpdata('room-3', 2);

      expect(first.timestamp.getTime()).toBeLessThanOrEqual(second.timestamp.getTime());
    });

    it('handles a players count of zero', () => {
      const result = service.formatRoomUpdata('empty-room', 0);
      expect(result).toMatchObject({ roomId: 'empty-room', players: 0 });
    });
  });
});
