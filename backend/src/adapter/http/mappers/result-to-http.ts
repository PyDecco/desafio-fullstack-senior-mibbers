import { RejectionCode } from '../../../core/models/rejection.model';
import type { DiscountType } from '../../../core/models/discount.model';
import type { ValidationOutcome } from '../../../core/models/validate-coupon.model';

export type ValidateCouponResponse =
  | {
      valid: true;
      couponCode: string;
      discountType: DiscountType;
      subtotalCents: number;
      discountCents: number;
      finalCents: number;
    }
  | { valid: false; reason: Exclude<RejectionCode, RejectionCode.MinimumNotMet>; message: string; subtotalCents: number }
  | { valid: false; reason: RejectionCode.MinimumNotMet; message: string; subtotalCents: number; missingCents: number };

const MESSAGES: Record<RejectionCode, string> = {
  [RejectionCode.NotFound]: 'Cupom nao encontrado.',
  [RejectionCode.Inactive]: 'Cupom inativo.',
  [RejectionCode.NotStarted]: 'Cupom ainda nao esta valido.',
  [RejectionCode.Expired]: 'Cupom expirado.',
  [RejectionCode.LimitReached]: 'Limite de usos do cupom atingido.',
  [RejectionCode.MinimumNotMet]: 'Valor minimo de compra nao atingido.',
};

export function toValidateResponse(outcome: ValidationOutcome): ValidateCouponResponse {
  if (outcome.valid) {
    return {
      valid: true,
      couponCode: outcome.couponCode,
      discountType: outcome.discountType,
      subtotalCents: outcome.subtotalCents,
      discountCents: outcome.discountCents,
      finalCents: outcome.finalCents,
    };
  }

  if (outcome.reason === RejectionCode.MinimumNotMet) {
    return {
      valid: false,
      reason: outcome.reason,
      message: MESSAGES[outcome.reason],
      subtotalCents: outcome.subtotalCents,
      missingCents: outcome.missingCents,
    };
  }

  return { valid: false, reason: outcome.reason, message: MESSAGES[outcome.reason], subtotalCents: outcome.subtotalCents };
}
