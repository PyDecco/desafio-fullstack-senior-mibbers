import type { CartItemDto } from '@/types/api';

export interface Product {
  id: string;
  name: string;
  unitPriceCents: number;
}

const CAPA_SILICONE: Product = { id: 'capa-silicone', name: 'Capa de Silicone', unitPriceCents: 4490 };
const CABO_USBC: Product = { id: 'cabo-usbc', name: 'Cabo USB-C (1 m)', unitPriceCents: 1990 };
const AIRTAG: Product = { id: 'airtag', name: 'AirTag', unitPriceCents: 2990 };

export const CATALOG: Product[] = [CAPA_SILICONE, CABO_USBC, AIRTAG];

export const INITIAL_CART: CartItemDto[] = [
  { ...CAPA_SILICONE, quantity: 1 },
  { ...CABO_USBC, quantity: 1 },
];

export const SEED_CODES = [
  'LANC10',
  'BLACK50',
  'MEGA90',
  'FIXOVER',
  'PCT100',
  'NORESTR',
  'EXPIRED',
  'SOON',
  'FULL',
  'OFF',
];
