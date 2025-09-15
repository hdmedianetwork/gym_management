// Utility to create Cashfree payment session via backend
const getApiBase = () => {
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();

  // If an env URL is provided, always use it (works for production & staging)
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  // In development, prefer local backend
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = import.meta.env.DEV || host === 'localhost' || host === '127.0.0.1';
    if (isLocal) return 'http://localhost:5000';
    // Otherwise default to same origin in environments without explicit backend URL
    return window.location.origin;
  }

  // Fallback for non-browser contexts
  return 'http://localhost:5000';
};

export async function createCashfreeSession({ 
  orderId, 
  orderAmount, 
  customerName, 
  customerEmail, 
  customerPhone, 
  returnUrl, 
  planType, 
  planAmount, 
  planDuration, 
  couponCode 
}) {
  const API_URL = getApiBase();
  try { console.info('[Payment] Using API base:', API_URL); } catch (_) {}
  const res = await fetch(`${API_URL}/api/payment/create-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      orderId, 
      orderAmount, 
      customerName, 
      customerEmail, 
      customerPhone, 
      returnUrl, 
      planType, 
      planAmount, 
      planDuration, 
      couponCode 
    })
  });
  let data;
  try {
    data = await res.json();
  } catch (_) {
    // ignore parse error
  }
  if (!res.ok) {
    const message = data?.error?.message || data?.error || data?.message || `Failed to create payment session (HTTP ${res.status})`;
    throw new Error(message);
  }
  return data;
}
