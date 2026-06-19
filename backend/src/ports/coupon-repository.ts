import type { Coupon } from '../core/models/coupon.model';

export const COUPON_REPOSITORY = Symbol('COUPON_REPOSITORY');

export interface CouponRepository {
  findByCode(code: string): Promise<Coupon | null>;
}
