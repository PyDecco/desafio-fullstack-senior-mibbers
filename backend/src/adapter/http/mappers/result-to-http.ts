import { RejectionCode } from '../../../core/models/rejection.model';
import type { ValidationOutcome } from '../../../core/models/validate-coupon.model';

const MESSAGES: Record<RejectionCode, string> = {
  [RejectionCode.NotFound]: 'Cupom nao encontrado.',
  [RejectionCode.Inactive]: 'Cupom inativo.',
  [RejectionCode.NotStarted]: 'Cupom ainda nao esta valido.',
  [RejectionCode.Expired]: 'Cupom expirado.',
  [RejectionCode.LimitReached]: 'Limite de usos do cupom atingido.',
  [RejectionCode.MinimumNotMet]: 'Valor minimo de compra nao atingido.',
};

export function toValidateResponse(outcome: ValidationOutcome) {
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

  return {
    valid: false,
    reason: outcome.reason,
    message: MESSAGES[outcome.reason],
    subtotalCents: outcome.subtotalCents,
    ...(outcome.missingCents !== null ? { missingCents: outcome.missingCents } : {}),
  };
}
