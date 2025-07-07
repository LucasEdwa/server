export interface CartItem {
  product_id: number;
  quantity: number;
  price: number;
  description?: string;
  size?: string;
  color?: string;
}

export interface Cart {
  user_id: number;
  items: CartItem[];
  total_price: number;
  created_at: Date;
  updated_at: Date;
}

export interface CartItemUpdate {
  product_id: number;
  quantity?: number; 
  price?: number; 
  description?: string; 
  size?: string; 
  color?: string; 
}