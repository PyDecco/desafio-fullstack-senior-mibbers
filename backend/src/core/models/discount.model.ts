import type { Cents } from './money.model';

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
