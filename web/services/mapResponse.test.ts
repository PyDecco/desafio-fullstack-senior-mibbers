import { describe, it, expect } from 'vitest';
import { mapResponse } from '@/services/mapResponse';
import { DiscountType, RejectionReason } from '@/types/api';

describe('mapResponse', () => {
  it('200 valido -> applied com o breakdown', () => {
    const state = mapResponse(
      200,
      {
        valid: true,
        couponCode: 'LANC10',
        discountType: DiscountType.Percentage,
        subtotalCents: 19900,
        discountCents: 1990,
        finalCents: 17910,
      },
      'LANC10',
    );
    expect(state).toEqual({
      kind: 'applied',
      breakdown: {
        couponCode: 'LANC10',
        discountType: DiscountType.Percentage,
        subtotalCents: 19900,
        discountCents: 1990,
        finalCents: 17910,
      },
    });
  });

  it('200 valido de 100% -> finalCents 0', () => {
    const state = mapResponse(
      200,
      { valid: true, couponCode: 'PCT100', discountType: DiscountType.Percentage, subtotalCents: 19900, discountCents: 19900, finalCents: 0 },
      'PCT100',
    );
    expect(state.kind).toBe('applied');
    if (state.kind === 'applied') expect(state.breakdown.finalCents).toBe(0);
  });

  it('200 rejeicao nao-minimo -> rejected sem missingCents', () => {
    const state = mapResponse(
      200,
      { valid: false, reason: RejectionReason.Expired, message: 'Cupom expirado.', subtotalCents: 19900 },
      'EXPIRED',
    );
    expect(state).toEqual({ kind: 'rejected', couponCode: 'EXPIRED', rejection: { reason: RejectionReason.Expired } });
  });

  it('200 MINIMUM_NOT_MET -> rejected carregando missingCents', () => {
    const state = mapResponse(
      200,
      { valid: false, reason: RejectionReason.MinimumNotMet, message: 'Valor minimo...', subtotalCents: 1000, missingCents: 4000 },
      'LANC10',
    );
    expect(state).toEqual({
      kind: 'rejected',
      couponCode: 'LANC10',
      rejection: { reason: RejectionReason.MinimumNotMet, missingCents: 4000 },
    });
  });

  it('422 com message string -> invalid_request, sem vazar a mensagem', () => {
    const state = mapResponse(422, { statusCode: 422, error: 'Unprocessable Entity', message: 'codigo de cupom invalido' }, 'LANC-10');
    expect(state).toEqual({ kind: 'invalid_request', couponCode: 'LANC-10' });
  });

  it('422 com message array -> invalid_request (ignora o shape do body)', () => {
    const state = mapResponse(422, { statusCode: 422, error: 'Unprocessable Entity', message: ['a', 'b'] }, 'X');
    expect(state).toEqual({ kind: 'invalid_request', couponCode: 'X' });
  });

  it('500 -> network_error', () => {
    expect(mapResponse(500, null, 'X')).toEqual({ kind: 'network_error', couponCode: 'X' });
  });

  it('200 com body invalido -> network_error', () => {
    expect(mapResponse(200, { foo: 'bar' }, 'X')).toEqual({ kind: 'network_error', couponCode: 'X' });
    expect(mapResponse(200, null, 'X')).toEqual({ kind: 'network_error', couponCode: 'X' });
  });
});
