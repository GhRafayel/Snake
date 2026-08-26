import { ConsoleLogger, Injectable } from '@nestjs/common';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

// Writes to both app.log and the terminal (via ConsoleLogger). In production,
// the terminal/console output should be disabled and only file logging kept.
@Injectable()
export class LoggerService  extends ConsoleLogger {
    async writeLogToFile(message: string, logContext?: string) {
        const logMessage = `${new Date().toISOString()} - ${logContext ? `[${logContext}] ` : ''}${message}\n`;
        const logFilePath = path.join(__dirname, '..', 'logs', 'app.log');

        try {
            await fsPromises.mkdir(path.dirname(logFilePath), { recursive: true });
            await fsPromises.appendFile(logFilePath, logMessage);
        } catch (error) {
            console.error('Failed to write log to file:', error);
        }
    }

    log (message: any, logContext?: string) {
        void this.writeLogToFile(String(message), logContext);
        if (logContext !== undefined) {
            super.log(message, logContext);
        } else {
            super.log(message);
        }
    }

    error (message: any, trace?: string, errorContext?: string) {
        void this.writeLogToFile(String(message), errorContext);
        const args = [trace, errorContext].filter((arg) => arg !== undefined) as string[];
        super.error(message, ...args);
    }

    warn (message: any, warnContext?: string) {
        void this.writeLogToFile(String(message), warnContext);
        if (warnContext !== undefined) {
            super.warn(message, warnContext);
        } else {
            super.warn(message);
        }
    }

    debug (message: any, debugContext?: string) {
        void this.writeLogToFile(String(message), debugContext);
        if (debugContext !== undefined) {
            super.debug(message, debugContext);
        } else {
            super.debug(message);
        }
    }

    verbose (message: any, verboseContext?: string) {
        void this.writeLogToFile(String(message), verboseContext);
        if (verboseContext !== undefined) {
            super.verbose(message, verboseContext);
        } else {
            super.verbose(message);
        }
    }
}
