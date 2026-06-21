import { Stepper } from '@/components/ui';
import { formatBRL } from '@/lib/utils';
import type { CartItemDto } from '@/types/api';
import type { Product } from '@/features/coupon/catalog';

interface CartListProps {
  items: CartItemDto[];
  available: Product[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (product: Product) => void;
}

export function CartList({ items, available, onIncrement, onDecrement, onRemove, onAdd }: CartListProps) {
  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-[#1d1d1f]">{item.name}</p>
              <p className="text-[13px] text-black/50">{formatBRL(item.unitPriceCents)} cada</p>
            </div>
            <Stepper
              quantity={item.quantity}
              label={item.name}
              onIncrement={() => onIncrement(item.id)}
              onDecrement={() => onDecrement(item.id)}
            />
            <span className="w-20 text-right text-[15px] tabular-nums text-[#1d1d1f]">
              {formatBRL(item.unitPriceCents * item.quantity)}
            </span>
            <button
              type="button"
              aria-label={`Remover ${item.name}`}
              onClick={() => onRemove(item.id)}
              disabled={items.length === 1}
              className="grid h-8 w-8 place-items-center rounded-full text-lg text-black/40 transition-colors duration-150 hover:bg-black/5 hover:text-black/70 disabled:cursor-not-allowed disabled:text-black/15 disabled:hover:bg-transparent disabled:hover:text-black/15 motion-reduce:transition-none"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {available.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-black/10 pt-4">
          {available.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onAdd(product)}
              className="rounded-full border border-black/10 px-3 py-1.5 text-[13px] text-[#1d1d1f] transition-colors duration-150 hover:bg-black/5 motion-reduce:transition-none"
            >
              + {product.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
