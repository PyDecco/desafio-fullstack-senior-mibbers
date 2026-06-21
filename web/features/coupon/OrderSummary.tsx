import { formatBRL } from '@/lib/utils';
import { PriceRow } from '@/components/ui';
import { CouponStateRenderer } from '@/features/coupon/CouponStateRenderer';
import type { CouponState } from '@/types/coupon';

export function OrderSummary({ state, clientSubtotalCents }: { state: CouponState; clientSubtotalCents: number }) {
  const rendererOwnsSubtotal =
    state.kind === 'applied' || (state.kind === 'revalidating' && !('reason' in state.previous));

  return (
    <div className="space-y-3">
      {!rendererOwnsSubtotal && <PriceRow label="Subtotal" value={formatBRL(clientSubtotalCents)} />}
      <div aria-live="polite">
        <CouponStateRenderer state={state} />
      </div>
    </div>
  );
}
