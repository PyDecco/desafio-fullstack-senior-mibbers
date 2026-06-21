import { evaluateCoupon } from './evaluate-coupon';
import { DiscountType, RejectionCode, type Coupon } from './models';

const coupon = (over: Partial<Coupon> = {}): Coupon => ({
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

const at = (iso: string, subtotalCents = 10000) => ({ now: new Date(iso), subtotalCents });

describe('core/evaluate-coupon - motivos', () => {
  it('inativo retorna COUPON_INACTIVE', () => {
    expect(evaluateCoupon(coupon({ active: false }), at('2026-06-01T12:00:00Z'))).toEqual({
      valid: false,
      rejection: { reason: RejectionCode.Inactive },
    });
  });

  it('antes de startsAt retorna COUPON_NOT_STARTED', () => {
    const c = coupon({ startsAt: '2026-07-01T00:00:00Z' });
    expect(evaluateCoupon(c, at('2026-06-01T00:00:00Z')).valid).toBe(false);
    expect(evaluateCoupon(c, at('2026-06-01T00:00:00Z'))).toEqual({
      valid: false,
      rejection: { reason: RejectionCode.NotStarted },
    });
  });

  it('depois de expiresAt retorna COUPON_EXPIRED', () => {
    const c = coupon({ expiresAt: '2026-06-01T00:00:00Z' });
    expect(evaluateCoupon(c, at('2026-06-02T00:00:00Z'))).toEqual({
      valid: false,
      rejection: { reason: RejectionCode.Expired },
    });
  });

  it('limite atingido (count == max) retorna REDEMPTION_LIMIT_REACHED', () => {
    expect(evaluateCoupon(coupon({ maxRedemptions: 100, redemptionCount: 100 }), at('2026-06-01T00:00:00Z'))).toEqual({
      valid: false,
      rejection: { reason: RejectionCode.LimitReached },
    });
  });

  it('penultimo slot (count == max - 1) passa', () => {
    expect(evaluateCoupon(coupon({ maxRedemptions: 100, redemptionCount: 99 }), at('2026-06-01T00:00:00Z')).valid).toBe(true);
  });

  it('subtotal abaixo do minimo retorna MINIMUM_NOT_MET com missingCents', () => {
    expect(evaluateCoupon(coupon({ minPurchaseCents: 5000 }), at('2026-06-01T00:00:00Z', 3000))).toEqual({
      valid: false,
      rejection: { reason: RejectionCode.MinimumNotMet, missingCents: 2000 },
    });
  });

  it('subtotal igual ao minimo qualifica', () => {
    expect(evaluateCoupon(coupon({ minPurchaseCents: 5000 }), at('2026-06-01T00:00:00Z', 5000)).valid).toBe(true);
  });

  it('subtotal == minimo - 1 rejeita com missingCents 1', () => {
    expect(evaluateCoupon(coupon({ minPurchaseCents: 5000 }), at('2026-06-01T00:00:00Z', 4999))).toEqual({
      valid: false,
      rejection: { reason: RejectionCode.MinimumNotMet, missingCents: 1 },
    });
  });

  it('cupom valido retorna valid:true com breakdown', () => {
    expect(evaluateCoupon(coupon(), at('2026-06-01T00:00:00Z', 19900))).toEqual({
      valid: true,
      breakdown: { subtotalCents: 19900, discountCents: 1990, finalCents: 17910 },
    });
  });

  it('subtotal 0 sem minimo e valido (desconto 0)', () => {
    expect(evaluateCoupon(coupon(), at('2026-06-01T00:00:00Z', 0))).toEqual({
      valid: true,
      breakdown: { subtotalCents: 0, discountCents: 0, finalCents: 0 },
    });
  });
});

describe('core/evaluate-coupon - ordem fail-fast', () => {
  it('INACTIVE tem precedencia sobre NOT_STARTED', () => {
    const c = coupon({ active: false, startsAt: '2026-07-01T00:00:00Z' });
    expect(evaluateCoupon(c, at('2026-06-01T00:00:00Z')).valid).toBe(false);
    expect(evaluateCoupon(c, at('2026-06-01T00:00:00Z'))).toEqual({
      valid: false,
      rejection: { reason: RejectionCode.Inactive },
    });
  });

  it('NOT_STARTED antes de EXPIRED (estado impossivel sob parseCoupon)', () => {
    const c = coupon({ startsAt: '2026-07-01T00:00:00Z', expiresAt: '2026-06-01T00:00:00Z' });
    expect(evaluateCoupon(c, at('2026-06-15T00:00:00Z'))).toEqual({
      valid: false,
      rejection: { reason: RejectionCode.NotStarted },
    });
  });

  it('EXPIRED tem precedencia sobre LIMIT', () => {
    const c = coupon({ expiresAt: '2026-06-01T00:00:00Z', maxRedemptions: 100, redemptionCount: 100 });
    expect(evaluateCoupon(c, at('2026-06-02T00:00:00Z'))).toEqual({
      valid: false,
      rejection: { reason: RejectionCode.Expired },
    });
  });

  it('LIMIT tem precedencia sobre MINIMUM', () => {
    const c = coupon({ maxRedemptions: 100, redemptionCount: 100, minPurchaseCents: 5000 });
    expect(evaluateCoupon(c, at('2026-06-01T00:00:00Z', 1000))).toEqual({
      valid: false,
      rejection: { reason: RejectionCode.LimitReached },
    });
  });
});

describe('core/evaluate-coupon - fronteira temporal inclusiva', () => {
  const expires = '2026-06-01T00:00:00.000Z';
  const expiresMs = Date.parse(expires);
  const starts = '2026-06-01T00:00:00.000Z';
  const startsMs = Date.parse(starts);

  it('expiresAt - 1ms ainda vale', () => {
    expect(evaluateCoupon(coupon({ expiresAt: expires }), { now: new Date(expiresMs - 1), subtotalCents: 10000 }).valid).toBe(true);
  });

  it('expiresAt exato ainda vale (inclusivo)', () => {
    expect(evaluateCoupon(coupon({ expiresAt: expires }), { now: new Date(expiresMs), subtotalCents: 10000 }).valid).toBe(true);
  });

  it('expiresAt + 1ms expira', () => {
    expect(evaluateCoupon(coupon({ expiresAt: expires }), { now: new Date(expiresMs + 1), subtotalCents: 10000 })).toEqual({
      valid: false,
      rejection: { reason: RejectionCode.Expired },
    });
  });

  it('startsAt - 1ms ainda nao iniciou', () => {
    expect(evaluateCoupon(coupon({ startsAt: starts }), { now: new Date(startsMs - 1), subtotalCents: 10000 })).toEqual({
      valid: false,
      rejection: { reason: RejectionCode.NotStarted },
    });
  });

  it('startsAt exato ja iniciou (inclusivo)', () => {
    expect(evaluateCoupon(coupon({ startsAt: starts }), { now: new Date(startsMs), subtotalCents: 10000 }).valid).toBe(true);
  });

  it('compara por epoch: expiresAt em -03:00 e now em UTC do mesmo instante ainda vale', () => {
    const c = coupon({ expiresAt: '2026-06-01T00:00:00-03:00' });
    expect(evaluateCoupon(c, { now: new Date('2026-06-01T03:00:00Z'), subtotalCents: 10000 }).valid).toBe(true);
  });
});

describe('core/evaluate-coupon - campos null sao no-op', () => {
  it('todos os opcionais null com subtotal baixo e contagem alta ainda e valido', () => {
    const c = coupon({ startsAt: null, expiresAt: null, maxRedemptions: null, minPurchaseCents: null, redemptionCount: 999999 });
    expect(evaluateCoupon(c, at('2026-06-01T00:00:00Z', 1)).valid).toBe(true);
  });
});
