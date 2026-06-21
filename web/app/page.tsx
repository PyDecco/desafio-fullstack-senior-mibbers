import { Checkout } from '@/features/coupon/Checkout';
import { CATALOG, INITIAL_CART } from '@/features/coupon/catalog';

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Checkout catalog={CATALOG} initialCart={INITIAL_CART} />
    </main>
  );
}
