import { ConsoleLogger, Injectable } from '@nestjs/common';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

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
        this.writeLogToFile(message, logContext);
        logContext !== undefined ? super.log(message, logContext) : super.log(message);
    }

    error (message: any, trace?: string, errorContext?: string) {
        this.writeLogToFile(message, errorContext);
        const args = [trace, errorContext].filter((arg) => arg !== undefined) as string[];
        super.error(message, ...args);
    }

    warn (message: any, warnContext?: string) {
        this.writeLogToFile(message, warnContext);
        warnContext !== undefined ? super.warn(message, warnContext) : super.warn(message);
    }

    debug (message: any, debugContext?: string) {
        this.writeLogToFile(message, debugContext);
        debugContext !== undefined ? super.debug(message, debugContext) : super.debug(message);
    }

    verbose (message: any, verboseContext?: string) {
        this.writeLogToFile(message, verboseContext);
        verboseContext !== undefined ? super.verbose(message, verboseContext) : super.verbose(message);
    }
}
