import { parseCoupon } from '../../core/coupon';
import { DiscountType, type Coupon } from '../../core/models';

const CREATED_AT = '2026-01-01T00:00:00Z';
const PAST = '2020-01-01T00:00:00Z';
const FUTURE = '2099-01-01T00:00:00Z';

export function seedCoupons(): Coupon[] {
  return [
    parseCoupon({
      id: '1', code: 'LANC10', description: '10% de lancamento', discountType: DiscountType.Percentage,
      discountValue: 10, maxDiscountCents: null, minPurchaseCents: 5000, startsAt: null, expiresAt: null,
      maxRedemptions: 100, redemptionCount: 12, active: true, createdAt: CREATED_AT,
    }),
    parseCoupon({
      id: '2', code: 'BLACK50', description: 'R$50 fixo', discountType: DiscountType.Fixed,
      discountValue: 5000, maxDiscountCents: null, minPurchaseCents: 10000, startsAt: null, expiresAt: null,
      maxRedemptions: null, redemptionCount: 0, active: true, createdAt: CREATED_AT,
    }),
    parseCoupon({
      id: '3', code: 'MEGA90', description: '90% com teto de R$30', discountType: DiscountType.Percentage,
      discountValue: 90, maxDiscountCents: 3000, minPurchaseCents: null, startsAt: null, expiresAt: null,
      maxRedemptions: null, redemptionCount: 0, active: true, createdAt: CREATED_AT,
    }),
    parseCoupon({
      id: '4', code: 'FIXOVER', description: 'Fixo R$500 (maior que carrinhos pequenos)', discountType: DiscountType.Fixed,
      discountValue: 50000, maxDiscountCents: null, minPurchaseCents: null, startsAt: null, expiresAt: null,
      maxRedemptions: null, redemptionCount: 0, active: true, createdAt: CREATED_AT,
    }),
    parseCoupon({
      id: '5', code: 'NORESTR', description: '10% sem restricao', discountType: DiscountType.Percentage,
      discountValue: 10, maxDiscountCents: null, minPurchaseCents: null, startsAt: null, expiresAt: null,
      maxRedemptions: null, redemptionCount: 0, active: true, createdAt: CREATED_AT,
    }),
    parseCoupon({
      id: '6', code: 'PCT100', description: '100%', discountType: DiscountType.Percentage,
      discountValue: 100, maxDiscountCents: null, minPurchaseCents: null, startsAt: null, expiresAt: null,
      maxRedemptions: null, redemptionCount: 0, active: true, createdAt: CREATED_AT,
    }),
    parseCoupon({
      id: '7', code: 'EXPIRED', description: 'Expirado', discountType: DiscountType.Percentage,
      discountValue: 10, maxDiscountCents: null, minPurchaseCents: null, startsAt: null, expiresAt: PAST,
      maxRedemptions: null, redemptionCount: 0, active: true, createdAt: CREATED_AT,
    }),
    parseCoupon({
      id: '8', code: 'SOON', description: 'Ainda nao iniciado', discountType: DiscountType.Percentage,
      discountValue: 10, maxDiscountCents: null, minPurchaseCents: null, startsAt: FUTURE, expiresAt: null,
      maxRedemptions: null, redemptionCount: 0, active: true, createdAt: CREATED_AT,
    }),
    parseCoupon({
      id: '9', code: 'FULL', description: 'Limite atingido', discountType: DiscountType.Percentage,
      discountValue: 10, maxDiscountCents: null, minPurchaseCents: null, startsAt: null, expiresAt: null,
      maxRedemptions: 100, redemptionCount: 100, active: true, createdAt: CREATED_AT,
    }),
    parseCoupon({
      id: '10', code: 'OFF', description: 'Inativo', discountType: DiscountType.Percentage,
      discountValue: 10, maxDiscountCents: null, minPurchaseCents: null, startsAt: null, expiresAt: null,
      maxRedemptions: null, redemptionCount: 0, active: false, createdAt: CREATED_AT,
    }),
  ];
}
