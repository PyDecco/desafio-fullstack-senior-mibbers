/**
 * Dinheiro no domínio é sempre um inteiro de centavos (`Cents`), nunca float.
 * Estes helpers concentram os guards de integridade e as operações seguras
 * (soma/multiplicação com falha-alto em overflow), que todo o cálculo consome.
 */
export type Cents = number;

/** Maior valor de centavos representável com segurança em `number`. */
export const MAX_SAFE_CENTS = Number.MAX_SAFE_INTEGER;

/** Garante que `value` é um inteiro de centavos válido: >= 0 e dentro do inteiro seguro. */
export function assertCents(value: number, label = 'valor'): asserts value is Cents {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(
      `${label} deve ser um inteiro de centavos >= 0 e dentro do inteiro seguro; recebido: ${String(value)}`,
    );
  }
}

/** Soma centavos com falha-alto caso o resultado estoure o inteiro seguro. */
export function addCents(a: Cents, b: Cents): Cents {
  assertCents(a, 'parcela');
  assertCents(b, 'parcela');
  const sum = a + b;
  assertCents(sum, 'soma');
  return sum;
}

/** Multiplica centavos por um fator inteiro não-negativo, com falha-alto no overflow. */
export function mulCents(value: Cents, factor: number): Cents {
  assertCents(value, 'valor');
  if (!Number.isSafeInteger(factor) || factor < 0) {
    throw new RangeError(`fator deve ser um inteiro >= 0; recebido: ${String(factor)}`);
  }
  const product = value * factor;
  assertCents(product, 'produto');
  return product;
}
