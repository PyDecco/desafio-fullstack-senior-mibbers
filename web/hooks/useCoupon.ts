import { useCallback, useEffect, useRef, useState } from 'react';
import type { CartItemDto } from '@/types/api';
import type { CouponState } from '@/types/coupon';
import { validateCoupon } from '@/services/couponApi';

const REVALIDATE_DELAY_MS = 300;

export interface UseCoupon {
  state: CouponState;
  apply: (code: string) => void;
  clear: () => void;
}

export function useCoupon(items: CartItemDto[]): UseCoupon {
  const [state, setState] = useState<CouponState>({ kind: 'idle' });
  const submittedCode = useRef<string | null>(null);
  const reqId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((code: string, currentItems: CartItemDto[], mode: 'apply' | 'revalidate') => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    const id = ++reqId.current;

    setState((prev) =>
      mode === 'revalidate' && (prev.kind === 'applied' || prev.kind === 'rejected')
        ? {
            kind: 'revalidating',
            previous: prev.kind === 'applied' ? prev.breakdown : prev.rejection,
            couponCode: code,
          }
        : { kind: 'loading', couponCode: code },
    );

    validateCoupon({ couponCode: code, cart: { items: currentItems } }, ctrl.signal)
      .then((next) => {
        if (id === reqId.current) setState(next);
      })
      .catch(() => {});
  }, []);

  const apply = useCallback(
    (code: string) => {
      const trimmed = code.trim();
      if (trimmed === '') return;
      if (timer.current) clearTimeout(timer.current);
      submittedCode.current = trimmed;
      run(trimmed, items, 'apply');
    },
    [items, run],
  );

  const clear = useCallback(() => {
    controller.current?.abort();
    reqId.current++;
    submittedCode.current = null;
    if (timer.current) clearTimeout(timer.current);
    setState({ kind: 'idle' });
  }, []);

  useEffect(() => {
    const code = submittedCode.current;
    if (code === null) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => run(code, items, 'revalidate'), REVALIDATE_DELAY_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [items, run]);

  useEffect(
    () => () => {
      controller.current?.abort();
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { state, apply, clear };
}
