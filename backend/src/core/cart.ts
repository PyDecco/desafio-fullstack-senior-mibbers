import { addCents, mulCents } from './money';
import type { Cents, CartItem } from './models';

export function computeSubtotal(items: CartItem[]): Cents {
  return items.reduce((sum, item) => addCents(sum, mulCents(item.unitPriceCents, item.quantity)), 0);
}
