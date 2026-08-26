import { ConsoleLogger } from '@nestjs/common';
import { promises as fsPromises } from 'fs';
import { LoggerService } from './logger.service';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    appendFile: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('LoggerService', () => {
  let service: LoggerService;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;
  let verboseSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    logSpy = jest.spyOn(ConsoleLogger.prototype, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(ConsoleLogger.prototype, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(ConsoleLogger.prototype, 'warn').mockImplementation(() => {});
    debugSpy = jest.spyOn(ConsoleLogger.prototype, 'debug').mockImplementation(() => {});
    verboseSpy = jest.spyOn(ConsoleLogger.prototype, 'verbose').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    service = new LoggerService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('writeLogToFile', () => {
    it('creates the log directory and appends the formatted message', async () => {
      await service.writeLogToFile('hello world', 'MyContext');

      expect(fsPromises.mkdir).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true },
      );
      expect(fsPromises.appendFile).toHaveBeenCalledTimes(1);

      const [filePath, content] = (fsPromises.appendFile as jest.Mock).mock
        .calls[0] as [string, string];
      expect(filePath).toContain('app.log');
      expect(content).toContain('[MyContext] hello world');
      expect(content).toMatch(/\n$/);
    });

    it('omits the context bracket when no context is provided', async () => {
      await service.writeLogToFile('no context here');

      const [, content] = (fsPromises.appendFile as jest.Mock).mock
        .calls[0] as [string, string];
      expect(content).toContain('no context here');
      expect(content).not.toContain('[');
    });

    it('swallows errors from the filesystem and logs them to console.error', async () => {
      const fsError = new Error('disk full');
      (fsPromises.appendFile as jest.Mock).mockRejectedValueOnce(fsError);

      await expect(
        service.writeLogToFile('will fail'),
      ).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to write log to file:',
        fsError,
      );
    });
  });

  describe('log', () => {
    it('writes to file and delegates to ConsoleLogger.log with context', () => {
      service.log('message', 'Ctx');

      expect(logSpy).toHaveBeenCalledWith('message', 'Ctx');
    });

    it('writes to file and delegates to ConsoleLogger.log without context', () => {
      service.log('message');

      expect(logSpy).toHaveBeenCalledWith('message');
    });
  });

  describe('error', () => {
    it('writes to file and delegates to ConsoleLogger.error with trace and context', () => {
      service.error('boom', 'trace-1', 'ErrCtx');

      expect(errorSpy).toHaveBeenCalledWith('boom', 'trace-1', 'ErrCtx');
    });

    it('delegates with only the defined optional args', () => {
      service.error('boom');

      expect(errorSpy).toHaveBeenCalledWith('boom');
    });
  });

  describe('warn', () => {
    it('writes to file and delegates to ConsoleLogger.warn with context', () => {
      service.warn('careful', 'WarnCtx');

      expect(warnSpy).toHaveBeenCalledWith('careful', 'WarnCtx');
    });

    it('writes to file and delegates to ConsoleLogger.warn without context', () => {
      service.warn('careful');

      expect(warnSpy).toHaveBeenCalledWith('careful');
    });
  });

  describe('debug', () => {
    it('writes to file and delegates to ConsoleLogger.debug with context', () => {
      service.debug('details', 'DebugCtx');

      expect(debugSpy).toHaveBeenCalledWith('details', 'DebugCtx');
    });

    it('writes to file and delegates to ConsoleLogger.debug without context', () => {
      service.debug('details');

      expect(debugSpy).toHaveBeenCalledWith('details');
    });
  });

  describe('verbose', () => {
    it('writes to file and delegates to ConsoleLogger.verbose with context', () => {
      service.verbose('chatter', 'VerboseCtx');

      expect(verboseSpy).toHaveBeenCalledWith('chatter', 'VerboseCtx');
    });

    it('writes to file and delegates to ConsoleLogger.verbose without context', () => {
      service.verbose('chatter');

      expect(verboseSpy).toHaveBeenCalledWith('chatter');
    });
  });
});
