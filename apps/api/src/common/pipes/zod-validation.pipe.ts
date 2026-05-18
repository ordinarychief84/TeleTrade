import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T | unknown> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, metadata: ArgumentMetadata): T | unknown {
    // Only validate the request body. Method-level @UsePipes also runs against
    // @Param/@Query/@CurrentUser args, but those are scalars that should not
    // be parsed by a body schema. Query/param validation is done inline where
    // it's actually needed.
    if (metadata.type !== 'body') {
      return value;
    }
    try {
      return this.schema.parse(value);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: e.flatten(),
        });
      }
      throw e;
    }
  }
}
