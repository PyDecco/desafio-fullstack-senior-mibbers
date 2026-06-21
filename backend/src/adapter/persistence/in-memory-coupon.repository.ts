import type { Coupon } from '../../core/models';
import type { CouponRepository } from '../../ports/coupon-repository';

export class InMemoryCouponRepository implements CouponRepository {
  private readonly byCode: Map<string, Coupon>;

  constructor(coupons: Coupon[]) {
    this.byCode = new Map(coupons.map((coupon) => [coupon.code, coupon]));
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.byCode.get(code) ?? null;
  }
}
