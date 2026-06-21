import { assertNever, formatBRL } from '@/lib/utils';
import { INVALID_REQUEST_MESSAGE, NETWORK_ERROR_MESSAGE, rejectionCopy } from '@/lib/messages';
import type { AppliedBreakdown, CouponState, Rejection } from '@/types/coupon';
import { Badge, PriceRow } from '@/components/ui';

export function CouponStateRenderer({ state }: { state: CouponState }) {
  switch (state.kind) {
    case 'idle':
      return null;
    case 'loading':
      return null;
    case 'applied':
      return <AppliedSummary breakdown={state.breakdown} />;
    case 'revalidating':
      return (
        <div aria-busy="true" className="opacity-60 transition-opacity duration-150 motion-reduce:transition-none">
          {'reason' in state.previous ? (
            <RejectionMessage rejection={state.previous} />
          ) : (
            <AppliedSummary breakdown={state.previous} />
          )}
        </div>
      );
    case 'rejected':
      return <RejectionMessage rejection={state.rejection} />;
    case 'invalid_request':
      return <Message>{INVALID_REQUEST_MESSAGE}</Message>;
    case 'network_error':
      return <Message>{NETWORK_ERROR_MESSAGE}</Message>;
    default:
      return assertNever(state);
  }
}

function AppliedSummary({ breakdown }: { breakdown: AppliedBreakdown }) {
  return (
    <div className="space-y-3 transition-opacity duration-150 motion-reduce:transition-none">
      <PriceRow label="Subtotal" value={formatBRL(breakdown.subtotalCents)} muted />
      <PriceRow label="Desconto" value={`− ${formatBRL(breakdown.discountCents)}`} />
      <div className="border-t border-black/10 pt-3">
        <PriceRow label="Total" value={formatBRL(breakdown.finalCents)} emphasis />
      </div>
      <Badge>
        <span aria-hidden="true">✓</span> Cupom aplicado · {breakdown.couponCode}
      </Badge>
    </div>
  );
}

function RejectionMessage({ rejection }: { rejection: Rejection }) {
  return <p className="text-[15px] text-[#bf4800]">{rejectionCopy(rejection)}</p>;
}

function Message({ children }: { children: string }) {
  return <p className="text-[15px] text-[#bf4800]">{children}</p>;
}
