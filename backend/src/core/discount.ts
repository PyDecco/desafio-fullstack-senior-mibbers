import { assertCents, mulCents, type Cents } from './money';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

/** Subconjunto do cupom necessário ao cálculo (o `Coupon` completo o satisfaz). */
export interface DiscountInput {
  discountType: DiscountType;
  discountValue: number; // PERCENTAGE: 1..100 | FIXED: centavos (>0)
  maxDiscountCents: number | null;
}

export interface Breakdown {
  subtotalCents: Cents;
  discountCents: Cents;
  finalCents: Cents;
}

/**
 * Calcula o desconto de forma pura. Não-negatividade e teto garantidos por
 * construção (clamp), não por confiança no input. Arredondamento = FLOOR
 * (Math.trunc): o desconto nunca excede o percentual nominal.
 */
export function computeDiscount(input: DiscountInput, subtotalCents: number): Breakdown {
  assertCents(subtotalCents, 'subtotal');
  assertDiscountInput(input);

  const raw =
    input.discountType === 'PERCENTAGE'
      ? Math.trunc(mulCents(subtotalCents, input.discountValue) / 100) // mult antes de dividir; guarda overflow
      : input.discountValue;

  const capped = input.maxDiscountCents == null ? raw : Math.min(raw, input.maxDiscountCents);
  const discountCents = Math.min(Math.max(capped, 0), subtotalCents); // clamp [0, subtotal]
  const finalCents = subtotalCents - discountCents;

  return { subtotalCents, discountCents, finalCents };
}

function assertDiscountInput(input: DiscountInput): void {
  const { discountType, discountValue, maxDiscountCents } = input;

  if (!Number.isInteger(discountValue)) {
    throw new RangeError(`discountValue deve ser inteiro; recebido: ${String(discountValue)}`);
  }
  if (discountType === 'PERCENTAGE') {
    if (discountValue < 1 || discountValue > 100) {
      throw new RangeError(`percentual deve estar em 1..100; recebido: ${discountValue}`);
    }
  } else if (discountValue <= 0) {
    throw new RangeError(`desconto fixo deve ser > 0; recebido: ${discountValue}`);
  }
  if (maxDiscountCents !== null) {
    assertCents(maxDiscountCents, 'maxDiscountCents');
  }
}
