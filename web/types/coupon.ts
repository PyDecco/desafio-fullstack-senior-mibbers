import type { DiscountType, NonMinimumReason, RejectionReason } from '@/types/api';

export interface AppliedBreakdown {
  couponCode: string;
  discountType: DiscountType;
  subtotalCents: number;
  discountCents: number;
  finalCents: number;
}

export type Rejection =
  | { reason: NonMinimumReason }
  | { reason: RejectionReason.MinimumNotMet; missingCents: number };

export type CouponState =
  | { kind: 'idle' }
  | { kind: 'loading'; couponCode: string }
  | { kind: 'applied'; breakdown: AppliedBreakdown }
  | { kind: 'rejected'; couponCode: string; rejection: Rejection }
  | { kind: 'invalid_request'; couponCode: string }
  | { kind: 'network_error'; couponCode: string }
  | { kind: 'revalidating'; previous: AppliedBreakdown | Rejection; couponCode: string };
