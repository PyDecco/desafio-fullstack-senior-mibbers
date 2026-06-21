import { UnprocessableEntityException } from '@nestjs/common';
import { computeSubtotal } from '../../../core/cart';
import type { ValidateCouponCommand } from '../../../core/models';
import { TOTAL_CENTS_MISMATCH_MESSAGE } from '../error-messages';
import type { ValidateCouponDto } from '../dto/validate-coupon.dto';

export function toValidateCommand(dto: ValidateCouponDto): ValidateCouponCommand {
  const items = dto.cart.items.map((item) => ({
    id: item.id,
    name: item.name,
    unitPriceCents: item.unitPriceCents,
    quantity: item.quantity,
  }));

  if (dto.cart.totalCents != null && dto.cart.totalCents !== computeSubtotal(items)) {
    throw new UnprocessableEntityException(TOTAL_CENTS_MISMATCH_MESSAGE);
  }

  return { couponCode: dto.couponCode, items };
}
