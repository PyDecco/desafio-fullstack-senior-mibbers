import { computeSubtotal } from './cart';
import type { CartItem } from './models';

const item = (unitPriceCents: number, quantity: number): CartItem => ({
  id: 'p',
  name: 'x',
  unitPriceCents,
  quantity,
});

describe('core/cart - computeSubtotal', () => {
  it('carrinho vazio resulta em 0', () => {
    expect(computeSubtotal([])).toBe(0);
  });

  it('um item: preco * quantidade', () => {
    expect(computeSubtotal([item(1990, 1)])).toBe(1990);
  });

  it('quantidade multiplica', () => {
    expect(computeSubtotal([item(1990, 3)])).toBe(5970);
  });

  it('soma multiplos itens', () => {
    expect(computeSubtotal([item(1000, 2), item(500, 1)])).toBe(2500);
  });

  it('item de preco 0 contribui com 0', () => {
    expect(computeSubtotal([item(0, 5)])).toBe(0);
  });

  it('rejeita preco negativo', () => {
    expect(() => computeSubtotal([item(-1, 1)])).toThrow();
  });

  it('rejeita quantidade negativa', () => {
    expect(() => computeSubtotal([item(100, -1)])).toThrow();
  });
});
