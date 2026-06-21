'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CartItemDto } from '@/types/api';
import { useCart } from '@/hooks/useCart';
import { useCoupon } from '@/hooks/useCoupon';
import { CartList } from '@/features/coupon/CartList';
import { CouponInput } from '@/features/coupon/CouponInput';
import { CouponHints } from '@/features/coupon/CouponHints';
import { OrderSummary } from '@/features/coupon/OrderSummary';
import { SEED_CODES, type Product } from '@/features/coupon/catalog';

interface CheckoutProps {
  catalog: Product[];
  initialCart: CartItemDto[];
}

export function Checkout({ catalog, initialCart }: CheckoutProps) {
  const cart = useCart(initialCart);
  const coupon = useCoupon(cart.items);
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingFocus = useRef(false);

  const available = useMemo(
    () => catalog.filter((product) => !cart.items.some((item) => item.id === product.id)),
    [catalog, cart.items],
  );

  const { kind } = coupon.state;
  const loading = kind === 'loading';
  const settled =
    kind === 'applied' || kind === 'rejected' || kind === 'invalid_request' || kind === 'network_error';

  useEffect(() => {
    if (settled && pendingFocus.current) {
      pendingFocus.current = false;
      inputRef.current?.focus();
    }
  }, [settled, kind]);

  const handleApply = () => {
    pendingFocus.current = true;
    coupon.apply(code);
  };

  const handleClear = () => {
    coupon.clear();
    setCode('');
    inputRef.current?.focus();
  };

  const handleSelectHint = (hint: string) => {
    setCode(hint);
    inputRef.current?.focus();
  };

  return (
    <section className="w-full max-w-[480px] space-y-8 rounded-3xl border border-black/5 bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Finalizar compra</h1>
        <p className="text-[15px] text-black/50">Revise os itens e aplique um cupom.</p>
      </header>

      <CartList
        items={cart.items}
        available={available}
        onIncrement={cart.increment}
        onDecrement={cart.decrement}
        onRemove={cart.remove}
        onAdd={cart.add}
      />

      <div className="space-y-3 border-t border-black/10 pt-6">
        <CouponInput
          value={code}
          onChange={setCode}
          onApply={handleApply}
          onClear={handleClear}
          loading={loading}
          showClear={kind !== 'idle' && !loading}
          inputRef={inputRef}
        />
        <CouponHints codes={SEED_CODES} onSelect={handleSelectHint} />
      </div>

      <div className="border-t border-black/10 pt-6">
        <OrderSummary state={coupon.state} clientSubtotalCents={cart.subtotalCents} />
      </div>
    </section>
  );
}
