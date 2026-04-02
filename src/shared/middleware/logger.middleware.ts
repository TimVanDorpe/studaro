import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Middleware that logs every incoming HTTP request with method, URL, status code, and duration.
// Applied globally via AppModule.configure() so all routes are covered.
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();

    // Listen for the 'finish' event on the response so we know the status code and duration.
    res.on('finish', () => {
      const statusCode = res.statusCode;
      const duration = Date.now() - start;
      this.logger.log(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    });

    next();
  }
}
