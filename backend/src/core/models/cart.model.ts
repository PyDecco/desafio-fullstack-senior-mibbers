export interface CartItem {
  id: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
}
