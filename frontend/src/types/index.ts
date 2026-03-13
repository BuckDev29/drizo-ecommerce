export interface Category {
  id: number;
  name: string;
  slug: string;
  gender: string;
  image_url?: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image_url: string;
  category_id: number;
  created_at: string;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  // Joined from product
  name?: string;
  price?: string;
  image_url?: string;
}

export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  created_at: string;
  // Joined from product
  name?: string;
  price?: string;
  image_url?: string;
}
