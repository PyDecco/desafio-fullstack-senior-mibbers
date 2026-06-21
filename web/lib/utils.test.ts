import { describe, it, expect } from 'vitest';
import { formatBRL } from '@/lib/utils';

const norm = (value: string) => value.replace(/\s/g, ' ');

describe('formatBRL', () => {
  it('formata zero', () => {
    expect(norm(formatBRL(0))).toBe('R$ 0,00');
  });

  it('formata centavos isolados', () => {
    expect(norm(formatBRL(1))).toBe('R$ 0,01');
  });

  it('formata o exemplo de missingCents do contrato', () => {
    expect(norm(formatBRL(4000))).toBe('R$ 40,00');
  });

  it('formata reais com centavos', () => {
    expect(norm(formatBRL(17910))).toBe('R$ 179,10');
  });

  it('formata milhares com separador', () => {
    expect(norm(formatBRL(199900))).toBe('R$ 1.999,00');
  });
});
