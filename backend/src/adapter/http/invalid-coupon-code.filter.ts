import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { InvalidCouponCodeError } from '../../core/normalize-code';
import { INVALID_COUPON_CODE_MESSAGE } from './error-messages';

@Catch(InvalidCouponCodeError)
export class InvalidCouponCodeFilter implements ExceptionFilter {
  catch(_exception: InvalidCouponCodeError, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      error: 'Unprocessable Entity',
      message: INVALID_COUPON_CODE_MESSAGE,
    });
  }
}
