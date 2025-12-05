export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  salesCount: number;
  user_id?: string;
  status: 'approved' | 'rejected' | 'pending';
  rejectionReason?: string;
  whatsapp?: string;
  pixelId?: string;
  analyticsId?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  created_at?: string;
  user_id?: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  date: string;
  amount: number;
  method: 'Credit Card' | 'PIX' | 'Google Pay' | 'Apple Pay';
  status: 'Completed' | 'Pending' | 'Failed';
  customerName: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
  read: boolean;
  created_at: string;
}

export enum AppRoute {
  WELCOME = '/',
  LOGIN = '/login',
  REGISTER = '/register',
  DASHBOARD = '/dashboard',
  PRODUCTS = '/products',
  LINKS = '/links',
  REPORTS = '/reports',
  SETTINGS = '/settings',
  SUPPORT = '/support'
}

export interface ChartData {
  name: string;
  value: number;
  amt?: number;
}