import { useCallback, useMemo, useState } from 'react';
import type { CartItemDto } from '@/types/api';
import type { Product } from '@/features/coupon/catalog';

const MAX_QUANTITY = 99;

export interface UseCart {
  items: CartItemDto[];
  subtotalCents: number;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  add: (product: Product) => void;
}

export function useCart(initial: CartItemDto[]): UseCart {
  const [items, setItems] = useState<CartItemDto[]>(initial);

  const increment = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, quantity: Math.min(line.quantity + 1, MAX_QUANTITY) } : line,
      ),
    );
  }, []);

  const decrement = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, quantity: Math.max(line.quantity - 1, 1) } : line,
      ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const add = useCallback((product: Product) => {
    setItems((prev) =>
      prev.some((line) => line.id === product.id) ? prev : [...prev, { ...product, quantity: 1 }],
    );
  }, []);

  const subtotalCents = useMemo(
    () => items.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0),
    [items],
  );

  return { items, subtotalCents, increment, decrement, remove, add };
}
