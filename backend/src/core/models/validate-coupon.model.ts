import type { CartItem } from './cart.model';
import type { DiscountType } from './discount.model';
import type { RejectionCode } from './rejection.model';
import type { Cents } from './money.model';

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
  | { valid: false; reason: RejectionCode; subtotalCents: Cents; missingCents: number | null };
