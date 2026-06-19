import type { Breakdown } from './discount.model';

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
