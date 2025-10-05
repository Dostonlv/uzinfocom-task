import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/*
  i not just not wanted to use ConsoleLogger and 
  i create my own logger middleware
  and implement it
*/
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const body = req.body as Record<string, unknown>;

    res.on('finish', () => {
      const { statusCode } = res;
      const logMessage = `${method} ${originalUrl} | status=${statusCode} | body=${JSON.stringify(body)}`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
