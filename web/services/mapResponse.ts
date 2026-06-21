import { RejectionReason, type ValidateCouponResponse } from '@/types/api';
import type { CouponState, Rejection } from '@/types/coupon';

export function mapResponse(status: number, body: unknown, couponCode: string): CouponState {
  if (status === 422) {
    return { kind: 'invalid_request', couponCode };
  }

  if (status === 200 && isValidateResponse(body)) {
    if (body.valid) {
      return {
        kind: 'applied',
        breakdown: {
          couponCode: body.couponCode,
          discountType: body.discountType,
          subtotalCents: body.subtotalCents,
          discountCents: body.discountCents,
          finalCents: body.finalCents,
        },
      };
    }

    const rejection: Rejection =
      body.reason === RejectionReason.MinimumNotMet
        ? { reason: RejectionReason.MinimumNotMet, missingCents: body.missingCents }
        : { reason: body.reason };

    return { kind: 'rejected', couponCode, rejection };
  }

  return { kind: 'network_error', couponCode };
}

function isValidateResponse(body: unknown): body is ValidateCouponResponse {
  return (
    typeof body === 'object' &&
    body !== null &&
    'valid' in body &&
    typeof (body as { valid: unknown }).valid === 'boolean'
  );
}
