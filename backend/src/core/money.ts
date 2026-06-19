import type { Cents } from './models/money.model';

export const MAX_SAFE_CENTS = Number.MAX_SAFE_INTEGER;

export function assertCents(value: number): asserts value is Cents {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`centavos invalidos: ${value}`);
  }
}

export function addCents(a: Cents, b: Cents): Cents {
  assertCents(a);
  assertCents(b);
  const sum = a + b;
  assertCents(sum);
  return sum;
}

export function mulCents(value: Cents, factor: number): Cents {
  assertCents(value);
  if (!Number.isSafeInteger(factor) || factor < 0) {
    throw new RangeError(`fator invalido: ${factor}`);
  }
  const product = value * factor;
  assertCents(product);
  return product;
}
