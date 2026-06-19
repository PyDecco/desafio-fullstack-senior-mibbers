import { Body, Controller, HttpCode, Post, UseFilters } from '@nestjs/common';
import { ValidateCouponUseCase } from '../../usecase/validate-coupon.usecase';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { InvalidCouponCodeFilter } from './invalid-coupon-code.filter';
import { toValidateCommand } from './mappers/to-command';
import { toValidateResponse, type ValidateCouponResponse } from './mappers/result-to-http';

@Controller('coupons')
@UseFilters(InvalidCouponCodeFilter)
export class CouponsController {
  constructor(private readonly validateCoupon: ValidateCouponUseCase) {}

  @Post('validate')
  @HttpCode(200)
  async validate(@Body() dto: ValidateCouponDto): Promise<ValidateCouponResponse> {
    const outcome = await this.validateCoupon.execute(toValidateCommand(dto));
    return toValidateResponse(outcome);
  }
}
