import { clampBotLevel } from './socket.gateway';

describe('clampBotLevel', () => {
  it('clamps values below the minimum up to 1', () => {
    expect(clampBotLevel(0)).toBe(1);
    expect(clampBotLevel(-5)).toBe(1);
  });

  it('clamps values above the maximum down to 4', () => {
    expect(clampBotLevel(5)).toBe(4);
    expect(clampBotLevel(100)).toBe(4);
  });

  it('floors fractional levels', () => {
    expect(clampBotLevel(2.9)).toBe(2);
  });

  it('passes through valid integer levels unchanged', () => {
    expect(clampBotLevel(1)).toBe(1);
    expect(clampBotLevel(3)).toBe(3);
    expect(clampBotLevel(4)).toBe(4);
  });

  it('falls back to the minimum for non-numeric input', () => {
    expect(clampBotLevel(undefined)).toBe(1);
    expect(clampBotLevel(null)).toBe(1);
    expect(clampBotLevel('not-a-number')).toBe(1);
  });
});
