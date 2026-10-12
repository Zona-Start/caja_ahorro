import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithContext extends Request {
  id: string;
  startTime: number;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: RequestWithContext, res: Response, next: NextFunction) {
    req.id = (req.headers['x-request-id'] as string) || uuidv4();
    req.startTime = Date.now();

    res.setHeader('x-request-id', req.id);

    const originalSend = res.send;
    res.send = function (data: any) {
      const duration = Date.now() - req.startTime;
      // pino-http adjunta `req.log`; `debug` respeta el nivel (silencio en prod).
      const log = (req as any).log ?? (req as any).logger;
      log?.debug?.(
        {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
        },
        'request completed',
      );
      return originalSend.call(this, data);
    };

    next();
  }
}
