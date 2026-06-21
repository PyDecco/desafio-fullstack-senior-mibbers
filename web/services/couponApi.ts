import type { ValidateCouponRequest } from '@/types/api';
import type { CouponState } from '@/types/coupon';
import { mapResponse } from '@/services/mapResponse';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function validateCoupon(
  request: ValidateCouponRequest,
  signal?: AbortSignal,
): Promise<CouponState> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    return { kind: 'network_error', couponCode: request.couponCode };
  }

  const body: unknown = await response.json().catch(() => null);
  return mapResponse(response.status, body, request.couponCode);
}
