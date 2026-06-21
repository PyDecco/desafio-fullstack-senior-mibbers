import { InMemoryCouponRepository } from './in-memory-coupon.repository';
import { DiscountType, type Coupon } from '../../core/models';

const coupon = (code: string): Coupon => ({
  id: code,
  code,
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
});

describe('adapter/persistence/in-memory-coupon.repository', () => {
  it('encontra um cupom pelo code', async () => {
    const repo = new InMemoryCouponRepository([coupon('LANC10')]);
    await expect(repo.findByCode('LANC10')).resolves.toMatchObject({ code: 'LANC10' });
  });

  it('retorna null para code inexistente', async () => {
    const repo = new InMemoryCouponRepository([coupon('LANC10')]);
    await expect(repo.findByCode('NOPE')).resolves.toBeNull();
  });

  it('repositorio vazio retorna null', async () => {
    await expect(new InMemoryCouponRepository([]).findByCode('LANC10')).resolves.toBeNull();
  });
});
