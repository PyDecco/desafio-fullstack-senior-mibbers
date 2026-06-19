import { computeDiscount } from './discount';
import { DiscountType, type DiscountInput } from './models/discount.model';

const percentage = (discountValue: number, maxDiscountCents: number | null = null): DiscountInput => ({
  discountType: DiscountType.Percentage,
  discountValue,
  maxDiscountCents,
});

const fixed = (discountValue: number): DiscountInput => ({
  discountType: DiscountType.Fixed,
  discountValue,
  maxDiscountCents: null,
});

describe('core/discount - PERCENTAGE', () => {
  it('aplica 10% sem teto', () => {
    expect(computeDiscount(percentage(10), 1000)).toEqual({
      subtotalCents: 1000,
      discountCents: 100,
      finalCents: 900,
    });
  });

  it('arredonda para BAIXO (FLOOR): 199 @ 10% => 19 (nao 20)', () => {
    expect(computeDiscount(percentage(10), 199)).toEqual({
      subtotalCents: 199,
      discountCents: 19,
      finalCents: 180,
    });
  });

  it('arredonda para BAIXO: 195 @ 10% => 19', () => {
    expect(computeDiscount(percentage(10), 195).discountCents).toBe(19);
  });

  it('10% de subtotal < 10 centavos => desconto 0', () => {
    expect(computeDiscount(percentage(10), 9)).toEqual({
      subtotalCents: 9,
      discountCents: 0,
      finalCents: 9,
    });
  });

  it('1% de 99 => desconto 0 (trunc)', () => {
    expect(computeDiscount(percentage(1), 99).discountCents).toBe(0);
  });

  it('100% zera o final', () => {
    expect(computeDiscount(percentage(100), 1000)).toEqual({
      subtotalCents: 1000,
      discountCents: 1000,
      finalCents: 0,
    });
  });
});

describe('core/discount - teto (maxDiscountCents)', () => {
  it('aplica o teto quando o raw o excede (90% teto 30 de 1000 => 30)', () => {
    expect(computeDiscount(percentage(90, 30), 1000)).toEqual({
      subtotalCents: 1000,
      discountCents: 30,
      finalCents: 970,
    });
  });

  it('teto inofensivo quando o raw e menor (10% teto 30 de 100 => 10)', () => {
    expect(computeDiscount(percentage(10, 30), 100).discountCents).toBe(10);
  });

  it('teto 0 anula o desconto', () => {
    expect(computeDiscount(percentage(50, 0), 1000)).toEqual({
      subtotalCents: 1000,
      discountCents: 0,
      finalCents: 1000,
    });
  });
});

describe('core/discount - FIXED', () => {
  it('aplica desconto fixo simples', () => {
    expect(computeDiscount(fixed(50), 1000)).toEqual({
      subtotalCents: 1000,
      discountCents: 50,
      finalCents: 950,
    });
  });

  it('fixo maior que o subtotal zera o final (clamp), nunca negativo', () => {
    expect(computeDiscount(fixed(500), 300)).toEqual({
      subtotalCents: 300,
      discountCents: 300,
      finalCents: 0,
    });
  });

  it('fixo exatamente igual ao subtotal => final 0', () => {
    expect(computeDiscount(fixed(300), 300).finalCents).toBe(0);
  });
});

describe('core/discount - subtotal zero', () => {
  it('subtotal 0 produz desconto 0 e final 0', () => {
    expect(computeDiscount(percentage(50), 0)).toEqual({
      subtotalCents: 0,
      discountCents: 0,
      finalCents: 0,
    });
  });
});

describe('core/discount - invariantes (propriedade)', () => {
  const subtotals = [0, 1, 9, 10, 99, 100, 199, 1000, 19900, 999999];
  const inputs: DiscountInput[] = [
    percentage(1),
    percentage(10),
    percentage(50),
    percentage(100),
    percentage(90, 30),
    fixed(1),
    fixed(50),
    fixed(500),
  ];

  it('discount + final === subtotal e 0 <= discount <= subtotal para toda combinacao', () => {
    for (const subtotal of subtotals) {
      for (const input of inputs) {
        const r = computeDiscount(input, subtotal);
        expect(r.discountCents + r.finalCents).toBe(subtotal);
        expect(r.discountCents).toBeGreaterThanOrEqual(0);
        expect(r.discountCents).toBeLessThanOrEqual(subtotal);
        expect(Number.isInteger(r.discountCents)).toBe(true);
        expect(Number.isInteger(r.finalCents)).toBe(true);
      }
    }
  });
});

describe('core/discount - asserts de entrada (falha alto)', () => {
  it('rejeita subtotal nao inteiro', () => {
    expect(() => computeDiscount(percentage(10), 100.5)).toThrow();
  });

  it('rejeita subtotal negativo', () => {
    expect(() => computeDiscount(percentage(10), -1)).toThrow();
  });

  it('rejeita percentual acima de 100', () => {
    expect(() => computeDiscount(percentage(101), 1000)).toThrow();
  });

  it('rejeita percentual abaixo de 1 (zero)', () => {
    expect(() => computeDiscount(percentage(0), 1000)).toThrow();
  });

  it('rejeita fixo nao positivo', () => {
    expect(() => computeDiscount(fixed(0), 1000)).toThrow();
  });

  it('rejeita discountValue nao inteiro', () => {
    expect(() => computeDiscount(percentage(10.5), 1000)).toThrow();
  });

  it('rejeita maxDiscountCents negativo', () => {
    expect(() => computeDiscount(percentage(10, -5), 1000)).toThrow();
  });

  it('falha alto quando o produto intermediario subtotal*percent estoura o inteiro seguro', () => {
    // subtotal seguro, mas subtotal*100 ultrapassa MAX_SAFE_INTEGER (defesa em profundidade)
    expect(() => computeDiscount(percentage(100), 100_000_000_000_000)).toThrow();
  });
});
