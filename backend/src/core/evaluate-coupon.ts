import { computeDiscount } from './discount';
import { RejectionCode, type Coupon, type EvaluationContext, type Rejection, type ValidationResult } from './models';

export function evaluateCoupon(coupon: Coupon, ctx: EvaluationContext): ValidationResult {
  const rejection = firstRejection(coupon, ctx);
  return rejection === null
    ? { valid: true, breakdown: computeDiscount(coupon, ctx.subtotalCents) }
    : { valid: false, rejection };
}

function firstRejection(coupon: Coupon, { now, subtotalCents }: EvaluationContext): Rejection | null {
  if (!coupon.active) {
    return { reason: RejectionCode.Inactive };
  }
  const nowMs = now.getTime();
  if (coupon.startsAt !== null && nowMs < Date.parse(coupon.startsAt)) {
    return { reason: RejectionCode.NotStarted };
  }
  if (coupon.expiresAt !== null && nowMs > Date.parse(coupon.expiresAt)) {
    return { reason: RejectionCode.Expired };
  }
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { reason: RejectionCode.LimitReached };
  }
  if (coupon.minPurchaseCents !== null && subtotalCents < coupon.minPurchaseCents) {
    return { reason: RejectionCode.MinimumNotMet, missingCents: coupon.minPurchaseCents - subtotalCents };
  }
  return null;
}
