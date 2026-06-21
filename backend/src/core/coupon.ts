import { DiscountType, type Coupon } from './models';
import { normalizeCode } from './normalize-code';

export class InvalidCouponError extends Error {}

const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

export function parseCoupon(input: Coupon): Coupon {
  const code = normalizeCode(input.code);
  const { discountType, discountValue, maxDiscountCents, minPurchaseCents, maxRedemptions, redemptionCount, startsAt, expiresAt } =
    input;

  check(Number.isInteger(discountValue), `discountValue invalido: ${discountValue}`);
  if (discountType === DiscountType.Percentage) {
    check(discountValue >= 1 && discountValue <= 100, `percentual fora de 1..100: ${discountValue}`);
  } else {
    check(discountValue > 0, `fixo deve ser > 0: ${discountValue}`);
  }
  check(isOptionalCents(maxDiscountCents), `maxDiscountCents invalido: ${maxDiscountCents}`);
  check(isOptionalCents(minPurchaseCents), `minPurchaseCents invalido: ${minPurchaseCents}`);
  check(maxRedemptions === null || (Number.isInteger(maxRedemptions) && maxRedemptions >= 1), `maxRedemptions invalido: ${maxRedemptions}`);
  check(Number.isInteger(redemptionCount) && redemptionCount >= 0, `redemptionCount invalido: ${redemptionCount}`);
  check(isOptionalIso(startsAt), `startsAt invalido: ${startsAt}`);
  check(isOptionalIso(expiresAt), `expiresAt invalido: ${expiresAt}`);
  check(
    startsAt === null || expiresAt === null || Date.parse(startsAt) <= Date.parse(expiresAt),
    'startsAt deve ser <= expiresAt',
  );

  return { ...input, code };
}

function check(ok: boolean, message: string): void {
  if (!ok) {
    throw new InvalidCouponError(message);
  }
}

function isOptionalCents(value: number | null): boolean {
  return value === null || (Number.isSafeInteger(value) && value >= 0);
}

function isOptionalIso(value: string | null): boolean {
  return value === null || (ISO_WITH_OFFSET.test(value) && !Number.isNaN(Date.parse(value)));
}
