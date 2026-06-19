import { assertCents, mulCents } from './money';
import { DiscountType, type DiscountInput, type Breakdown } from './models/discount.model';

export function computeDiscount(input: DiscountInput, subtotalCents: number): Breakdown {
  assertCents(subtotalCents);
  assertDiscountInput(input);

  const raw =
    input.discountType === DiscountType.Percentage
      ? Math.trunc(mulCents(subtotalCents, input.discountValue) / 100)
      : input.discountValue;

  const capped = input.maxDiscountCents === null ? raw : Math.min(raw, input.maxDiscountCents);
  const discountCents = Math.min(Math.max(capped, 0), subtotalCents);

  return { subtotalCents, discountCents, finalCents: subtotalCents - discountCents };
}

function assertDiscountInput({ discountType, discountValue, maxDiscountCents }: DiscountInput): void {
  if (!Number.isInteger(discountValue)) {
    throw new RangeError(`discountValue invalido: ${discountValue}`);
  }
  if (discountType === DiscountType.Percentage && (discountValue < 1 || discountValue > 100)) {
    throw new RangeError(`percentual fora de 1..100: ${discountValue}`);
  }
  if (discountType === DiscountType.Fixed && discountValue <= 0) {
    throw new RangeError(`fixo deve ser > 0: ${discountValue}`);
  }
  if (maxDiscountCents !== null) {
    assertCents(maxDiscountCents);
  }
}
