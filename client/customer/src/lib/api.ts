const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://printx-cib8.onrender.com/api';

export async function fetchShopBySlug(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/shops/public/${slug}`, {
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch shop details');
    }
    return json.data;
  } catch (err: any) {
    console.warn('fetchShopBySlug warn:', err.message);
    throw err;
  }
}

export async function startCustomerSession(shopSlug: string, customerPhone?: string) {
  const res = await fetch(`${API_BASE_URL}/customer-sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shopSlug, customerPhone }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to start customer session');
  }
  return json.data;
}

export async function fetchAllShops() {
  try {
    const res = await fetch(`${API_BASE_URL}/shops/all`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('fetchAllShops network error, returning fallback:', err);
    return [];
  }
}

export async function calculateOrderPrice(data: {
  shopId: string;
  documentId: string;
  paperSize: string;
  colorMode: string;
  printSide: string;
  copies: number;
  pageRange?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/orders/calculate-price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to calculate price');
  }
  return json.data;
}

export async function createOrder(data: {
  shopId: string;
  customerSessionId: string;
  documentId: string;
  paperSize: string;
  colorMode: string;
  printSide: string;
  copies: number;
  pageRange?: string;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to create order');
  }
  return json.data;
}

export async function getOrder(orderNumber: string) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderNumber}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch order');
  }
  return json.data;
}

export async function simulateOrderPayment(orderNumber: string) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderNumber}/pay-simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId: `UPI-${Date.now()}` }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Payment simulation failed');
  }
  return json.data;
}
