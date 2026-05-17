import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ZodError } from 'zod';
import { Response } from 'express';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(err: ZodError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.flatten(),
    });
  }
}
