import { addCents, assertCents, mulCents, MAX_SAFE_CENTS } from './money';

describe('core/money - assertCents', () => {
  it('aceita zero', () => {
    expect(() => assertCents(0)).not.toThrow();
  });

  it('aceita inteiro positivo', () => {
    expect(() => assertCents(19900)).not.toThrow();
  });

  it('aceita o maior inteiro seguro', () => {
    expect(() => assertCents(MAX_SAFE_CENTS)).not.toThrow();
  });

  it('rejeita valor com casas decimais (float)', () => {
    expect(() => assertCents(10.5)).toThrow();
  });

  it('rejeita valor negativo', () => {
    expect(() => assertCents(-1)).toThrow();
  });

  it('rejeita NaN', () => {
    expect(() => assertCents(Number.NaN)).toThrow();
  });

  it('rejeita Infinity', () => {
    expect(() => assertCents(Number.POSITIVE_INFINITY)).toThrow();
  });

  it('rejeita inteiro fora do intervalo seguro (MAX_SAFE_CENTS + 1)', () => {
    expect(() => assertCents(MAX_SAFE_CENTS + 1)).toThrow();
  });
});

describe('core/money - addCents', () => {
  it('soma dois valores em centavos', () => {
    expect(addCents(1000, 990)).toBe(1990);
  });

  it('soma com zero e idempotente', () => {
    expect(addCents(2500, 0)).toBe(2500);
  });

  it('falha alto quando a soma estoura o inteiro seguro', () => {
    expect(() => addCents(MAX_SAFE_CENTS, 1)).toThrow();
  });

  it('rejeita parcela invalida (float)', () => {
    expect(() => addCents(100.5, 1)).toThrow();
  });
});

describe('core/money - mulCents', () => {
  it('multiplica preco unitario por quantidade', () => {
    expect(mulCents(1990, 3)).toBe(5970);
  });

  it('multiplica por zero', () => {
    expect(mulCents(1990, 0)).toBe(0);
  });

  it('rejeita fator negativo', () => {
    expect(() => mulCents(1990, -1)).toThrow();
  });

  it('rejeita fator nao inteiro', () => {
    expect(() => mulCents(1990, 1.5)).toThrow();
  });

  it('falha alto quando o produto estoura o inteiro seguro', () => {
    expect(() => mulCents(MAX_SAFE_CENTS, 2)).toThrow();
  });
});
