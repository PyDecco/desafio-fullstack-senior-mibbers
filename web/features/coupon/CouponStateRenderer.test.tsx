import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CouponStateRenderer } from '@/features/coupon/CouponStateRenderer';
import { DiscountType, RejectionReason } from '@/types/api';
import type { AppliedBreakdown, CouponState } from '@/types/coupon';

const norm = (value: string | null) => (value ?? '').replace(/\s/g, ' ');

const BREAKDOWN: AppliedBreakdown = {
  couponCode: 'LANC10',
  discountType: DiscountType.Percentage,
  subtotalCents: 19900,
  discountCents: 1990,
  finalCents: 17910,
};

describe('CouponStateRenderer', () => {
  it('idle nao renderiza nada', () => {
    const { container } = render(<CouponStateRenderer state={{ kind: 'idle' }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('loading nao renderiza nada (o loading vai no botao)', () => {
    const { container } = render(<CouponStateRenderer state={{ kind: 'loading', couponCode: 'X' }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('applied mostra o resumo completo e a badge', () => {
    render(<CouponStateRenderer state={{ kind: 'applied', breakdown: BREAKDOWN }} />);
    expect(screen.getByText(/Cupom aplicado/)).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText(/179,10/)).toBeInTheDocument();
  });

  it('rejected mostra a copy mapeada do reason', () => {
    render(
      <CouponStateRenderer state={{ kind: 'rejected', couponCode: 'EXPIRED', rejection: { reason: RejectionReason.Expired } }} />,
    );
    expect(screen.getByText('Esse cupom expirou')).toBeInTheDocument();
  });

  it('MINIMUM_NOT_MET mostra quanto falta', () => {
    render(
      <CouponStateRenderer
        state={{
          kind: 'rejected',
          couponCode: 'LANC10',
          rejection: { reason: RejectionReason.MinimumNotMet, missingCents: 4000 },
        }}
      />,
    );
    expect(norm(screen.getByText(/Faltam/).textContent)).toBe('Faltam R$ 40,00 para desbloquear');
  });

  it('invalid_request mostra copy generica, sem vazar detalhe tecnico', () => {
    render(<CouponStateRenderer state={{ kind: 'invalid_request', couponCode: 'X' }} />);
    expect(screen.getByText('Não foi possível validar')).toBeInTheDocument();
    expect(screen.queryByText(/Unprocessable|totalCents|invalido/i)).toBeNull();
  });

  it('network_error mostra a mensagem de conexao', () => {
    render(<CouponStateRenderer state={{ kind: 'network_error', couponCode: 'X' }} />);
    expect(screen.getByText(/Erro de conexão/)).toBeInTheDocument();
  });

  it('revalidating mantem o resultado anterior visivel com aria-busy', () => {
    const state: CouponState = { kind: 'revalidating', couponCode: 'LANC10', previous: BREAKDOWN };
    const { container } = render(<CouponStateRenderer state={state} />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.getByText(/Cupom aplicado/)).toBeInTheDocument();
  });
});
