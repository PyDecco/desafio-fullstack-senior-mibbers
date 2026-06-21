export enum RejectionReason {
  NotFound = 'COUPON_NOT_FOUND',
  Inactive = 'COUPON_INACTIVE',
  NotStarted = 'COUPON_NOT_STARTED',
  Expired = 'COUPON_EXPIRED',
  LimitReached = 'REDEMPTION_LIMIT_REACHED',
  MinimumNotMet = 'MINIMUM_NOT_MET',
}

export type NonMinimumReason = Exclude<RejectionReason, RejectionReason.MinimumNotMet>;

export enum DiscountType {
  Percentage = 'PERCENTAGE',
  Fixed = 'FIXED',
}

export interface CartItemDto {
  id: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

export interface ValidateCouponRequest {
  couponCode: string;
  cart: { items: CartItemDto[] };
}

export type ValidateCouponResponse =
  | {
      valid: true;
      couponCode: string;
      discountType: DiscountType;
      subtotalCents: number;
      discountCents: number;
      finalCents: number;
    }
  | { valid: false; reason: NonMinimumReason; message: string; subtotalCents: number }
  | { valid: false; reason: RejectionReason.MinimumNotMet; message: string; subtotalCents: number; missingCents: number };

export interface ValidationError422 {
  statusCode: 422;
  error: string;
  message: string | string[];
}
