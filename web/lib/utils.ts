const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatBRL(cents: number): string {
  return BRL.format(cents / 100);
}

export function assertNever(value: never): never {
  throw new Error(`Estado nao tratado: ${JSON.stringify(value)}`);
}
