const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://printx-cib8.onrender.com/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('printx_admin_token');
}

export function setAuthSession(token: string, user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('printx_admin_token', token);
  localStorage.setItem('printx_admin_user', JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('printx_admin_token');
  localStorage.removeItem('printx_admin_user');
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'API request failed');
  }

  return json.data;
}

export async function loginAdmin(email: string, password: string) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerOwner(data: { name: string; email: string; password: string; phone?: string }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...data, role: 'SHOP_OWNER' }),
  });
}

export async function createShop(data: { name: string; slug: string; address?: string; phone?: string; email?: string; upiId?: string }) {
  return apiRequest('/shops', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchShopDetails(shopId: string) {
  return apiRequest(`/shops/${shopId}`);
}
