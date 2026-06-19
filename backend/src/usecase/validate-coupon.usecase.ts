import { Inject, Injectable } from '@nestjs/common';
import { computeSubtotal } from '../core/cart';
import { evaluateCoupon } from '../core/evaluate-coupon';
import { normalizeCode } from '../core/normalize-code';
import { RejectionCode } from '../core/models/rejection.model';
import type { ValidateCouponCommand, ValidationOutcome } from '../core/models/validate-coupon.model';
import { COUPON_REPOSITORY, type CouponRepository } from '../ports/coupon-repository';
import { CLOCK, type Clock } from '../ports/clock';

@Injectable()
export class ValidateCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY) private readonly repo: CouponRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: ValidateCouponCommand): Promise<ValidationOutcome> {
    const subtotalCents = computeSubtotal(command.items);
    const code = normalizeCode(command.couponCode);
    const coupon = await this.repo.findByCode(code);

    if (coupon === null) {
      return { valid: false, reason: RejectionCode.NotFound, subtotalCents, missingCents: null };
    }

    const result = evaluateCoupon(coupon, { now: this.clock.now(), subtotalCents });
    if (result.valid) {
      return {
        valid: true,
        couponCode: coupon.code,
        discountType: coupon.discountType,
        subtotalCents: result.breakdown.subtotalCents,
        discountCents: result.breakdown.discountCents,
        finalCents: result.breakdown.finalCents,
      };
    }

    const missingCents =
      result.rejection.reason === RejectionCode.MinimumNotMet ? result.rejection.missingCents : null;
    return { valid: false, reason: result.rejection.reason, subtotalCents, missingCents };
  }
}
