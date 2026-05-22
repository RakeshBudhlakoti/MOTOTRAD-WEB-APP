import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Socket } from 'socket.io';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const type = host.getType();

    if (type === 'ws') {
      const wsContext = host.switchToWs();
      const client = wsContext.getClient<Socket>();
      
      const message =
        exception instanceof HttpException
          ? exception.getResponse()
          : exception instanceof Error
          ? exception.message
          : 'Internal server error';

      this.logger.error(
        `WebSocket Error: ${JSON.stringify(message)}`,
        exception instanceof Error ? exception.stack : '',
      );

      // Emit a clean exception payload back to the specific client
      client.emit('exception', {
        status: 'error',
        message: typeof message === 'object' && (message as any).message 
          ? (message as any).message 
          : message,
      });
      return;
    }

    // Default HTTP Context handling
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      `Http Status: ${status} Error Message: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}

