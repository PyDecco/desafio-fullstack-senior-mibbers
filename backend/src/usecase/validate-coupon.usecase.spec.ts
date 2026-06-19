import { ValidateCouponUseCase } from './validate-coupon.usecase';
import { DiscountType } from '../core/models/discount.model';
import { RejectionCode } from '../core/models/rejection.model';
import type { Coupon } from '../core/models/coupon.model';
import type { CartItem } from '../core/models/cart.model';
import type { CouponRepository } from '../ports/coupon-repository';
import type { Clock } from '../ports/clock';

const NOW = new Date('2026-06-15T00:00:00Z');

const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  id: 'c',
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

const item = (unitPriceCents: number, quantity: number): CartItem => ({ id: 'p', name: 'x', unitPriceCents, quantity });

const repoWith = (coupons: Coupon[]): CouponRepository => ({
  async findByCode(code) {
    return coupons.find((c) => c.code === code) ?? null;
  },
});

const clockAt = (date: Date): Clock => ({ now: () => date });

const useCase = (coupons: Coupon[], now: Date = NOW) => new ValidateCouponUseCase(repoWith(coupons), clockAt(now));

describe('usecase/validate-coupon', () => {
  it('cupom inexistente retorna COUPON_NOT_FOUND com subtotal ecoado', async () => {
    await expect(useCase([]).execute({ couponCode: 'NOPE', items: [item(19900, 1)] })).resolves.toEqual({
      valid: false,
      reason: RejectionCode.NotFound,
      subtotalCents: 19900,
    });
  });

  it('cupom valido retorna o desconto e o couponCode normalizado', async () => {
    await expect(useCase([coupon()]).execute({ couponCode: 'LANC10', items: [item(19900, 1)] })).resolves.toEqual({
      valid: true,
      couponCode: 'LANC10',
      discountType: DiscountType.Percentage,
      subtotalCents: 19900,
      discountCents: 1990,
      finalCents: 17910,
    });
  });

  it('normaliza o couponCode antes de buscar', async () => {
    const out = await useCase([coupon()]).execute({ couponCode: ' lanc 10 ', items: [item(19900, 1)] });
    expect(out.valid).toBe(true);
  });

  it('recomputa o subtotal a partir dos itens', async () => {
    const out = await useCase([]).execute({ couponCode: 'NOPE', items: [item(1000, 2), item(500, 1)] });
    expect(out.subtotalCents).toBe(2500);
  });

  it('cupom expirado retorna COUPON_EXPIRED usando o clock injetado', async () => {
    const out = await useCase([coupon({ code: 'EXP', expiresAt: '2026-06-01T00:00:00Z' })]).execute({
      couponCode: 'EXP',
      items: [item(19900, 1)],
    });
    expect(out).toEqual({ valid: false, reason: RejectionCode.Expired, subtotalCents: 19900 });
  });

  it('cupom nao iniciado retorna COUPON_NOT_STARTED usando o clock injetado', async () => {
    const out = await useCase([coupon({ code: 'SOON', startsAt: '2026-07-01T00:00:00Z' })]).execute({
      couponCode: 'SOON',
      items: [item(19900, 1)],
    });
    expect(out).toMatchObject({ valid: false, reason: RejectionCode.NotStarted });
  });

  it('abaixo do minimo retorna MINIMUM_NOT_MET com missingCents', async () => {
    const out = await useCase([coupon({ code: 'MIN', minPurchaseCents: 5000 })]).execute({
      couponCode: 'MIN',
      items: [item(3000, 1)],
    });
    expect(out).toEqual({ valid: false, reason: RejectionCode.MinimumNotMet, subtotalCents: 3000, missingCents: 2000 });
  });

  it('codigo invalido propaga erro (mapeado para 422 na borda)', async () => {
    await expect(useCase([]).execute({ couponCode: 'LANC-10', items: [item(19900, 1)] })).rejects.toThrow();
  });
});
