import { seedCoupons } from './seed';
import { DiscountType } from '../../core/models/discount.model';

const byCode = () => new Map(seedCoupons().map((c) => [c.code, c]));

describe('adapter/persistence/seed', () => {
  it('inclui os cupons da matriz de edge cases', () => {
    const codes = seedCoupons().map((c) => c.code);
    for (const code of ['LANC10', 'BLACK50', 'MEGA90', 'FIXOVER', 'NORESTR', 'PCT100', 'EXPIRED', 'SOON', 'FULL', 'OFF']) {
      expect(codes).toContain(code);
    }
  });

  it('FULL tem redemptionCount igual a maxRedemptions', () => {
    const full = byCode().get('FULL');
    expect(full?.redemptionCount).toBe(full?.maxRedemptions);
  });

  it('OFF esta inativo', () => {
    expect(byCode().get('OFF')?.active).toBe(false);
  });

  it('BLACK50 e desconto fixo', () => {
    expect(byCode().get('BLACK50')?.discountType).toBe(DiscountType.Fixed);
  });

  it('MEGA90 tem teto de desconto', () => {
    expect(byCode().get('MEGA90')?.maxDiscountCents).toBe(3000);
  });

  it('os codes sao unicos', () => {
    const codes = seedCoupons().map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
