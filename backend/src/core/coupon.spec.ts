import { parseCoupon, InvalidCouponError } from './coupon';
import { DiscountType } from './models/discount.model';
import type { Coupon } from './models/coupon.model';

const base = (over: Partial<Coupon> = {}): Coupon => ({
  id: 'c1',
  code: 'LANC10',
  description: null,
  discountType: DiscountType.Percentage,
  discountValue: 10,
  maxDiscountCents: null,
  minPurchaseCents: null,
  startsAt: null,
  expiresAt: null,
  maxRedemptions: null,
  redemptionCount: 0,
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  ...over,
});

describe('core/coupon - parseCoupon (validos)', () => {
  it('aceita um cupom percentual valido', () => {
    expect(parseCoupon(base())).toMatchObject({ code: 'LANC10', discountValue: 10 });
  });

  it('normaliza o code', () => {
    expect(parseCoupon(base({ code: 'lanc 10' })).code).toBe('LANC10');
  });

  it('aceita as bordas do percentual (1 e 100)', () => {
    expect(parseCoupon(base({ discountValue: 1 })).discountValue).toBe(1);
    expect(parseCoupon(base({ discountValue: 100 })).discountValue).toBe(100);
  });

  it('aceita fixo positivo', () => {
    expect(parseCoupon(base({ discountType: DiscountType.Fixed, discountValue: 5000 })).discountValue).toBe(5000);
  });

  it('aceita maxRedemptions null e 1', () => {
    expect(parseCoupon(base({ maxRedemptions: null })).maxRedemptions).toBeNull();
    expect(parseCoupon(base({ maxRedemptions: 1 })).maxRedemptions).toBe(1);
  });

  it('aceita startsAt igual a expiresAt', () => {
    const t = '2026-06-01T00:00:00Z';
    expect(() => parseCoupon(base({ startsAt: t, expiresAt: t }))).not.toThrow();
  });

  it('aceita todos os opcionais nulos (sem restricao)', () => {
    expect(() =>
      parseCoupon(base({ maxDiscountCents: null, minPurchaseCents: null, startsAt: null, expiresAt: null, maxRedemptions: null })),
    ).not.toThrow();
  });
});

describe('core/coupon - parseCoupon (invariantes)', () => {
  it('rejeita percentual 0', () => {
    expect(() => parseCoupon(base({ discountValue: 0 }))).toThrow(InvalidCouponError);
  });

  it('rejeita percentual acima de 100', () => {
    expect(() => parseCoupon(base({ discountValue: 101 }))).toThrow(InvalidCouponError);
  });

  it('rejeita fixo nao positivo', () => {
    expect(() => parseCoupon(base({ discountType: DiscountType.Fixed, discountValue: 0 }))).toThrow(InvalidCouponError);
  });

  it('rejeita maxDiscountCents negativo', () => {
    expect(() => parseCoupon(base({ maxDiscountCents: -1 }))).toThrow(InvalidCouponError);
  });

  it('rejeita minPurchaseCents negativo', () => {
    expect(() => parseCoupon(base({ minPurchaseCents: -1 }))).toThrow(InvalidCouponError);
  });

  it('rejeita maxRedemptions 0', () => {
    expect(() => parseCoupon(base({ maxRedemptions: 0 }))).toThrow(InvalidCouponError);
  });

  it('rejeita redemptionCount negativo', () => {
    expect(() => parseCoupon(base({ redemptionCount: -1 }))).toThrow(InvalidCouponError);
  });

  it('rejeita startsAt maior que expiresAt', () => {
    expect(() =>
      parseCoupon(base({ startsAt: '2026-06-02T00:00:00Z', expiresAt: '2026-06-01T00:00:00Z' })),
    ).toThrow(InvalidCouponError);
  });

  it('rejeita data sem offset/invalida', () => {
    expect(() => parseCoupon(base({ expiresAt: '2026-06-01' }))).toThrow(InvalidCouponError);
  });

  it('rejeita code invalido', () => {
    expect(() => parseCoupon(base({ code: 'LANC-10' }))).toThrow();
  });
});
