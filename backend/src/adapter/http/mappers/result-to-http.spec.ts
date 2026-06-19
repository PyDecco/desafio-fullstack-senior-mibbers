import { toValidateResponse } from './result-to-http';
import { DiscountType } from '../../../core/models/discount.model';
import { RejectionCode } from '../../../core/models/rejection.model';

describe('adapter/http/mappers/result-to-http', () => {
  it('formata sucesso sem reason/message/missingCents', () => {
    expect(
      toValidateResponse({
        valid: true,
        couponCode: 'LANC10',
        discountType: DiscountType.Percentage,
        subtotalCents: 19900,
        discountCents: 1990,
        finalCents: 17910,
      }),
    ).toEqual({
      valid: true,
      couponCode: 'LANC10',
      discountType: DiscountType.Percentage,
      subtotalCents: 19900,
      discountCents: 1990,
      finalCents: 17910,
    });
  });

  it('formata rejeicao com reason, message e subtotal, sem missingCents', () => {
    const body = toValidateResponse({ valid: false, reason: RejectionCode.Expired, subtotalCents: 19900, missingCents: null });
    expect(body).toEqual({ valid: false, reason: RejectionCode.Expired, message: expect.any(String), subtotalCents: 19900 });
    expect(body).not.toHaveProperty('missingCents');
  });

  it('inclui missingCents apenas no MINIMUM_NOT_MET', () => {
    const body = toValidateResponse({ valid: false, reason: RejectionCode.MinimumNotMet, subtotalCents: 3000, missingCents: 2000 });
    expect(body).toMatchObject({ valid: false, reason: RejectionCode.MinimumNotMet, subtotalCents: 3000, missingCents: 2000 });
  });

  it('message e string nao-vazia para cada reason', () => {
    for (const reason of Object.values(RejectionCode)) {
      const body = toValidateResponse({ valid: false, reason, subtotalCents: 0, missingCents: null });
      expect((body as { message: string }).message.length).toBeGreaterThan(0);
    }
  });
});
