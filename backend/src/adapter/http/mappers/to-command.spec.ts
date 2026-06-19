import { UnprocessableEntityException } from '@nestjs/common';
import { toValidateCommand } from './to-command';

const items = [
  { id: 'p1', name: 'A', unitPriceCents: 1000, quantity: 2 },
  { id: 'p2', name: 'B', unitPriceCents: 500, quantity: 1 },
];

describe('adapter/http/mappers/to-command', () => {
  it('mapeia couponCode e itens para o comando', () => {
    expect(toValidateCommand({ couponCode: 'LANC10', cart: { items } })).toEqual({ couponCode: 'LANC10', items });
  });

  it('aceita totalCents coincidente com o subtotal recomputado', () => {
    expect(() => toValidateCommand({ couponCode: 'LANC10', cart: { items, totalCents: 2500 } })).not.toThrow();
  });

  it('rejeita totalCents divergente com 422', () => {
    expect(() => toValidateCommand({ couponCode: 'LANC10', cart: { items, totalCents: 9999 } })).toThrow(
      UnprocessableEntityException,
    );
  });

  it('aceita ausencia de totalCents', () => {
    expect(() => toValidateCommand({ couponCode: 'LANC10', cart: { items } })).not.toThrow();
  });
});
