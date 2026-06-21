export type Cents = number;

export interface CartItem {
  id: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
}

export enum DiscountType {
  Percentage = 'PERCENTAGE',
  Fixed = 'FIXED',
}

export interface DiscountInput {
  discountType: DiscountType;
  discountValue: number;
  maxDiscountCents: number | null;
}

export interface Breakdown {
  subtotalCents: Cents;
  discountCents: Cents;
  finalCents: Cents;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountCents: number | null;
  minPurchaseCents: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  active: boolean;
  createdAt: string;
}

export interface EvaluationContext {
  now: Date;
  subtotalCents: Cents;
}

export enum RejectionCode {
  NotFound = 'COUPON_NOT_FOUND',
  Inactive = 'COUPON_INACTIVE',
  NotStarted = 'COUPON_NOT_STARTED',
  Expired = 'COUPON_EXPIRED',
  LimitReached = 'REDEMPTION_LIMIT_REACHED',
  MinimumNotMet = 'MINIMUM_NOT_MET',
}

export type Rejection =
  | { reason: Exclude<RejectionCode, RejectionCode.MinimumNotMet> }
  | { reason: RejectionCode.MinimumNotMet; missingCents: number };

export type ValidationResult =
  | { valid: true; breakdown: Breakdown }
  | { valid: false; rejection: Rejection };

export interface ValidateCouponCommand {
  couponCode: string;
  items: CartItem[];
}

export type ValidationOutcome =
  | {
      valid: true;
      couponCode: string;
      discountType: DiscountType;
      subtotalCents: Cents;
      discountCents: Cents;
      finalCents: Cents;
    }
  | { valid: false; reason: Exclude<RejectionCode, RejectionCode.MinimumNotMet>; subtotalCents: Cents }
  | { valid: false; reason: RejectionCode.MinimumNotMet; subtotalCents: Cents; missingCents: number };
